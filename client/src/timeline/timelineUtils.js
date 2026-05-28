

export const PIXELS_PER_SECOND = 50; // base px/s at zoom=1

/** pixels → seconds */
export function pxToSeconds(px, zoom) {
  return px / (PIXELS_PER_SECOND * zoom);
}

/** seconds → pixels */
export function secondsToPx(seconds, zoom) {
  return seconds * PIXELS_PER_SECOND * zoom;
}

/** Row height in pixels by track type */
export function trackRowHeight(type) {
  if (type === 'audio') return 36;
  if (type === 'text' || type === 'subtitle') return 40;
  return 48; // video / image / default
}

/** Track accent colour by type */
export function trackColor(type) {
  const MAP = {
    video:    { bg: 'rgba(108,99,255,0.18)', border: '#6c63ff', text: '#9b8fff' },
    audio:    { bg: 'rgba(99,212,255,0.15)', border: '#63d4ff', text: '#63d4ff' },
    image:    { bg: 'rgba(99,230,160,0.15)', border: '#63e6a0', text: '#63e6a0' },
    text:     { bg: 'rgba(255,193,63,0.15)', border: '#ffc13f', text: '#ffc13f' },
    subtitle: { bg: 'rgba(255,193,63,0.12)', border: '#ffc13f', text: '#ffc13f' },
    effect:   { bg: 'rgba(255,107,107,0.12)', border: '#ff6b6b', text: '#ff6b6b' },
  };
  return MAP[type] ?? MAP.video;
}

/**
 * Simple collision check: given a proposed [start, start+duration] range,
 * find the nearest sibling layer in the same track and clamp.
 *
 * Returns a safe startTime (clamped to 0 and away from neighbors).
 */
export function clampLayerPosition(newStart, duration, trackLayers, selfId) {
  let safeStart = Math.max(0, newStart);
  const end = safeStart + duration;

  for (const layer of trackLayers) {
    if (layer.id === selfId) continue;
    const lStart = layer.startTime ?? 0;
    const lEnd   = lStart + (layer.duration ?? 0);

    // Would overlap → snap to neighbor edge
    const overlapStart = safeStart < lEnd && end > lStart;
    if (overlapStart) {
      // Prefer snapping to the right of the neighbor
      if (newStart >= lStart) {
        safeStart = lEnd;
      } else {
        safeStart = Math.max(0, lStart - duration);
      }
    }
  }
  return safeStart;
}
