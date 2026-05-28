import useProjectStore from '../../store/projectStore';
import { PRESETS, PRESET_LIST } from '../../animations/animationPresets';
import AnimationPreview from './AnimationPreview';

export default function AnimationsPanel({ layer }) {
  const updateLayer = useProjectStore(s => s.updateLayer);

  const animations = layer.animations || [];

  function addPreset(id) {
    const generator = PRESETS[id];
    if (!generator) return;
    const newAnims = generator();
    updateLayer(layer.id, { animations: [...animations, ...newAnims] });
  }

  function removeAnim(index) {
    const next = [...animations];
    next.splice(index, 1);
    updateLayer(layer.id, { animations: next });
  }

  function clearAll() {
    updateLayer(layer.id, { animations: [] });
  }

  const enters = PRESET_LIST.filter(p => p.type === 'enter');

  return (
    <div style={{ padding: '14px', borderTop: '1px solid #222' }}>
      <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter,sans-serif' }}>
        Animations
      </div>

      <AnimationPreview layer={layer} />

      {/* Preset Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        {enters.map(p => (
          <button
            key={p.id}
            onClick={() => addPreset(p.id)}
            style={{
              background: '#222', border: '1px solid #333', borderRadius: '6px',
              padding: '8px 4px', color: '#fff', fontSize: '11px', fontFamily: 'Inter,sans-serif',
              cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
            onMouseLeave={e => e.currentTarget.style.background = '#222'}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Active Animations List */}
      {animations.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Active Animations</span>
            <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '10px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Clear All</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {animations.map((a, i) => (
              <div key={a.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1c1c1c', padding: '6px 8px', borderRadius: '4px', border: '1px solid #2a2a2a' }}>
                <span style={{ fontSize: '11px', color: '#ccc', fontFamily: 'Inter,sans-serif' }}>
                  {a.property} ({a.keyframes?.length || 0} kf)
                </span>
                <button
                  onClick={() => removeAnim(i)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
