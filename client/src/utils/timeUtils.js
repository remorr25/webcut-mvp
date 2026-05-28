/**
 * timeUtils.js
 * Pure utility functions for time/frame conversion and formatting.
 * No side effects, no store dependencies — safe to import anywhere.
 */

/**
 * Clamp a value between min and max (inclusive).
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Convert seconds to a frame number.
 * @param {number} seconds
 * @param {number} fps - frames per second (default 30)
 * @returns {number} integer frame number (floored)
 */
export function secondsToFrames(seconds, fps = 30) {
  return Math.floor(seconds * fps);
}

/**
 * Convert a frame number back to seconds.
 * @param {number} frames
 * @param {number} fps - frames per second (default 30)
 * @returns {number}
 */
export function framesToSeconds(frames, fps = 30) {
  return frames / fps;
}

/**
 * Format a time value (in seconds) as "MM:SS:FF" (minutes, seconds, frames).
 * e.g. 65.5 s @ 30 fps  →  "01:05:15"
 *
 * @param {number} seconds
 * @param {number} fps - frames per second (default 30)
 * @returns {string} "MM:SS:FF"
 */
export function formatTime(seconds, fps = 30) {
  const totalFrames  = Math.floor(seconds * fps);
  const frames       = totalFrames % fps;
  const totalSeconds = Math.floor(seconds);
  const secs         = totalSeconds % 60;
  const mins         = Math.floor(totalSeconds / 60);

  const pad = n => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

/**
 * Parse a "MM:SS:FF" string back to seconds.
 * @param {string} timecode - e.g. "01:05:15"
 * @param {number} fps - frames per second (default 30)
 * @returns {number} seconds
 */
export function parseTimecode(timecode, fps = 30) {
  const parts = timecode.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`[timeUtils] Invalid timecode: "${timecode}"`);
  }
  const [mins, secs, frames] = parts;
  return mins * 60 + secs + frames / fps;
}
