

/**
 * subtitleTemplates.js
 *
 * 4 production-ready subtitle/text layer templates.
 * Each is a complete layer JSON object ready to be passed to projectStore.addLayer().
 *
 * Canvas coordinate system (1080×1920, portrait):
 *   transform.x / transform.y are offsets from canvas CENTER (540, 960).
 *   Center-bottom absolute (540, 1700) translates to: x: 0, y: 740.
 */

/* ─── Shared defaults ─────────────────────────────────────────────────────── */
const BOTTOM_CENTER = { x: 0, y: 740, scaleX: 1, scaleY: 1, rotation: 0 };

/* ─── 1. TikTok Style ─────────────────────────────────────────────────────── */
export const TIKTOK_TEMPLATE = {
  type:      'text',
  name:      'TikTok Style',
  startTime: 0,
  duration:  3,
  opacity:   1,
  transform: { ...BOTTOM_CENTER },
  text: {
    content:      'YOUR TEXT HERE',
    fontFamily:   'Bebas Neue',
    fontSize:     88,
    fontWeight:   900,
    color:        '#ffffff',
    align:        'center',
    letterSpacing: 2,
    stroke:       { color: '#000000', width: 6 },
    shadow:       null,
    gradient:     null,
    background:   null,
    glowColor:    null,
  },
  // Pop-in: scale 0 → 1.08 → 1 in first 0.3 s
  animations: [
    {
      property: 'scaleX',
      keyframes: [
        { t: 0,    value: 0,    easing: 'easeOut' },
        { t: 0.06, value: 1.08, easing: 'easeOut' },
        { t: 0.12, value: 1,   easing: 'easeInOut' },
        { t: 1,    value: 1 },
      ],
    },
    {
      property: 'scaleY',
      keyframes: [
        { t: 0,    value: 0,    easing: 'easeOut' },
        { t: 0.06, value: 1.08, easing: 'easeOut' },
        { t: 0.12, value: 1,   easing: 'easeInOut' },
        { t: 1,    value: 1 },
      ],
    },
  ],
  effects: [], transitions: { in: null, out: null }, meta: { template: 'tiktok' },
};

/* ─── 2. Karaoke ──────────────────────────────────────────────────────────── */
export const KARAOKE_TEMPLATE = {
  type:      'text',
  name:      'Karaoke',
  startTime: 0,
  duration:  4,
  opacity:   1,
  transform: { ...BOTTOM_CENTER },
  text: {
    content:       'Hello World',
    fontFamily:    'Poppins',
    fontSize:      72,
    fontWeight:    700,
    color:         '#ffffff',
    align:         'center',
    letterSpacing: 0,
    stroke:        { color: '#000000', width: 3 },
    shadow:        null,
    gradient:      null,
    background:    null,
    glowColor:     null,
    // Per-word timing for highlight rendering
    words: [
      { word: 'Hello', start: 0,   duration: 1.6 },
      { word: 'World', start: 1.6, duration: 2.0 },
    ],
    highlightColor: '#ffe74c',
    renderMode:    'karaoke',
  },
  animations: [
    // Subtle bounce on y at start
    {
      property: 'y',
      keyframes: [
        { t: 0,    value: 780,  easing: 'bounce' },
        { t: 0.08, value: 730,  easing: 'easeOut' },
        { t: 0.15, value: 740 },
        { t: 1,    value: 740 },
      ],
    },
  ],
  effects: [], transitions: { in: null, out: null }, meta: { template: 'karaoke' },
};

/* ─── 3. Neon ─────────────────────────────────────────────────────────────── */
export const NEON_TEMPLATE = {
  type:      'text',
  name:      'Neon',
  startTime: 0,
  duration:  3,
  opacity:   1,
  transform: { ...BOTTOM_CENTER },
  text: {
    content:       'NEON TEXT',
    fontFamily:    'Bebas Neue',
    fontSize:      96,
    fontWeight:    900,
    color:         '#00ffcc',
    align:         'center',
    letterSpacing: 4,
    stroke:        null,
    shadow:        null,
    gradient:      null,
    background:    null,
    glowColor:     '#00ffcc',
    glowBlur:      28,
    renderMode:    'neon',
  },
  // Flicker: opacity 0 → 1 → 0.75 → 1 → 0.85 → 1 in first 0.5s, then stable
  animations: [
    {
      property: 'opacity',
      keyframes: [
        { t: 0,    value: 0,    easing: 'easeOut' },
        { t: 0.08, value: 1,    easing: 'linear' },
        { t: 0.12, value: 0.75, easing: 'linear' },
        { t: 0.16, value: 1,    easing: 'linear' },
        { t: 0.20, value: 0.85, easing: 'linear' },
        { t: 0.26, value: 1,    easing: 'easeOut' },
        { t: 1,    value: 1 },
      ],
    },
  ],
  effects: [], transitions: { in: null, out: null }, meta: { template: 'neon' },
};

/* ─── 4. Typewriter ───────────────────────────────────────────────────────── */
export const TYPEWRITER_TEMPLATE = {
  type:      'text',
  name:      'Typewriter',
  startTime: 0,
  duration:  3,
  opacity:   1,
  transform: { ...BOTTOM_CENTER },
  text: {
    content:       'Type your message...',
    fontFamily:    'Inter',
    fontSize:      64,
    fontWeight:    500,
    color:         '#f0f0f0',
    align:         'center',
    letterSpacing: 0,
    stroke:        null,
    shadow:        { color: 'rgba(0,0,0,0.6)', blur: 8, x: 1, y: 2 },
    gradient:      null,
    background:    null,
    glowColor:     null,
    revealMode:    'character',
    renderMode:    'typewriter',
  },
  // charReveal 0 → 1 over 65% of layer duration, hold at 1 after
  animations: [
    {
      property: 'charReveal',
      keyframes: [
        { t: 0,    value: 0, easing: 'linear' },
        { t: 0.65, value: 1 },
        { t: 1,    value: 1 },
      ],
    },
  ],
  effects: [], transitions: { in: null, out: null }, meta: { template: 'typewriter' },
};

/* ─── Default plain text layer ────────────────────────────────────────────── */
export const DEFAULT_TEXT_LAYER = {
  type:      'text',
  name:      'New Text',
  startTime: 0,
  duration:  3,
  opacity:   1,
  transform: { ...BOTTOM_CENTER },
  text: {
    content:       'New Text',
    fontFamily:    'Inter',
    fontSize:      72,
    fontWeight:    700,
    color:         '#ffffff',
    align:         'center',
    letterSpacing: 0,
    stroke:        { color: '#000000', width: 4 },
    shadow:        { color: 'rgba(0,0,0,0.7)', blur: 6, x: 2, y: 2 },
    gradient:      null,
    background:    null,
    glowColor:     null,
  },
  animations: [], effects: [], transitions: { in: null, out: null }, meta: {},
};

/* ─── Default subtitle layer ──────────────────────────────────────────────── */
export const DEFAULT_SUBTITLE_LAYER = {
  ...DEFAULT_TEXT_LAYER,
  type:  'subtitle',
  name:  'Subtitle',
  duration: 2.5,
  text: {
    ...DEFAULT_TEXT_LAYER.text,
    fontSize:  64,
    fontFamily: 'Inter',
    content:   'Subtitle Text',
    background: 'rgba(0,0,0,0.5)',
    stroke:     null,
    shadow:     null,
  },
  meta: { isSubtitle: true },
};

/* ─── 5. CapCut Style ─────────────────────────────────────────────────────── */
export const CAPCUT_TEMPLATE = {
  type:      'text',
  name:      'CapCut Style',
  startTime: 0,
  duration:  3,
  opacity:   1,
  transform: { ...BOTTOM_CENTER },
  text: {
    content:       'CapCut Style Highlight',
    fontFamily:    'Montserrat',
    fontSize:      80,
    fontWeight:    900,
    color:         '#ffffff',
    align:         'center',
    letterSpacing: 0,
    stroke:        { color: '#000000', width: 8 },
    shadow:        null,
    gradient:      null,
    background:    null,
    glowColor:     null,
    textEffect:    'word-by-word',
    highlightColor: '#ffe500',
  },
  animations: [], effects: [], transitions: { in: null, out: null }, meta: { template: 'capcut' },
};

/* ─── Exported templates array (for UI iteration) ─────────────────────────── */
export const SUBTITLE_TEMPLATES = [
  { id: 'tiktok',     label: 'TikTok',      emoji: '🎵', layer: TIKTOK_TEMPLATE },
  { id: 'karaoke',    label: 'Karaoke',     emoji: '🎤', layer: KARAOKE_TEMPLATE },
  { id: 'neon',       label: 'Neon',        emoji: '✨', layer: NEON_TEMPLATE },
  { id: 'typewriter', label: 'Typewriter',  emoji: '⌨',  layer: TYPEWRITER_TEMPLATE },
  { id: 'capcut',     label: 'CapCut',      emoji: '🔥', layer: CAPCUT_TEMPLATE },
];
