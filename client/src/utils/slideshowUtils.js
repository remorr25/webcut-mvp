import { v4 as uuidv4 } from 'uuid';
import { createLayer } from './layerUtils';

export function buildSlideshowFromImages(mediaItems, options = {}) {
  const imageDuration = options.imageDuration || 3.0;
  const transitionDuration = options.transitionDuration || 0.5;
  const trackId = 'track-slideshow-' + uuidv4();

  const layers = [];
  const transitions = [];

  let currentStartTime = 0;

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    
    // Base layer
    const layer = createLayer('image', {
      trackId,
      startTime: currentStartTime,
      duration: imageDuration,
      src: item.url,
      meta: { width: 1080, height: 1920 } // Rough fallback
    });

    // Add Ken Burns
    const presets = [
      { property: 'scaleX', kf: [{ t: 0, value: 1.0, easing: 'linear' }, { t: 1, value: 1.1, easing: 'linear' }] },
      { property: 'scaleX', kf: [{ t: 0, value: 1.1, easing: 'linear' }, { t: 1, value: 1.0, easing: 'linear' }] },
      { property: 'x', kf: [{ t: 0, value: 50, easing: 'linear' }, { t: 1, value: -50, easing: 'linear' }] }
    ];
    const preset = presets[Math.floor(Math.random() * presets.length)];
    
    layer.animations = [{
      id: uuidv4(),
      property: preset.property,
      keyframes: preset.kf
    }];
    
    // If it's scaleX, duplicate for scaleY
    if (preset.property === 'scaleX') {
      layer.animations.push({
        id: uuidv4(),
        property: 'scaleY',
        keyframes: preset.kf
      });
    }

    layers.push(layer);

    // If there was a previous layer, add a transition
    if (i > 0) {
      const prevLayer = layers[i - 1];
      transitions.push({
        id: uuidv4(),
        type: 'fade', // Default transition
        duration: transitionDuration,
        betweenLayers: [prevLayer.id, layer.id]
      });
    }

    // Next layer starts exactly where this one ends MINUS the transition overlap
    currentStartTime = currentStartTime + imageDuration - transitionDuration;
  }

  // Extend project duration to fit everything plus 2 seconds buffer
  const projectDuration = currentStartTime + transitionDuration + 2.0;

  const track = {
    id: trackId,
    type: 'video',
    layers
  };

  return { track, transitions, projectDuration };
}
