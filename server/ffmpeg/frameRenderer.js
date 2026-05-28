import fs from 'fs-extra';
import path from 'path';
import { createCanvas, registerFont, Image } from 'canvas';

// Inject globals for isomorphic canvasRenderer compatibility
global.createCanvas = createCanvas;
global.Image = Image;

import { 
  preloadImagesAsync, 
  renderTextLayer, 
  renderImageLayer, 
  renderStickerLayer 
} from '../../client/src/renderer/canvasRenderer.js';

/**
 * Renders all non-video layers (Text, Image, Sticker) frame-by-frame
 * into a sequence of transparent PNGs to perfectly preserve frontend 
 * keyframe animations, baseline alignments, and complex text effects.
 */
export async function generateFrameSequence(parsedTimeline, project, outputStream) {
  const w = project.resolution?.width || 1080;
  const h = project.resolution?.height || 1920;
  const scale = w / 1080; 
  const duration = project.duration || 30;
  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);

  // Register fonts to node-canvas
  for (const layer of parsedTimeline.textLayers) {
    if (layer.absoluteFontPath && layer.text?.fontFamily) {
      try {
        registerFont(layer.absoluteFontPath, { family: layer.text.fontFamily });
      } catch (e) {
        console.warn('[frameRenderer] Failed to register font:', e);
      }
    }
  }

  const layersToRender = [
    ...parsedTimeline.imageLayers,
    ...parsedTimeline.stickerLayers,
    ...parsedTimeline.textLayers
  ].map(layer => {
    if (layer.absolutePath && !layer.src?.startsWith('http')) {
      return { ...layer, src: layer.absolutePath };
    }
    return layer;
  }).sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const dummyProject = { tracks: [{ layers: layersToRender }] };
  await preloadImagesAsync(dummyProject);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  
  console.log(`[frameRenderer] Starting in-memory streaming: ${totalFrames} frames`);

  for (let frame = 1; frame <= totalFrames; frame++) {
    const currentTime = frame / fps;
    ctx.clearRect(0, 0, w, h);

    for (const layer of layersToRender) {
      const start = layer.startTime || 0;
      const end = start + (layer.duration || 5);
      
      if (currentTime >= start && currentTime < end) {
        if (layer.type === 'text' || layer.type === 'subtitle') {
          renderTextLayer(ctx, layer, currentTime, scale);
        } else if (layer.type === 'image') {
          renderImageLayer(ctx, layer, currentTime, scale);
        } else if (layer.type === 'sticker') {
          renderStickerLayer(ctx, layer, currentTime, scale);
        }
      }
    }

    // Uncompressed PNG for max performance, using ASYNC callback to unblock event loop
    const buffer = await new Promise((resolve, reject) => {
      canvas.toBuffer((err, buf) => {
        if (err) reject(err);
        else resolve(buf);
      }, 'image/png', { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE });
    });
    
    // Write to stream and handle backpressure to prevent RAM explosion
    const canContinue = outputStream.write(buffer);
    if (!canContinue) {
      await new Promise(resolve => outputStream.once('drain', resolve));
    }
    
    if (frame % 30 === 0) {
      console.log(`[frameRenderer] Streamed ${frame} / ${totalFrames} frames`);
    }
  }

  outputStream.end();
  console.log(`[frameRenderer] Finished streaming ${totalFrames} frames.`);
  
  return { fps, totalFrames };
}
