import useUIStore from '../store/uiStore';

const TABS = [
  { id: 'media', icon: '📁', label: 'Media' },
  { id: 'text', icon: 'T', label: 'Text' },
  { id: 'stickers', icon: '⭐', label: 'Stickers' },
  { id: 'transitions', icon: '⧉', label: 'Transitions' },
  { id: 'audio', icon: '🎵', label: 'Audio' },
  { id: 'export', icon: '⬇️', label: 'Export' },
];

export default function LeftSidebar() {
  const activePanel = useUIStore(s => s.activePanel);
  const setActivePanel = useUIStore(s => s.setActivePanel);

  return (
    <div style={{
      width: '56px',
      background: '#141414',
      borderRight: '1px solid #222',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '12px',
      gap: '8px',
      flexShrink: 0
    }}>
      {TABS.map(p => {
        const active = activePanel === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            title={p.label}
            style={{
              width: '40px', height: '40px',
              background: active ? '#222' : 'transparent',
              border: active ? '1px solid #333' : '1px solid transparent',
              borderRadius: '8px',
              color: active ? '#fff' : '#666',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={e => { if(!active) e.currentTarget.style.color = '#ccc' }}
            onMouseLeave={e => { if(!active) e.currentTarget.style.color = '#666' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{p.icon}</span>
          </button>
        )
      })}
      {/* End Tabs */}
    </div>
  );
}
