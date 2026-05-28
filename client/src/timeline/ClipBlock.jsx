import { useState, memo } from 'react';
import { Rnd } from 'react-rnd';
import useProjectStore from '../store/projectStore';
import AudioWaveform from './AudioWaveform';
import {
  PIXELS_PER_SECOND,
  secondsToPx,
  pxToSeconds,
  trackRowHeight,
  trackColor,
  clampLayerPosition,
} from './timelineUtils';
import useUIStore from '../store/uiStore';

const MIN_DURATION = 0.1; // seconds

/**
 * ClipBlock — a draggable/resizable layer block on the timeline.
 *
 * @param {{ layer: object, track: object, zoom: number, rowHeight: number }} props
 */
export default memo(function ClipBlock({ layer, track, zoom, rowHeight }) {
  const selectedLayerId = useProjectStore(s => s.selectedLayerId);
  const selectLayer     = useProjectStore(s => s.selectLayer);
  const updateLayer     = useProjectStore(s => s.updateLayer);
  const splitLayer      = useProjectStore(s => s.splitLayer);
  const moveLayerToTrack= useProjectStore(s => s.moveLayerToTrack);
  const project         = useProjectStore(s => s.project);
  const currentTime     = useProjectStore(s => s.currentTime);
  const activeTool      = useUIStore(s => s.activeTool);

  const [dragging, setDragging]  = useState(false);
  const [resizing, setResizing]  = useState(false);
  const isSelected = selectedLayerId === layer.id;
  const colors     = trackColor(layer.type ?? track.type);

  const pxPerSec   = PIXELS_PER_SECOND * zoom;
  const x          = secondsToPx(layer.startTime ?? 0, zoom);
  const w          = Math.max(4, secondsToPx(layer.duration ?? 0, zoom));

  /* ── Siblings for collision ── */
  const siblings = track.layers;

  /* ── Display label ── */
  const label = layer.name ?? layer.type ?? 'Clip';

  // Find if this layer has an outgoing transition
  const transition = (project?.transitions || []).find(t => t.betweenLayers?.[0] === layer.id);

  return (
    <Rnd
      position={{ x, y: 0 }}
      size={{ width: w, height: rowHeight }}
      /* Allow vertical if not locked */
      enableResizing={{ left: !track.locked, right: !track.locked }}
      disableDragging={track.locked}
      dragAxis="both"
      bounds={false} // Remove bounds for cross-track dragging
      minWidth={Math.max(4, MIN_DURATION * pxPerSec)}

      onDragStart={() => setDragging(true)}
      onDragStop={(_e, d) => {
        setDragging(false);
        const rawStart   = pxToSeconds(d.x, zoom);
        const safeStart  = clampLayerPosition(rawStart, layer.duration ?? 0, siblings, layer.id);
        
        // Check for vertical track crossing
        if (Math.abs(d.y) > rowHeight / 2) {
           // We moved far enough to try swapping tracks
           const rowIdx = project.tracks.findIndex(t => t.id === track.id);
           const yOffset = d.y;
           
           // Simple estimation of target track:
           let targetIdx = rowIdx;
           let accumulatedY = 0;
           
           if (yOffset > 0) {
              // Moving down
              while (targetIdx < project.tracks.length - 1 && accumulatedY + 20 < yOffset) {
                 targetIdx++;
                 accumulatedY += trackRowHeight(project.tracks[targetIdx].type);
              }
           } else {
              // Moving up
              while (targetIdx > 0 && accumulatedY - 20 > yOffset) {
                 targetIdx--;
                 accumulatedY -= trackRowHeight(project.tracks[targetIdx].type);
              }
           }
           
           if (targetIdx !== rowIdx) {
              const targetTrack = project.tracks[targetIdx];
              moveLayerToTrack(layer.id, targetTrack.id, rawStart);
              return; // let projectStore handle update
           }
        }
        
        updateLayer(layer.id, { startTime: safeStart });
      }}

      onResizeStart={() => setResizing(true)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        setResizing(false);
        const newDuration = Math.max(MIN_DURATION, pxToSeconds(ref.offsetWidth, zoom));
        const newStart    = Math.max(0, pxToSeconds(pos.x, zoom));
        updateLayer(layer.id, { startTime: newStart, duration: newDuration });
      }}

      onClick={() => {
        if (activeTool === 'split') {
          splitLayer(layer.id, currentTime);
        } else {
          selectLayer(layer.id);
        }
      }}

      style={{ position: 'absolute', zIndex: isSelected ? 10 : 1 }}
    >
      <div
        style={{
          width:  '100%',
          height: '100%',
          background: dragging || resizing
            ? colors.bg.replace('0.18', '0.28').replace('0.15', '0.25')
            : colors.bg,
          border: `1px solid ${isSelected ? colors.border : colors.border + '88'}`,
          borderRadius: '4px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          cursor: track.locked ? 'not-allowed' : (activeTool === 'split' ? 'crosshair' : (dragging ? 'grabbing' : 'grab')),
          boxShadow: isSelected
            ? `0 0 0 1px ${colors.border}, 0 2px 8px ${colors.border}44`
            : 'none',
          transition: 'box-shadow 0.1s, border-color 0.1s',
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {/* Resize handle — left */}
        <div style={{
          position: 'absolute', left: 0, top: '20%', height: '60%',
          width: '4px', background: colors.border, borderRadius: '0 2px 2px 0',
          opacity: isSelected ? 0.9 : 0.3, cursor: 'ew-resize',
        }} />

        {/* Audio Waveform */}
        {layer.type === 'audio' && (
          <AudioWaveform layer={layer} width={w} />
        )}

        {/* Label */}
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          color: colors.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          pointerEvents: 'none',
          letterSpacing: '0.02em',
          zIndex: 1,
        }}>
          {label}
        </span>

        {/* Transition Badge */}
        {transition && (
          <div
            title={`Transition: ${transition.type}`}
            style={{
              position: 'absolute',
              right: '8px',
              width: '8px',
              height: '8px',
              background: '#ff0066',
              borderRadius: '50%',
              border: '1px solid #fff',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Resize handle — right */}
        <div style={{
          position: 'absolute', right: 0, top: '20%', height: '60%',
          width: '4px', background: colors.border, borderRadius: '2px 0 0 2px',
          opacity: isSelected ? 0.9 : 0.3, cursor: 'ew-resize',
        }} />
      </div>
    </Rnd>
  );
});
