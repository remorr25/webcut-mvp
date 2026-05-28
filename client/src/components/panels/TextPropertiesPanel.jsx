import useProjectStore from '../../store/projectStore';
import TransformControls from './TransformControls';
import AnimationsPanel from './AnimationsPanel';

function ColorRow({ label, color, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>{label}</span>
      <input
        type="color"
        value={color || '#ffffff'}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '28px', height: '28px', padding: '0', border: 'none', background: 'none', cursor: 'pointer'
        }}
      />
    </div>
  );
}

export default function TextPropertiesPanel({ layer }) {
  const updateLayer = useProjectStore(s => s.updateLayer);
  const text = layer.text || {};

  function updateText(patch) {
    updateLayer(layer.id, { text: { ...text, ...patch } });
  }

  const FONTS = ['Inter', 'Poppins', 'Montserrat', 'Bebas Neue', 'Anton'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
      <TransformControls layer={layer} />

      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'Inter,sans-serif' }}>
          Text Style
        </div>

        {/* Content */}
        <textarea
          value={text.content || ''}
          onChange={e => updateText({ content: e.target.value })}
          style={{
            width: '100%', minHeight: '60px', background: '#222', border: '1px solid #333',
            borderRadius: '6px', color: '#fff', padding: '8px', fontSize: '12px',
            fontFamily: 'Inter,sans-serif', marginBottom: '12px', resize: 'vertical'
          }}
          placeholder="Enter text..."
        />

        {/* Font Family */}
        <select
          value={text.fontFamily || 'Inter'}
          onChange={e => updateText({ fontFamily: e.target.value })}
          style={{
            width: '100%', background: '#222', border: '1px solid #333', borderRadius: '6px',
            color: '#fff', padding: '6px 8px', fontSize: '12px', marginBottom: '12px', fontFamily: 'Inter,sans-serif'
          }}
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Font Size & Weight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Size ({text.fontSize ?? 48})</span>
            <input
              type="range" min="12" max="200"
              value={text.fontSize ?? 48}
              onChange={e => updateText({ fontSize: parseInt(e.target.value, 10) })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Weight</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => updateText({ fontWeight: 400 })}
                style={{ flex: 1, background: text.fontWeight === 400 ? '#6c63ff' : '#222', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >N</button>
              <button 
                onClick={() => updateText({ fontWeight: 700 })}
                style={{ flex: 1, background: text.fontWeight === 700 ? '#6c63ff' : '#222', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '4px', fontWeight: 700 }}
              >B</button>
              <button 
                onClick={() => updateText({ fontWeight: 900 })}
                style={{ flex: 1, background: text.fontWeight === 900 ? '#6c63ff' : '#222', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '4px', fontWeight: 900 }}
              >H</button>
            </div>
          </div>
        </div>

        {/* Align */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {['left', 'center', 'right'].map(a => (
            <button
              key={a}
              onClick={() => updateText({ align: a })}
              style={{ flex: 1, background: text.align === a ? '#444' : '#222', border: '1px solid #333', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '6px', fontSize: '11px' }}
            >
              {a.toUpperCase()}
            </button>
          ))}
        </div>

        <ColorRow label="Fill Color" color={text.color} onChange={color => updateText({ color })} />
        
        {/* Text Effect */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', fontFamily: 'Inter,sans-serif' }}>Animation Effect</div>
          <select 
            value={text.textEffect || 'none'}
            onChange={e => updateText({ textEffect: e.target.value })}
            style={{ width: '100%', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '4px' }}
          >
            <option value="none">None</option>
            <option value="word-by-word">Word by Word</option>
            <option value="accumulate">Accumulate (Build Up)</option>
            <option value="highlight">Highlight Current Word</option>
            <option value="typewriter">Typewriter (Characters)</option>
          </select>
          
          {text.textEffect === 'highlight' && (
            <div style={{ marginTop: '8px' }}>
              <ColorRow label="Highlight" color={text.highlightColor || '#ffe500'} onChange={color => updateText({ highlightColor: color })} />
            </div>
          )}
        </div>
        
        {/* Stroke */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={!!text.stroke} onChange={e => updateText({ stroke: e.target.checked ? { color: '#000000', width: 4 } : null })} />
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Stroke</span>
          </div>
          {text.stroke && (
            <div style={{ paddingLeft: '24px', marginTop: '8px' }}>
              <ColorRow label="Color" color={text.stroke.color} onChange={color => updateText({ stroke: { ...text.stroke, color } })} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#888', width: '40px' }}>Width</span>
                <input type="range" min="1" max="20" value={text.stroke.width} onChange={e => updateText({ stroke: { ...text.stroke, width: parseInt(e.target.value, 10) }})} style={{ flex: 1 }} />
              </div>
            </div>
          )}
        </div>

        {/* Shadow */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={!!text.shadow} onChange={e => updateText({ shadow: e.target.checked ? { color: 'rgba(0,0,0,0.8)', blur: 8, x: 2, y: 2 } : null })} />
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Drop Shadow</span>
          </div>
          {text.shadow && (
            <div style={{ paddingLeft: '24px', marginTop: '8px' }}>
              <ColorRow label="Color" color={text.shadow.color} onChange={color => updateText({ shadow: { ...text.shadow, color } })} />
            </div>
          )}
        </div>

        {/* Glow */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={!!text.glowColor} onChange={e => updateText({ glowColor: e.target.checked ? '#00ffcc' : null, glowBlur: 20 })} />
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Neon Glow</span>
          </div>
          {text.glowColor && (
            <div style={{ paddingLeft: '24px', marginTop: '8px' }}>
              <ColorRow label="Color" color={text.glowColor} onChange={color => updateText({ glowColor: color })} />
            </div>
          )}
        </div>
        
        {/* Gradient */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={!!text.gradient} onChange={e => updateText({ gradient: e.target.checked ? { start: '#ff0000', end: '#0000ff' } : null })} />
            <span style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>Gradient Fill</span>
          </div>
          {text.gradient && (
            <div style={{ paddingLeft: '24px', marginTop: '8px' }}>
              <ColorRow label="Start" color={text.gradient.start} onChange={color => updateText({ gradient: { ...text.gradient, start: color } })} />
              <ColorRow label="End" color={text.gradient.end} onChange={color => updateText({ gradient: { ...text.gradient, end: color } })} />
            </div>
          )}
        </div>

      </div>

      {/* Animations Section */}
      <AnimationsPanel layer={layer} />
    </div>
  );
}
