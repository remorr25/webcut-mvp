import useProjectStore from '../../store/projectStore';

const TRANSITIONS = [
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'wipe', label: 'Wipe' },
];

export default function TransitionPanel() {
  const project = useProjectStore(s => s.project);
  const loadProject = useProjectStore(s => s.loadProject);

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/transition', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const autoAddTransitions = (type = 'fade') => {
    if (!project || !project.tracks) return;
    const newTransitions = [...(project.transitions || [])];

    project.tracks.forEach(track => {
      // Must sort layers by start time to find adjacencies
      const sortedLayers = [...track.layers].sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < sortedLayers.length - 1; i++) {
        const l1 = sortedLayers[i];
        const l2 = sortedLayers[i + 1];
        
        // If they meet or overlap
        const l1End = l1.startTime + l1.duration;
        if (l2.startTime <= l1End + 0.1) {
          // Add transition
          newTransitions.push({
            id: `t-${Math.random().toString(36).substr(2, 9)}`,
            type,
            duration: 0.5,
            betweenLayers: [l1.id, l2.id]
          });
          // Also adjust l2 to overlap properly if it was just touching
          if (l2.startTime === l1End) {
            l2.startTime = l1End - 0.5;
            l2.duration += 0.5; // maybe? let's just shift it
          }
        }
      }
    });

    loadProject({ ...project, transitions: newTransitions });
  };

  return (
    <aside
      style={{
        width: '280px', flexShrink: 0, background: '#1a1a1a', borderRight: '1px solid #333',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}
    >
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #2a2a2a' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
          Transitions
        </span>
      </div>

      <div style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {TRANSITIONS.map(t => (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => handleDragStart(e, t.id)}
              style={{
                background: '#222', border: '1px solid #333', borderRadius: '6px',
                padding: '20px 10px', textAlign: 'center', cursor: 'grab',
                color: '#fff', fontSize: '12px', fontFamily: 'Inter,sans-serif'
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <button
          onClick={() => autoAddTransitions('fade')}
          style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', marginTop: '16px', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
        >
          Auto-Add Fades
        </button>
      </div>
    </aside>
  );
}
