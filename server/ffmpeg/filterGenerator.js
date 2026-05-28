import { createCanvas, registerFont } from 'canvas';

export function buildFilterComplex(parsedTimeline, project, framesStream, fps = 30) {
  const inputs = [];
  const filters = [];
  
  const w = project.resolution?.width || 1080;
  const h = project.resolution?.height || 1920;
  const duration = project.duration || 30;

  // 1. Base black video via filtergraph
  filters.push(`color=c=black:s=${w}x${h}:d=${duration}:r=30[base_v]`);
  let currentVideoOut = `base_v`;

  // Process ONLY video layers here (images/text/stickers are in framesDir)
  const visualLayers = [...parsedTimeline.videoLayers];
  visualLayers.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  let inputIndex = 0; // Inputs start at 0

  visualLayers.forEach((layer, idx) => {
    inputs.push(layer.absolutePath);
    const inId = `${inputIndex}:v`;
    const inAudioId = `${inputIndex}:a`; 
    
    layer._inputIndex = inputIndex;

    const scaledId = `scaled_${idx}`;
    let processStream = inId;

    const start = layer.startTime || 0;
    const end = start + (layer.duration || 5);

    if (layer.type === 'video') {
      const sourceStart = layer.sourceStart || 0;
      const layerDuration = layer.duration || 5;
      const speed = layer.speed || 1;
      const trimId = `trim_v_${idx}`;
      // CRITICAL FIX: Add +${start}/TB so the video's presentation timestamp aligns with its absolute start time.
      // Otherwise, overlay matches timestamps and swallows the first `start` seconds of the video!
      filters.push(`[${processStream}]trim=start=${sourceStart}:end=${sourceStart + (layerDuration * speed)},setpts=${1/speed}*(PTS-STARTPTS)+${start}/TB[${trimId}]`);
      processStream = trimId;
    }
    
    filters.push(`[${processStream}]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black@0,format=rgba[${scaledId}]`);
    
    let fadeFilters = '';
    const fadeDur = 0.5; 
    if (layer.transitions?.in === 'fade') {
      fadeFilters += `,fade=t=in:st=${start}:d=${fadeDur}:alpha=1`;
    }
    if (layer.transitions?.out === 'fade' || (idx < visualLayers.length - 1 && visualLayers[idx+1].startTime < end)) {
      fadeFilters += `,fade=t=out:st=${end - fadeDur}:d=${fadeDur}:alpha=1`;
    }

    const fadedId = `faded_${idx}`;
    filters.push(`[${scaledId}]${fadeFilters.substring(1) || 'copy'}[${fadedId}]`); 

    const nextOut = `v_out_${idx}`;
    filters.push(`[${currentVideoOut}][${fadedId}]overlay=x=0:y=0:enable='between(t,${start},${end})'[${nextOut}]`);
    currentVideoOut = nextOut;
    
    inputIndex++;
  });

  // Add the pre-rendered in-memory image sequence overlay
  if (framesStream) {
    inputs.push({
      stream: framesStream,
      format: 'image2pipe',
      options: [`-framerate ${fps}`, '-vcodec png']
    });
    const framesInId = `${inputIndex}:v`;
    const nextOut = `v_out_frames`;
    filters.push(`[${currentVideoOut}][${framesInId}]overlay=x=0:y=0[${nextOut}]`);
    currentVideoOut = nextOut;
    inputIndex++;
  }

  // Audio mix base via filtergraph
  filters.push(`anullsrc=r=44100:cl=stereo:d=${duration}[base_a]`);
  let audioInputsStr = `[base_a]`;
  let amixCount = 1;

  const processAudioSource = (sourceId, layer, layerIdx) => {
    const start = layer.startTime || 0;
    const dur = layer.duration || 5;
    const volume = layer.volume !== undefined ? layer.volume : 1;
    const sourceStart = layer.sourceStart || 0;
    const speed = layer.speed || 1;
    
    let aStream = sourceId;
    
    // Trim, speed, setpts
    const trimId = `a_trim_${layerIdx}`;
    // atempo can handle 0.5 to 100
    filters.push(`[${aStream}]atrim=start=${sourceStart}:end=${sourceStart + (dur * speed)},asetpts=PTS-STARTPTS,atempo=${speed},volume=${volume}[${trimId}]`);
    aStream = trimId;

    // Fades
    const fadeId = `a_fade_${layerIdx}`;
    let fadeFilters = '';
    if (layer.fadeIn) {
      fadeFilters += `afade=type=in:d=${layer.fadeIn},`;
    }
    if (layer.fadeOut) {
      fadeFilters += `afade=type=out:st=${dur - layer.fadeOut}:d=${layer.fadeOut},`;
    }
    
    if (fadeFilters) {
      filters.push(`[${aStream}]${fadeFilters.slice(0, -1)}[${fadeId}]`);
      aStream = fadeId;
    }

    // Delay
    const delayId = `a_delay_${layerIdx}`;
    filters.push(`[${aStream}]adelay=${start * 1000}|${start * 1000}[${delayId}]`);
    
    return `[${delayId}]`;
  };

  parsedTimeline.audioLayers.forEach((layer, idx) => {
    inputs.push(layer.absolutePath);
    audioInputsStr += processAudioSource(`${inputIndex}:a`, layer, `audio_${idx}`);
    amixCount++;
    inputIndex++;
  });
  
  // Mix in video audio if they exist and are not muted
  parsedTimeline.videoLayers.forEach((layer, idx) => {
    if (!layer.muted) {
       // Check if video actually has audio (this can fail if video has no audio stream)
       // We'll wrap in a safe fallback or accept the risk for MVP
       audioInputsStr += processAudioSource(`${layer._inputIndex}:a`, layer, `video_${idx}`);
       amixCount++;
    }
  });

  const currentAudioOut = `a_out`;
  if (amixCount > 1) {
    // amix norm=0 ensures volume doesn't drop when mixing multiple streams
    filters.push(`${audioInputsStr}amix=inputs=${amixCount}:duration=first:dropout_transition=0:normalize=0[${currentAudioOut}]`);
  } else {
    filters.push(`${audioInputsStr}acopy[${currentAudioOut}]`);
  }

  return {
    inputs,
    filterComplex: filters.join(';'),
    outputMap: [`[${currentVideoOut}]`, `[${currentAudioOut}]`]
  };
}
