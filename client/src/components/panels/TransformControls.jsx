import useProjectStore from '../../store/projectStore';

/**
 * Shared numeric input with an optional slider.
 */
function NumberRow({ label, value, onChange, min, max, step = 1, showSlider = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>{label}</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '50px', background: '#222', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', fontSize: '11px', padding: '2px 4px', fontFamily: 'Inter,sans-serif'
          }}
        />
      </div>
      {showSlider && (
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'ew-resize' }}
        />
      )}
    </div>
  );
}

export default function TransformControls({ layer }) {
  const updateLayer = useProjectStore(s => s.updateLayer);
  const transform = layer.transform || {};

  function update(patch) {
    updateLayer(layer.id, { transform: { ...transform, ...patch } });
  }

  return (
    <div style={{ padding: '14px', borderBottom: '1px solid #222' }}>
      <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter,sans-serif' }}>
        Transform
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <NumberRow label="X" value={Math.round(transform.x ?? 0)} onChange={x => update({ x })} showSlider={false} />
        <NumberRow label="Y" value={Math.round(transform.y ?? 0)} onChange={y => update({ y })} showSlider={false} />
      </div>

      <NumberRow label="Scale" value={transform.scaleX ?? 1} min={0.1} max={3} step={0.01} onChange={v => update({ scaleX: v, scaleY: v })} />
      <NumberRow label="Rotation (°)" value={transform.rotation ?? 0} min={-180} max={180} step={1} onChange={v => update({ rotation: v })} />
    </div>
  );
}
