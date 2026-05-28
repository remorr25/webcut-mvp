import useProjectStore from '../../store/projectStore';
import TransformControls from './TransformControls';
import AnimationsPanel from './AnimationsPanel';
import { audioEngine } from '../../renderer/audioEngine';

function SliderRow({ label, value, onChange, min = 0, max = 1, step = 0.01 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>{label}</span>
        <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'Inter,sans-serif', fontVariantNumeric: 'tabular-nums' }}>
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', cursor: 'ew-resize' }}
      />
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </div>
  );
}

export function ImagePropertiesPanel({ layer }) {
  const updateLayer = useProjectStore(s => s.updateLayer);
  
  function update(patch) { updateLayer(layer.id, patch); }
  function updateTransform(patch) { update({ transform: { ...layer.transform, ...patch } }); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      <TransformControls layer={layer} />
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter,sans-serif' }}>Image Options</div>
        <SliderRow label="Opacity" value={layer.opacity ?? 1} onChange={opacity => update({ opacity })} />
        <ToggleRow label="Flip Horizontal" checked={layer.transform?.flipH ?? false} onChange={flipH => updateTransform({ flipH })} />
        <ToggleRow label="Flip Vertical" checked={layer.transform?.flipV ?? false} onChange={flipV => updateTransform({ flipV })} />
      </div>
      <AnimationsPanel layer={layer} />
    </div>
  );
}

export function AudioPropertiesPanel({ layer }) {
  const updateLayer = useProjectStore(s => s.updateLayer);
  function update(patch) { updateLayer(layer.id, patch); }
  
  const handleVolumeChange = (volume) => {
    update({ volume });
    audioEngine.setVolume(layer.id, volume);
  };

  const handlePreview = () => {
    audioEngine.play(layer.startTime || 0, [layer]);
    setTimeout(() => audioEngine.stop(), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter,sans-serif' }}>Audio Options</div>
        <SliderRow label="Volume" value={layer.volume ?? 1} onChange={handleVolumeChange} />
        <ToggleRow label="Muted" checked={layer.muted ?? false} onChange={muted => update({ muted })} />
        <div style={{ height: '12px' }} />
        <SliderRow label="Fade In (s)" value={layer.fadeIn ?? 0} min={0} max={5} step={0.1} onChange={fadeIn => update({ fadeIn })} />
        <SliderRow label="Fade Out (s)" value={layer.fadeOut ?? 0} min={0} max={5} step={0.1} onChange={fadeOut => update({ fadeOut })} />
        <div style={{ height: '16px' }} />
        <button
          onClick={handlePreview}
          style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '12px' }}
        >
          Preview Audio (3s)
        </button>
      </div>
    </div>
  );
}

export function VideoPropertiesPanel({ layer }) {
  const updateLayer = useProjectStore(s => s.updateLayer);
  
  function update(patch) { updateLayer(layer.id, patch); }

  const handleVolumeChange = (volume) => {
    update({ volume });
    audioEngine.setVolume(layer.id, volume);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      <TransformControls layer={layer} />
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter,sans-serif' }}>Video & Audio Options</div>
        <SliderRow label="Opacity" value={layer.opacity ?? 1} onChange={opacity => update({ opacity })} />
        <SliderRow label="Playback Speed" value={layer.speed ?? 1} min={0.25} max={4} step={0.05} onChange={speed => update({ speed })} />
        <div style={{ height: '12px' }} />
        <SliderRow label="Volume" value={layer.volume ?? 1} onChange={handleVolumeChange} />
        <ToggleRow label="Muted" checked={layer.muted ?? false} onChange={muted => update({ muted })} />
      </div>
    </div>
  );
}
