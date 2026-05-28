/**
 * animationEngine.js
 *
 * Extended: charReveal + wordHighlight animation types added.
 *
 * Layer animation schema (stored in layer.animations[]):
 * {
 *   property : 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity'
 *              | 'charReveal' | 'wordHighlight'
 *   keyframes: [{ t: number (0–1, relative to layer duration), value: number, easing?: string }]
 * }
 */

/* ─── Easing functions ───────────────────────────────────────────────────── */

export function linear(t) { return t; }

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeOut(t) { return 1 - (1 - t) * (1 - t); }
export function easeIn(t)  { return t * t; }

export function bounce(t) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1)     return n1 * t * t;
  if (t < 2 / d1)     return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1)   return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export function elastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

const EASINGS = { linear, easeInOut, easeOut, easeIn, bounce, elastic };
function resolveEasing(name) { return EASINGS[name] ?? linear; }

/* ─── Core interpolation ─────────────────────────────────────────────────── */

export function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Interpolate a value from an array of keyframes at normalized time t (0–1).
 * @param {{ t: number, value: number, easing?: string }[]} keyframes
 * @param {number} t — 0–1
 */
export function interpolateKeyframes(keyframes, t) {
  if (!keyframes || keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;
  if (t <= keyframes[0].t) return keyframes[0].value;
  if (t >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1].value;

  let lo = 0;
  for (let i = 1; i < keyframes.length; i++) {
    if (keyframes[i].t >= t) { lo = i - 1; break; }
  }
  const hi   = lo + 1;
  const kfLo = keyframes[lo];
  const kfHi = keyframes[hi];
  const segLen = kfHi.t - kfLo.t;
  const segT   = segLen === 0 ? 0 : (t - kfLo.t) / segLen;
  return lerp(kfLo.value, kfHi.value, resolveEasing(kfLo.easing ?? 'linear')(segT));
}

/* ─── Word-highlight helper ──────────────────────────────────────────────── */

/**
 * Given layer.text.words = [{word, start, duration}, ...] and absolute currentTime,
 * returns the index of the currently active word (-1 = none).
 * @param {object} layer
 * @param {number} currentTime
 * @returns {number}
 */
export function computeActiveWordIndex(layer, currentTime) {
  const layerStart = layer.startTime ?? 0;
  const layerDur = layer.duration ?? 1;
  const localTime  = currentTime - layerStart;

  // 1. If explicit karaoke word timings exist, use them:
  if (layer.text?.words && layer.text.words.length > 0) {
    const words = layer.text.words;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (localTime >= w.start && localTime < w.start + w.duration) return i;
    }
    return -1;
  }

  // 2. If no explicit words, but we have a textEffect, distribute evenly:
  const textEffect = layer.text?.textEffect;
  if (textEffect && textEffect !== 'none' && textEffect !== 'typewriter' && layer.text?.content) {
    const words = layer.text.content.split(/\s+/).filter(Boolean);
    if (words.length === 0) return -1;
    
    // Equal time per word
    const timePerWord = layerDur / words.length;
    let idx = Math.floor(localTime / timePerWord);
    if (idx < 0) idx = 0;
    if (idx >= words.length) idx = words.length - 1;
    
    return idx;
  }

  return -1;
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

/**
 * Compute the effective transform, style, and text-specific animated values
 * for a layer at `currentTime`.
 *
 * @param {object} layer
 * @param {number} currentTime — absolute timeline time (seconds)
 * @returns {{
 *   transform: object,
 *   style: { opacity: number },
 *   charRevealProgress: number,  // 0–1, for typewriter reveal
 *   activeWordIndex: number,     // for karaoke highlight (-1 = none)
 * }}
 */
export function applyAnimations(layer, currentTime) {
  const transform = { ...layer.transform };
  const style     = { opacity: layer.opacity ?? 1 };

  // Extra text animation outputs
  let charRevealProgress = 1; // default: show all characters
  let activeWordIndex    = computeActiveWordIndex(layer, currentTime);

  const animations = layer.animations;
  if (!animations || animations.length === 0) {
    return { transform, style, charRevealProgress, activeWordIndex };
  }

  const layerStart = layer.startTime ?? 0;
  const layerDur   = layer.duration  ?? 1;
  const localT     = Math.max(0, Math.min(1, (currentTime - layerStart) / layerDur));

  for (const anim of animations) {
    const { property, keyframes } = anim;
    if (!keyframes || !property) continue;
    const value = interpolateKeyframes(keyframes, localT);

    switch (property) {
      case 'charReveal':
        charRevealProgress = Math.max(0, Math.min(1, value));
        break;
      case 'opacity':
        style.opacity = value;
        break;
      case 'wordHighlight':
        break;
      case 'x':
      case 'y':
      case 'rotation':
        // Additive
        transform[property] = (layer.transform?.[property] ?? 0) + value;
        break;
      case 'scaleX':
      case 'scaleY':
        // Multiplicative
        transform[property] = (layer.transform?.[property] ?? 1) * value;
        break;
      default:
        // Absolute fallback
        if (property in transform) transform[property] = value;
        break;
    }
  }

  return { transform, style, charRevealProgress, activeWordIndex };
}
