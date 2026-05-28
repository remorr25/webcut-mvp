import { v4 as uuidv4 } from 'uuid';

/**
 * layerUtils.js
 * Factory and helpers for Timeline layer objects.
 *
 * Layer schema (all fields always present):
 * {
 *   id          : string (uuid)
 *   type        : 'video' | 'audio' | 'text' | 'image' | 'effect'
 *   name        : string
 *   src         : string | null     — file path or URL
 *   startTime   : number            — position on timeline (seconds)
 *   duration    : number            — clip duration (seconds)
 *   trimIn      : number            — trim from start of source (seconds)
 *   trimOut     : number            — trim from end of source (seconds)
 *   volume      : number            — 0–1 (audio/video)
 *   opacity     : number            — 0–1 (video/image/text)
 *   speed       : number            — playback speed multiplier
 *   muted       : boolean
 *   locked      : boolean
 *   transform   : { x, y, scaleX, scaleY, rotation } — for video/image/text
 *   text        : TextConfig | null — only for type 'text'
 *   effects     : string[]          — effect identifiers
 *   transitions : { in, out }       — transition identifiers or null
 *   meta        : {}                — arbitrary extra data
 * }
 */

/* ─── Default values per field ───────────────────────────────────────────── */
const BASE_DEFAULTS = {
  type:       'video',
  name:       'New Layer',
  src:        null,
  startTime:  0,
  duration:   5,
  trimIn:     0,
  trimOut:    0,
  volume:     1,
  opacity:    1,
  speed:      1,
  muted:      false,
  locked:     false,
  transform: {
    x:        0,
    y:        0,
    scaleX:   1,
    scaleY:   1,
    rotation: 0,
  },
  text:       null,
  effects:    [],
  transitions: {
    in:  null,
    out: null,
  },
  meta: {},
};

/** Text layer default config */
const TEXT_DEFAULTS = {
  content:    'New Text',
  fontFamily: 'Inter',
  fontSize:   48,
  fontWeight: 700,
  color:      '#ffffff',
  align:      'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  shadow:     null,
  stroke:     null,
  background: null,
  textEffect: 'none',
  highlightColor: '#ffe500',
};

/* ─── Type-specific overrides ────────────────────────────────────────────── */
const TYPE_OVERRIDES = {
  video:    { name: 'Video Layer' },
  audio:    { name: 'Audio Layer',    opacity: 1, transform: { ...BASE_DEFAULTS.transform } },
  image:    { name: 'Image Layer',    duration: 5 },
  text:     { name: 'Text Layer',     duration: 5, src: null, text: { ...TEXT_DEFAULTS } },
  subtitle: { name: 'Subtitle Layer', duration: 3, src: null, text: { ...TEXT_DEFAULTS } },
  effect:   { name: 'Effect Layer',   duration: 5, src: null },
};

/* ─── Public API ─────────────────────────────────────────────────────────── */

/**
 * Create a fully-populated layer object.
 *
 * @param {'video'|'audio'|'image'|'text'|'effect'} type
 * @param {Partial<Layer>} overrides - any fields to override defaults
 * @returns {Layer}
 */
export function createLayer(type = 'video', overrides = {}) {
  const typeDefaults = TYPE_OVERRIDES[type] ?? {};

  const layer = {
    ...BASE_DEFAULTS,
    ...typeDefaults,
    ...overrides,
    id:   uuidv4(),
    type,
    // Deep merge transform so partial overrides don't lose other keys
    transform: {
      ...BASE_DEFAULTS.transform,
      ...(typeDefaults.transform ?? {}),
      ...(overrides.transform ?? {}),
    },
    // Deep merge text config for text and subtitle layers
    text:
      (type === 'text' || type === 'subtitle')
        ? { ...TEXT_DEFAULTS, ...(typeDefaults.text ?? {}), ...(overrides.text ?? {}) }
        : (overrides.text ?? null),
    // Deep merge transitions
    transitions: {
      ...BASE_DEFAULTS.transitions,
      ...(overrides.transitions ?? {}),
    },
    // Shallow merge meta
    meta: {
      ...(typeDefaults.meta ?? {}),
      ...(overrides.meta ?? {}),
    },
  };

  return layer;
}

/**
 * Return true if the object looks like a valid layer.
 * Useful for runtime assertions / debug guards.
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isValidLayer(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.startTime === 'number' &&
    typeof obj.duration === 'number'
  );
}

/**
 * Clone a layer with a fresh UUID (useful for copy-paste).
 * @param {Layer} layer
 * @param {Partial<Layer>} overrides
 * @returns {Layer}
 */
export function cloneLayer(layer, overrides = {}) {
  return {
    ...layer,
    ...overrides,
    id: uuidv4(),
    name: overrides.name ?? `${layer.name} (copy)`,
  };
}
