import { memo } from 'react';
import useProjectStore from '../store/projectStore';
import ClipBlock from './ClipBlock';
import { trackRowHeight, trackColor, pxToSeconds } from './timelineUtils';

/**
 * TrackRow — one horizontal strip for a single track.
 *
 * @param {{ track: object, zoom: number, totalWidth: number, index: number }} props
 */
export default memo(function TrackRow({ track, zoom, totalWidth, index }) {
  const addLayer = useProjectStore(s => s.addLayer);
  const height   = trackRowHeight(track.type);
  const colors   = trackColor(track.type);
  const isEven   = index % 2 === 0;

  /* ── Drop: accept application/layer-json from MediaPanel ── */
  function handleDragOver(e) {
    if (e.dataTransfer.types.includes('application/layer-json')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/layer-json');
    if (!raw) return;

    try {
      const layerData = JSON.parse(raw);
      // Compute startTime from drop X relative to the row
      const rect      = e.currentTarget.getBoundingClientRect();
      const dropX     = e.clientX - rect.left;
      const startTime = Math.max(0, pxToSeconds(dropX, zoom));

      addLayer(track.id, { ...layerData, startTime });
    } catch (err) {
      console.error('[TrackRow] drop parse error:', err);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        height: `${height}px`,
        width:  `${totalWidth}px`,
        background: isEven ? '#141414' : '#111',
        borderBottom: '1px solid #1e1e1e',
        flexShrink: 0,
        overflow: 'visible',
      }}
    >
      {/* Subtle left accent */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '2px',
        background: colors.border,
        opacity: 0.3,
      }} />

      {/* Clip blocks */}
      {track.layers.map(layer => (
        <ClipBlock
          key={layer.id}
          layer={layer}
          track={track}
          zoom={zoom}
          rowHeight={height}
        />
      ))}

      {/* Empty row hint */}
      {track.layers.length === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          color: '#2a2a2a',
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          pointerEvents: 'none',
        }}>
          Drop media here
        </div>
      )}
    </div>
  );
});
