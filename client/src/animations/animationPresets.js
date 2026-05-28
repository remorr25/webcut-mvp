import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a unique instance of a preset animation array.
 */
function createPreset(animations) {
  return animations.map(a => ({
    ...a,
    id: uuidv4(),
  }));
}

export const PRESETS = {
  fadeIn: () => createPreset([
    {
      property: 'opacity',
      keyframes: [
        { t: 0, value: 0, easing: 'linear' },
        { t: 0.4, value: 1, easing: 'linear' }
      ]
    }
  ]),

  fadeOut: () => createPreset([
    {
      property: 'opacity',
      keyframes: [
        { t: 0.6, value: 1, easing: 'linear' },
        { t: 1, value: 0, easing: 'linear' }
      ]
    }
  ]),

  popIn: () => createPreset([
    {
      property: 'scaleX',
      keyframes: [
        { t: 0, value: 0.5, easing: 'easeOut' },
        { t: 0.2, value: 1.1, easing: 'easeOut' },
        { t: 0.4, value: 1.0, easing: 'easeInOut' }
      ]
    },
    {
      property: 'scaleY',
      keyframes: [
        { t: 0, value: 0.5, easing: 'easeOut' },
        { t: 0.2, value: 1.1, easing: 'easeOut' },
        { t: 0.4, value: 1.0, easing: 'easeInOut' }
      ]
    }
  ]),

  bounce: () => createPreset([
    {
      property: 'y',
      keyframes: [
        { t: 0, value: -40, easing: 'bounce' },
        { t: 0.5, value: 0, easing: 'linear' }
      ]
    }
  ]),

  slideInBottom: () => createPreset([
    {
      property: 'y',
      keyframes: [
        { t: 0, value: 100, easing: 'easeOut' },
        { t: 0.3, value: 0, easing: 'linear' }
      ]
    }
  ]),

  slideInLeft: () => createPreset([
    {
      property: 'x',
      keyframes: [
        { t: 0, value: -200, easing: 'easeOut' },
        { t: 0.3, value: 0, easing: 'linear' }
      ]
    }
  ]),

  shake: () => createPreset([
    {
      property: 'x',
      keyframes: [
        { t: 0, value: 0, easing: 'linear' },
        { t: 0.1, value: -10, easing: 'linear' },
        { t: 0.2, value: 10, easing: 'linear' },
        { t: 0.3, value: -10, easing: 'linear' },
        { t: 0.4, value: 0, easing: 'linear' }
      ]
    }
  ]),

  zoomIn: () => createPreset([
    {
      property: 'scaleX',
      keyframes: [
        { t: 0, value: 0, easing: 'easeOut' },
        { t: 0.5, value: 1, easing: 'linear' }
      ]
    },
    {
      property: 'scaleY',
      keyframes: [
        { t: 0, value: 0, easing: 'easeOut' },
        { t: 0.5, value: 1, easing: 'linear' }
      ]
    }
  ]),

  typewriter: () => createPreset([
    {
      property: 'charReveal',
      keyframes: [
        { t: 0, value: 0, easing: 'linear' },
        { t: 1, value: 1, easing: 'linear' }
      ]
    }
  ]),

  neonFlicker: () => createPreset([
    {
      property: 'opacity',
      keyframes: [
        { t: 0, value: 0.4, easing: 'linear' },
        { t: 0.1, value: 1.0, easing: 'linear' },
        { t: 0.2, value: 0.7, easing: 'linear' },
        { t: 0.3, value: 1.0, easing: 'linear' },
        { t: 0.4, value: 0.9, easing: 'linear' },
        { t: 0.6, value: 1.0, easing: 'linear' }
      ]
    }
  ])
};

export const PRESET_LIST = [
  { id: 'fadeIn', label: 'Fade In', type: 'enter' },
  { id: 'fadeOut', label: 'Fade Out', type: 'exit' },
  { id: 'popIn', label: 'Pop In', type: 'enter' },
  { id: 'bounce', label: 'Bounce', type: 'enter' },
  { id: 'slideInBottom', label: 'Slide Up', type: 'enter' },
  { id: 'slideInLeft', label: 'Slide Right', type: 'enter' },
  { id: 'shake', label: 'Shake', type: 'enter' },
  { id: 'zoomIn', label: 'Zoom In', type: 'enter' },
  { id: 'typewriter', label: 'Typewriter', type: 'enter' },
  { id: 'neonFlicker', label: 'Neon Flicker', type: 'enter' },
];
