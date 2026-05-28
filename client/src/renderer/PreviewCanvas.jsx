import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
} from 'react';
import useProjectStore from '../store/projectStore';
import useRenderLoop from './useRenderLoop';
import { preloadImages, setOnImageLoadCallback, PROJECT_WIDTH, PROJECT_HEIGHT } from './canvasRenderer';
import PlaybackControls from '../components/PlaybackControls';
import TransformOverlay from './TransformOverlay';
import { audioEngine } from './audioEngine';

const ASPECT = PROJECT_WIDTH / PROJECT_HEIGHT; // 16/9

/**
 * PreviewCanvas
 *
 * Layout:
 *   <main#preview-area>
 *     <div.canvas-wrapper>    ← maintains 16:9, scales to fit
 *       <video#preview-video> ← the active video layer source
 *       <canvas#preview-canvas> ← absolute inset-0, canvas rendering
 *     </div>
 *     <PlaybackControls />    ← positioned absolute below the canvas
 *   </main>
 *
 * Bidirectional time sync:
 *   video timeupdate → store.setCurrentTime
 *   store.currentTime change → video.currentTime  (when delta > 0.15s)
 */
const PreviewCanvas = forwardRef(function PreviewCanvas(_props, ref) {
  const containerRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);

  const project      = useProjectStore(s => s.project);
  const currentTime  = useProjectStore(s => s.currentTime);
  const isPlaying    = useProjectStore(s => s.isPlaying);
  const masterVolume = useProjectStore(s => s.masterVolume);
  const setCurrentTime = useProjectStore(s => s.setCurrentTime);
  const setIsPlaying   = useProjectStore(s => s.setIsPlaying);

  const { renderOnce } = useRenderLoop(canvasRef);
  const [previewZoom, setPreviewZoom] = useState('fit');

  /* ── Expose imperative API ──────────────────────────────────────────── */
  useImperativeHandle(ref, () => ({
    play:   () => setIsPlaying(true),
    pause:  () => setIsPlaying(false),
    seekTo: (t) => setCurrentTime(t),
  }), [setIsPlaying, setCurrentTime]);

  /* ── First video layer src ──────────────────────────────────────────── */
  const videoSrc = (() => {
    const videoTrack = project?.tracks?.find(t => t.type === 'video');
    const videoLayer = videoTrack?.layers?.find(l => l.type === 'video' && l.src);
    return videoLayer?.src ?? null;
  })();

  /* ── Check if project is completely empty ─────────────────────────────── */
  const hasAnyLayers = (() => {
    if (!project?.tracks) return false;
    return project.tracks.some(track => track.layers && track.layers.length > 0);
  })();

  /* ── Register image load callback ────────────────────────────────────── */
  useEffect(() => {
    setOnImageLoadCallback(renderOnce);
  }, [renderOnce]);

  /* ── Preload images when project changes ─────────────────────────────── */
  useEffect(() => {
    if (project) preloadImages(project);
  }, [project]);

  /* ── Canvas ResizeObserver — keeps canvas pixel dimensions in sync ──── */
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Set canvas backing-store to match display size
        canvas.width  = Math.round(width);
        canvas.height = Math.round(height);
        // Re-render the current frame at new resolution
        renderOnce();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [renderOnce]);

  /* ── Video src sync ──────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (videoSrc) {
      video.src = videoSrc;
      video.load();
    } else {
      video.src = '';
    }
  }, [videoSrc]);

  /* ── Volume sync ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = masterVolume ?? 1;
  }, [masterVolume]);

  /* ── Video / Playback Sync ── */
  useEffect(() => {
    const video = document.getElementById('preview-video');
    
    if (isPlaying) {
      if (video && videoSrc) {
        video.play().catch(e => {
          if (e.name !== 'NotSupportedError') {
            console.warn('Play interrupted:', e);
          }
        });
      }
      
      // Get active layers for audio engine
      const activeLayers = [];
      if (project?.tracks) {
        for (const track of project.tracks) {
          for (const layer of track.layers) {
            if (currentTime >= (layer.startTime || 0) && currentTime < (layer.startTime || 0) + (layer.duration || 0)) {
              activeLayers.push({ ...layer, _muted: track.muted });
            }
          }
        }
      }
      audioEngine.play(currentTime, activeLayers);
      
    } else {
      if (video && videoSrc) {
        video.pause();
      }
      audioEngine.stop();
    }
    
    return () => audioEngine.stop();
  }, [isPlaying, videoSrc, project]);

  /* ── video timeupdate → store ─────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [setCurrentTime]);

  /* ── store currentTime → video (seek, when delta > 0.15 s) ──────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    
    // Ignore if video hasn't loaded metadata yet
    if (video.readyState === 0) return;

    if (Math.abs(video.currentTime - currentTime) > 0.15) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoSrc]);

  /* ── Initial render once project loaded ──────────────────────────────── */
  useEffect(() => {
    renderOnce();
  }, [project, renderOnce]);

  return (
    <main
      id="preview-area"
      style={{
        flex: 1,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        gap: '12px',
        padding: '16px',
      }}
    >
      {/* ── Zoom Controls ── */}
      <div style={{
        position: 'absolute', top: '16px', right: '16px', zIndex: 50,
        display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.5)',
        padding: '4px', borderRadius: '6px', border: '1px solid #333'
      }}>
        {['fit', '50%', '100%'].map(z => (
          <button
            key={z}
            onClick={() => setPreviewZoom(z)}
            style={{
              background: previewZoom === z ? '#6c63ff' : 'transparent',
              border: 'none', borderRadius: '4px', color: '#fff',
              fontSize: '11px', padding: '4px 8px', cursor: 'pointer',
              textTransform: 'uppercase', fontFamily: 'Inter, sans-serif'
            }}
          >
            {z}
          </button>
        ))}
      </div>

      {/* ── Canvas wrapper — maintains 16:9 aspect ratio ── */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          /* Scale to fit or fixed size based on zoom */
          width:  previewZoom === 'fit' ? '100%' : (previewZoom === '100%' ? `${PROJECT_WIDTH}px` : `${PROJECT_WIDTH * 0.5}px`),
          height: previewZoom === 'fit' ? undefined : (previewZoom === '100%' ? `${PROJECT_HEIGHT}px` : `${PROJECT_HEIGHT * 0.5}px`),
          maxWidth: previewZoom === 'fit' ? `calc((100vh - 48px - 220px - 80px) * ${ASPECT})` : undefined,
          aspectRatio: `${PROJECT_WIDTH} / ${PROJECT_HEIGHT}`,
          background: '#000',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          border: '1px solid #222',
          flexShrink: 0,
        }}
      >
        {/* Video element (behind canvas) */}
        <video
          ref={videoRef}
          id="preview-video"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
          }}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
        />

        {/* Canvas overlay (non-interactive) */}
        <canvas
          id="preview-canvas"
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            background: !videoSrc ? '#000000' : 'transparent'
          }}
        />

        {/* Transform Overlay handles bounding boxes and interactions */}
        <TransformOverlay containerRef={containerRef} />

        {/* Empty state */}
        {!hasAnyLayers && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#2a2a2a',
            fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '28px', opacity: 0.4 }}>🎬</div>
            <span style={{ fontSize: '12px', letterSpacing: '0.04em' }}>
              Import media to begin
            </span>
          </div>
        )}

        {/* Corner markers */}
        {['top:left', 'top:right', 'bottom:left', 'bottom:right'].map(pos => {
          const [v, h] = pos.split(':');
          return (
            <div key={pos} style={{
              position: 'absolute',
              [v]: 0,
              [h]: 0,
              width: '10px',
              height: '10px',
              borderTop:    v === 'top'    ? '2px solid rgba(108,99,255,0.5)' : 'none',
              borderBottom: v === 'bottom' ? '2px solid rgba(108,99,255,0.5)' : 'none',
              borderLeft:   h === 'left'   ? '2px solid rgba(108,99,255,0.5)' : 'none',
              borderRight:  h === 'right'  ? '2px solid rgba(108,99,255,0.5)' : 'none',
              pointerEvents: 'none',
            }} />
          );
        })}
      </div>

      {/* ── Playback controls pill ── */}
      <PlaybackControls />
    </main>
  );
});

export default PreviewCanvas;
