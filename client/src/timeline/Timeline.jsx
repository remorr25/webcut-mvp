import { useRef, useEffect, useState } from 'react';
import useProjectStore from '../store/projectStore';
import Ruler, { RULER_HEIGHT } from './Ruler';
import TrackRow from './TrackRow';
import TimelineToolbar from './TimelineToolbar';
import { PIXELS_PER_SECOND, secondsToPx, pxToSeconds, trackRowHeight } from './timelineUtils';

const SIDEBAR_WIDTH  = 80;
const TIMELINE_HEIGHT = 220;
const MIN_TOTAL_WIDTH = 800; // px

/**
 * TrackHeader — left sidebar label for one track.
 */
function TrackHeader({ track, index, height }) {
  const toggleTrackLock = useProjectStore(s => s.toggleTrackLock);
  const toggleTrackMute = useProjectStore(s => s.toggleTrackMute);
  const reorderTrack    = useProjectStore(s => s.reorderTrack);

  const typeColors = {
    video: '#6c63ff', audio: '#63d4ff', image: '#63e6a0',
    text: '#ffc13f', subtitle: '#ffc13f', effect: '#ff6b6b',
  };
  const color = typeColors[track.type] ?? '#888';

  function onDragStart(e) {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e) {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== index) {
      reorderTrack(fromIndex, index);
    }
  }

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
      height: `${height}px`,
      padding: '0 8px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid #1e1e1e',
      gap: '6px',
      overflow: 'hidden',
      cursor: 'grab',
      background: track.locked ? '#1a1414' : 'transparent',
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{
        fontSize: '10px', fontWeight: 600, color: '#777',
        fontFamily: 'Inter, sans-serif', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
      }}>
        {track.name}
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={() => toggleTrackMute(track.id)}
          title="Mute track"
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: track.muted ? 1 : 0.4, fontSize: '12px' }}
        >
          {track.type === 'audio' ? (track.muted ? '🔇' : '🔊') : (track.muted ? '🕶️' : '👁️')}
        </button>
        <button 
          onClick={() => toggleTrackLock(track.id)}
          title="Lock track"
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: track.locked ? 1 : 0.4, fontSize: '12px' }}
        >
          {track.locked ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
}

/* ─── Playhead ───────────────────────────────────────────────────────────── */
function Playhead({ currentTime, zoom, scrollRef }) {
  const setCurrentTime = useProjectStore(s => s.setCurrentTime);
  const setIsPlaying   = useProjectStore(s => s.setIsPlaying);
  const dragging = useRef(false);

  const x = secondsToPx(currentTime, zoom);

  function onMouseDown(e) {
    e.stopPropagation();
    dragging.current = true;
    setIsPlaying(false);

    function onMove(mv) {
      if (!dragging.current) return;
      const scrollEl = scrollRef.current;
      const rect     = scrollEl.getBoundingClientRect();
      const rawX     = mv.clientX - rect.left + scrollEl.scrollLeft;
      const t        = Math.max(0, pxToSeconds(rawX, zoom));
      setCurrentTime(t);
    }

    function onUp() {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left:   `${x}px`,
        top:    0,
        bottom: 0,
        width:  '2px',
        background: '#ff3333',
        cursor: 'ew-resize',
        zIndex: 20,
        pointerEvents: 'all',
      }}
    >
      {/* Handle */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-5px',
        width: '12px',
        height: '12px',
        background: '#ff3333',
        borderRadius: '50%',
        cursor: 'ew-resize',
      }} />
    </div>
  );
}

/* ─── Timeline ───────────────────────────────────────────────────────────── */
export default function Timeline() {
  const project     = useProjectStore(s => s.project);
  const currentTime = useProjectStore(s => s.currentTime);
  const zoom        = useProjectStore(s => s.zoom);

  const scrollRef    = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const tracks   = project?.tracks ?? [];
  const duration = project?.duration ?? 0;

  /* ── Total pixel width of the scrollable area ── */
  const pxPerSec     = PIXELS_PER_SECOND * zoom;
  const contentWidth = Math.max(MIN_TOTAL_WIDTH, Math.ceil(duration * pxPerSec) + 200);

  /* ── Track container width via ResizeObserver (avoids ref-in-render) ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Auto-scroll when playhead nears edge ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const playX = secondsToPx(currentTime, zoom);
    const { scrollLeft, clientWidth } = el;
    const MARGIN = 80;
    if (playX > scrollLeft + clientWidth - MARGIN) {
      el.scrollLeft = playX - clientWidth + MARGIN + 20;
    } else if (playX < scrollLeft + MARGIN && scrollLeft > 0) {
      el.scrollLeft = Math.max(0, playX - MARGIN);
    }
  }, [currentTime, zoom]);


  return (
    <section
      ref={containerRef}
      id="timeline-panel"
      style={{
        height: `${TIMELINE_HEIGHT}px`,
        flexShrink: 0,
        background: '#111',
        borderTop: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Toolbar ── */}
      <TimelineToolbar timelineWidth={containerWidth} />

      {/* ── Body: sidebar + scrollable area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left sidebar (fixed, no horizontal scroll) */}
        <div style={{
          width: `${SIDEBAR_WIDTH}px`,
          flexShrink: 0,
          background: '#161616',
          borderRight: '1px solid #222',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Ruler spacer */}
          <div style={{ height: `${RULER_HEIGHT}px`, borderBottom: '1px solid #2a2a2a', flexShrink: 0 }} />
          {/* Track headers */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tracks.map((track, i) => (
              <TrackHeader key={track.id} track={track} index={i} height={trackRowHeight(track.type)} />
            ))}
          </div>
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {/* Inner content — fixed pixel width */}
          <div style={{ width: `${contentWidth}px`, position: 'relative', minHeight: '100%' }}>

            {/* Ruler */}
            <Ruler totalWidth={contentWidth} zoom={zoom} />

            {/* Track rows */}
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                zoom={zoom}
                totalWidth={contentWidth}
                index={i}
              />
            ))}

            {/* Playhead */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              <Playhead
                currentTime={currentTime}
                zoom={zoom}
                scrollRef={scrollRef}
              />
            </div>

            {/* Empty state when there are tracks but NO layers */}
            {tracks.length > 0 && tracks.every(t => t.layers.length === 0) && (
              <div style={{
                position: 'absolute', top: RULER_HEIGHT + 20, left: 20,
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
                border: '1px dashed #444', borderRadius: '8px',
                color: '#888', fontSize: '13px', fontFamily: 'Inter, sans-serif',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '16px' }}>📁</span>
                Drag media here to start
              </div>
            )}

            {/* Empty state when NO tracks */}
            {tracks.length === 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '80px', color: '#555', fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
              }}>
                No tracks — add one from the toolbar
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
