import { STICKERS } from '../assets/stickerData';

export default function StickerPanel() {
  function handleDragStart(e, sticker) {
    const layerData = {
      type: 'sticker',
      name: sticker.name,
      src: sticker.src,
      duration: 5,
    };
    e.dataTransfer.setData('application/layer-json', JSON.stringify(layerData));
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside
      id="sticker-panel"
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
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
          Stickers
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden auto', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignContent: 'start' }}>
        {STICKERS.map(sticker => (
          <div
            key={sticker.id}
            draggable
            onDragStart={(e) => handleDragStart(e, sticker)}
            title={sticker.name}
            style={{
              aspectRatio: '1',
              background: '#222',
              borderRadius: '6px',
              border: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              padding: '8px'
            }}
          >
            <img src={sticker.src} alt={sticker.name} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
          </div>
        ))}
      </div>
    </aside>
  );
}
