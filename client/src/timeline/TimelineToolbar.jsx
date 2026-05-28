import { useState } from 'react';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';
import { PIXELS_PER_SECOND } from './timelineUtils';

const TOOLS = [
  { id: 'select', label: 'Select', key: 'V' },
  { id: 'trim',   label: 'Trim',   key: 'T' },
  { id: 'split',  label: 'Split',  key: 'S' },
];

const TRACK_TYPES = ['video', 'audio', 'text'];

/** Small icon button */
function IconBtn({ onClick, title, children, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background:   active ? 'rgba(108,99,255,0.2)' : 'none',
        border:       `1px solid ${active ? '#6c63ff' : '#2a2a2a'}`,
        borderRadius: '5px',
        color:        active ? '#6c63ff' : '#888',
        fontSize:     '11px',
        fontWeight:   600,
        fontFamily:   'Inter, sans-serif',
        padding:      '2px 8px',
        height:       '24px',
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        gap:          '4px',
        transition:   'all 0.12s',
        whiteSpace:   'nowrap',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#444'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#2a2a2a'; }}
    >
      {children}
    </button>
  );
}

export default function TimelineToolbar({ timelineWidth }) {
  const zoom       = useProjectStore(s => s.zoom);
  const project    = useProjectStore(s => s.project);
  const setZoom    = useProjectStore(s => s.setZoom);
  const addTrack   = useProjectStore(s => s.addTrack);
  const undo       = useProjectStore(s => s.undo);
  const redo       = useProjectStore(s => s.redo);
  const undoStack  = useProjectStore(s => s.undoStack);
  const redoStack  = useProjectStore(s => s.redoStack);

  const activeTool   = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);

  const [addMenuOpen, setAddMenuOpen] = useState(false);

  function fitToWindow() {
    const duration = project?.duration ?? 0;
    if (!duration || !timelineWidth) return;
    const ideal = (timelineWidth - 80) / (PIXELS_PER_SECOND * duration);
    setZoom(Math.max(0.5, Math.min(5, ideal)));
  }

  return (
    <div
      id="timeline-toolbar"
      style={{
        height: '32px',
        background: '#181818',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 8px',
        flexShrink: 0,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* ── Undo / Redo ── */}
      <IconBtn onClick={undo} title="Undo (Ctrl+Z)" active={false}>
        <span style={{ opacity: undoStack.length ? 1 : 0.3 }}>↩ Undo</span>
      </IconBtn>
      <IconBtn onClick={redo} title="Redo (Ctrl+Y)" active={false}>
        <span style={{ opacity: redoStack.length ? 1 : 0.3 }}>↪ Redo</span>
      </IconBtn>

      <div style={{ width: '1px', height: '16px', background: '#2a2a2a' }} />

      {/* ── Tools ── */}
      {TOOLS.map(tool => (
        <IconBtn
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          title={`${tool.label} (${tool.key})`}
          active={activeTool === tool.id}
        >
          {tool.label}
        </IconBtn>
      ))}

      <div style={{ width: '1px', height: '16px', background: '#2a2a2a' }} />

      {/* ── Zoom ── */}
      <IconBtn onClick={() => setZoom(zoom / 1.25)} title="Zoom out (-)">−</IconBtn>

      <span style={{
        fontSize: '10px', color: '#666', fontFamily: 'Inter, sans-serif',
        minWidth: '32px', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
      }}>
        {Math.round(zoom * 100)}%
      </span>

      <IconBtn onClick={() => setZoom(zoom * 1.25)} title="Zoom in (+)">+</IconBtn>
      <IconBtn onClick={fitToWindow} title="Fit to window">Fit</IconBtn>

      <div style={{ width: '1px', height: '16px', background: '#2a2a2a' }} />

      {/* ── Add Track dropdown ── */}
      <div style={{ position: 'relative' }}>
        <IconBtn onClick={() => setAddMenuOpen(v => !v)} title="Add track">
          + Track ▾
        </IconBtn>
        {addMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '6px',
              overflow: 'hidden',
              zIndex: 100,
              minWidth: '100px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
            onMouseLeave={() => setAddMenuOpen(false)}
          >
            {TRACK_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { addTrack(type); setAddMenuOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #2a2a2a',
                  color: '#c0c0c0',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Track
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Zoom display ── */}
      <span style={{ fontSize: '10px', color: '#444', fontFamily: 'Inter, sans-serif' }}>
        {PIXELS_PER_SECOND * zoom}px/s
      </span>
    </div>
  );
}
