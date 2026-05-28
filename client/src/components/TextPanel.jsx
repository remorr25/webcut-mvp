import useProjectStore from '../store/projectStore';
import { SUBTITLE_TEMPLATES, DEFAULT_TEXT_LAYER, DEFAULT_SUBTITLE_LAYER } from '../subtitles/subtitleTemplates';
import { createLayer } from '../utils/layerUtils';

export default function TextPanel() {
  const project     = useProjectStore(s => s.project);
  const addLayer    = useProjectStore(s => s.addLayer);
  const addTrack    = useProjectStore(s => s.addTrack);
  const currentTime = useProjectStore(s => s.currentTime);

  function getOrCreateTextTrack() {
    let track = project?.tracks?.find(t => t.type === 'text');
    if (!track) {
      addTrack('text');
      track = useProjectStore.getState().project.tracks.find(t => t.type === 'text');
    }
    return track?.id;
  }

  function handleAdd(template) {
    const trackId = getOrCreateTextTrack();
    if (!trackId) return;
    
    const layer = createLayer(template.type || 'text', {
      ...template,
      startTime: currentTime,
    });
    
    addLayer(trackId, layer);
  }

  return (
    <aside
      id="text-panel"
      style={{
        width: '280px',
        flexShrink: 0,
        background: '#1a1a1a',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
          Text & Subtitles
        </span>
      </div>
      
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        
        {/* ── Basic ── */}
        <div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
            Basic
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleAdd(DEFAULT_TEXT_LAYER)}
              style={{
                flex: 1, padding: '10px 0', background: '#222', border: '1px solid #333',
                borderRadius: '6px', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                fontSize: '12px', fontWeight: 500, transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.background = '#222'}
            >
              + Default Text
            </button>
            <button 
              onClick={() => handleAdd(DEFAULT_SUBTITLE_LAYER)}
              style={{
                flex: 1, padding: '10px 0', background: '#222', border: '1px solid #333',
                borderRadius: '6px', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                fontSize: '12px', fontWeight: 500, transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
              onMouseLeave={e => e.currentTarget.style.background = '#222'}
            >
              + Subtitle
            </button>
          </div>
        </div>

        {/* ── Templates ── */}
        <div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
            Templates
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {SUBTITLE_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleAdd(tpl.layer)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '16px 8px', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '8px',
                  cursor: 'pointer', color: '#fff', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
              >
                <span style={{ fontSize: '28px' }}>{tpl.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>
        
      </div>
    </aside>
  );
}
