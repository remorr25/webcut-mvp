import useProjectStore from '../../store/projectStore';
import TextPropertiesPanel from './TextPropertiesPanel';
import { ImagePropertiesPanel, AudioPropertiesPanel, VideoPropertiesPanel } from './MediaPropertiesPanels';

function EmptyProperties() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', fontSize: '12px', fontFamily: 'Inter,sans-serif' }}>
      Click a clip to edit its properties
    </div>
  );
}

export default function PropertiesPanel() {
  const project = useProjectStore(s => s.project);
  const selectedLayerId = useProjectStore(s => s.selectedLayerId);

  // Find layer
  let selectedLayer = null;
  if (project?.tracks) {
    for (const track of project.tracks) {
      const found = track.layers.find(l => l.id === selectedLayerId);
      if (found) { selectedLayer = found; break; }
    }
  }

  return (
    <aside
      id="properties-panel"
      style={{
        width: '280px',
        flexShrink: 0,
        background: '#1a1a1a',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a2a', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
          Properties
        </span>
        {selectedLayer && (
          <span style={{ fontSize: '10px', color: '#666', fontFamily: 'Inter,sans-serif', background: '#222', padding: '2px 6px', borderRadius: '4px' }}>
            {selectedLayer.type}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedLayer && <EmptyProperties />}
        
        {selectedLayer && (selectedLayer.type === 'text' || selectedLayer.type === 'subtitle') && (
          <TextPropertiesPanel layer={selectedLayer} />
        )}

        {/* Media panels */}
        {selectedLayer && selectedLayer.type === 'image' && <ImagePropertiesPanel layer={selectedLayer} />}
        {selectedLayer && selectedLayer.type === 'audio' && <AudioPropertiesPanel layer={selectedLayer} />}
        {selectedLayer && selectedLayer.type === 'video' && <VideoPropertiesPanel layer={selectedLayer} />}
        {selectedLayer && selectedLayer.type === 'sticker' && <ImagePropertiesPanel layer={selectedLayer} />}
      </div>
    </aside>
  );
}
