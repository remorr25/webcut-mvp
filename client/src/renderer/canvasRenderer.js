/**
 * canvasRenderer.js
 *
 * Stateless canvas rendering pipeline.
 * All functions receive ctx, project, currentTime, scale — no closures over store.
 *
 * Project resolution: 1920 × 1080 (16:9 landscape)
 * scale = canvasDisplayWidth / 1920  (same ratio applies to height)
 */
import { applyAnimations } from '../animations/animationEngine.js';

export const PROJECT_WIDTH  = 1080;
export const PROJECT_HEIGHT = 1920;

/* ─── Buffer Factory ─────────────────────────────────────────────────────── */
function createBufferCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  if (typeof global !== 'undefined' && global.createCanvas) {
    return global.createCanvas(w, h);
  }
  throw new Error('No canvas implementation found');
}

/* ─── Text Cache ─────────────────────────────────────────────────────────── */
const textCache = new Map();

/* ─── Image cache ─────────────────────────────────────────────────────────── */
/** @type {Map<string, HTMLImageElement>} */
const imageCache = new Map();

let onImageLoadCallback = null;

export function setOnImageLoadCallback(cb) {
  onImageLoadCallback = cb;
}

/**
 * Preload all image/sticker src values from the project into the cache.
 * Call this once when the project loads or media changes.
 * @param {object} project
 */
export function preloadImages(project) {
  if (!project?.tracks) return;
  for (const track of project.tracks) {
    for (const layer of track.layers) {
      if ((layer.type === 'image' || layer.type === 'sticker') && layer.src) {
        getCachedImage(layer.src);
      }
    }
  }
}

export async function preloadImagesAsync(project) {
  if (!project?.tracks) return;
  const promises = [];
  for (const track of project.tracks) {
    for (const layer of track.layers) {
      if ((layer.type === 'image' || layer.type === 'sticker') && layer.src) {
        promises.push(new Promise(resolve => {
          const img = getCachedImage(layer.src);
          if (img.complete) {
            resolve();
          } else {
            const oldOnload = img.onload;
            img.onload = () => {
              if (oldOnload) oldOnload();
              resolve();
            };
            img.onerror = () => resolve(); // continue even if fail
          }
        }));
      }
    }
  }
  await Promise.all(promises);
}

/**
 * Get (or create) a cached HTMLImageElement for a src.
 * @param {string} src
 * @returns {HTMLImageElement}
 */
function getCachedImage(src) {
  if (!imageCache.has(src)) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (onImageLoadCallback) onImageLoadCallback();
    };
    img.src = src;
    imageCache.set(src, img);
  }
  return imageCache.get(src);
}

/* ─── Layer visibility test ──────────────────────────────────────────────── */
/**
 * @param {object} layer
 * @param {number} currentTime
 */
function isLayerActive(layer, currentTime) {
  const start = layer.startTime ?? 0;
  const end   = start + (layer.duration ?? 0);
  return currentTime >= start && currentTime < end;
}

/* ─── Transform helpers ──────────────────────────────────────────────────── */
/**
 * Apply layer transform to canvas context.
 * All x/y positions are in project-space (1920×1080), scaled by `scale`.
 */
function applyTransform(ctx, transform, scale) {
  const x        = (transform.x ?? 0) * scale;
  const y        = (transform.y ?? 0) * scale;
  const scaleX   = Math.max(0.01, transform.scaleX ?? 1);
  const scaleY   = Math.max(0.01, transform.scaleY ?? 1);
  const rotation = ((transform.rotation ?? 0) * Math.PI) / 180; // degrees → radians

  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);
}

/* ─── Individual layer renderers ─────────────────────────────────────────── */

/**
 * Render an image (or sticker) layer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}  layer
 * @param {number}  currentTime
 * @param {number}  scale
 */
export function renderImageLayer(ctx, layer, currentTime, scale) {
  if (!layer.src) return;
  const img = getCachedImage(layer.src);
  if (!img.complete || img.naturalWidth === 0) return; // not loaded yet

  const { transform, style } = applyAnimations(layer, currentTime);

  ctx.save();

  // Translate to the project-space center anchor (default 960,540 = center)
  const cx = (PROJECT_WIDTH  / 2) * scale;
  const cy = (PROJECT_HEIGHT / 2) * scale;
  ctx.translate(cx, cy);

  // Apply layer transform relative to center
  applyTransform(ctx, transform, scale);

  // Opacity
  let op = Math.max(0, Math.min(1, style.opacity));
  if (layer._muted) op *= 0.5;
  ctx.globalAlpha = op;

  if (layer.type === 'image') {
    // "Cover" logic for background images
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = PROJECT_WIDTH / PROJECT_HEIGHT;
    
    let drawW, drawH;
    if (imgAspect > canvasAspect) {
      // Image is wider than canvas, match height
      drawH = PROJECT_HEIGHT * scale;
      drawW = drawH * imgAspect;
    } else {
      // Image is taller than canvas, match width
      drawW = PROJECT_WIDTH * scale;
      drawH = drawW / imgAspect;
    }
    
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    // Sticker or other - natural size
    const drawW = img.naturalWidth  * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.restore();
}

/**
 * Render a text layer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}  layer
 * @param {number}  currentTime
 * @param {number}  scale
 */
export function renderTextLayer(ctx, layer, currentTime, scale) {
  const cfg = layer.text;
  if (!cfg) return;

  const { transform, style, charRevealProgress, activeWordIndex } = applyAnimations(layer, currentTime);

  let op = Math.max(0, Math.min(1, style.opacity));
  if (layer._muted) op *= 0.5;
  if (op <= 0) return;

  const fullContent = cfg.content ?? '';
  let content = fullContent;
  if (cfg.renderMode === 'typewriter' && charRevealProgress !== undefined) {
    const charsToShow = Math.round(fullContent.length * charRevealProgress);
    content = fullContent.substring(0, charsToShow);
  }

  // 1. Generate signature for rasterization properties
  const sigObj = { content, scale, cfg, activeWordIndex, currentTime };
  const signature = JSON.stringify(sigObj);

  // 2. Check cache
  let cache = textCache.get(layer.id);
  const w = PROJECT_WIDTH * scale;
  const h = PROJECT_HEIGHT * scale;

  if (!cache || cache.signature !== signature) {
    if (!cache) {
      cache = { canvas: createBufferCanvas(w, h), ctx: null };
      cache.ctx = cache.canvas.getContext('2d');
      textCache.set(layer.id, cache);
    }
    
    // Resize or clear buffer
    if (cache.canvas.width !== w || cache.canvas.height !== h) {
      cache.canvas.width = w;
      cache.canvas.height = h;
    } else {
      cache.ctx.clearRect(0, 0, w, h);
    }
    
    cache.signature = signature;
    const bCtx = cache.ctx;

    const fontSize     = (cfg.fontSize ?? 48) * scale;
    const fontFamily   = cfg.fontFamily ?? 'Inter';
    const fontWeight   = cfg.fontWeight ?? 700;
    const color        = cfg.color ?? '#ffffff';
    const align        = cfg.align ?? 'center';
    const letterSpacing = (cfg.letterSpacing ?? 0) * scale;

    bCtx.save();
    
    // We draw text at center of the buffer, just like the layer center.
    bCtx.translate(w / 2, h / 2);

    bCtx.font          = `${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
    bCtx.textAlign     = align;
    bCtx.textBaseline  = 'middle';
    if ('letterSpacing' in bCtx) {
      bCtx.letterSpacing = `${letterSpacing}px`;
    }

    if (cfg.glowColor) {
      bCtx.shadowColor = cfg.glowColor;
      bCtx.shadowBlur = (cfg.glowBlur || 20) * scale;
      bCtx.shadowOffsetX = 0;
      bCtx.shadowOffsetY = 0;
    } else if (cfg.shadow) {
      bCtx.shadowColor   = cfg.shadow.color   ?? 'rgba(0,0,0,0.5)';
      bCtx.shadowBlur    = (cfg.shadow.blur   ?? 4) * scale;
      bCtx.shadowOffsetX = (cfg.shadow.x      ?? 2) * scale;
      bCtx.shadowOffsetY = (cfg.shadow.y      ?? 2) * scale;
    }

    if (cfg.background) {
      const metrics  = bCtx.measureText(content);
      const pad      = 8 * scale;
      const boxW     = metrics.width + pad * 2;
      const boxH     = fontSize + pad * 2;
      bCtx.fillStyle = cfg.background;
      let boxX = 0;
      if (align === 'center') boxX = -boxW / 2;
      else if (align === 'right') boxX = -boxW;
      bCtx.fillRect(boxX, -boxH / 2, boxW, boxH);
      bCtx.shadowColor = 'transparent'; 
    }

    function drawTextContent(text, x, y, fillCol) {
      if (cfg.stroke) {
        bCtx.strokeStyle = cfg.stroke.color ?? '#000000';
        bCtx.lineWidth   = (cfg.stroke.width ?? 2) * scale;
        bCtx.strokeText(text, x, y);
      }
      bCtx.fillStyle = fillCol;
      bCtx.fillText(text, x, y);
    }

    // Maximum width for text wrapping (90% of canvas width by default)
    const maxWidth = (PROJECT_WIDTH * 0.9) * scale;
    const lh = (cfg.lineHeight ?? 1.4) * fontSize;
    const spaceWidth = bCtx.measureText(" ").width;

    let wordsArray = [];
    if (cfg.renderMode === 'karaoke' && cfg.words) {
      wordsArray = cfg.words.map(w => w.word);
    } else {
      wordsArray = content.split(/\s+/).filter(Boolean);
    }

    // Build lines
    const lines = [];
    let currentLine = { words: [], width: 0 };
    
    for (let i = 0; i < wordsArray.length; i++) {
      const wd = wordsArray[i];
      const w = bCtx.measureText(wd).width;
      
      if (currentLine.words.length === 0) {
        currentLine.words.push({ word: wd, width: w, index: i });
        currentLine.width = w;
      } else {
        if (currentLine.width + spaceWidth + w > maxWidth) {
          lines.push(currentLine);
          currentLine = { words: [{ word: wd, width: w, index: i }], width: w };
        } else {
          currentLine.words.push({ word: wd, width: w, index: i });
          currentLine.width += spaceWidth + w;
        }
      }
    }
    if (currentLine.words.length > 0) {
      lines.push(currentLine);
    }

    const blockHeight = lines.length * lh;
    let startY = -blockHeight / 2 + (lh / 2); // Vertically center the block
    
    const isKaraoke = cfg.renderMode === 'karaoke' && cfg.words;
    const effect = cfg.textEffect;
    bCtx.textAlign = 'left';

    for (const line of lines) {
      let startX = 0;
      if (align === 'center') startX = -line.width / 2;
      else if (align === 'right') startX = -line.width;
      
      for (const wObj of line.words) {
        const i = wObj.index;
        let shouldDraw = true;
        let isHighlighted = false;

        if (isKaraoke || effect === 'highlight') {
          isHighlighted = (i === activeWordIndex);
        } else if (effect === 'word-by-word') {
          shouldDraw = (i === activeWordIndex);
        } else if (effect === 'accumulate') {
          shouldDraw = (i <= activeWordIndex);
        } // else if 'none' or 'typewriter', shouldDraw = true, isHighlighted = false

        if (shouldDraw) {
          let fillCol = color;
          
          if (isHighlighted) {
            fillCol = cfg.highlightColor ?? '#ffe500';
          } else if (cfg.gradient && !isKaraoke && effect !== 'highlight' && effect !== 'word-by-word' && effect !== 'accumulate') {
            // Apply gradient for whole block only for standard text
            const grad = bCtx.createLinearGradient(startX, 0, startX + line.width, 0);
            grad.addColorStop(0, cfg.gradient.start ?? color);
            grad.addColorStop(1, cfg.gradient.end ?? color);
            fillCol = grad;
          }

          drawTextContent(wObj.word, startX, startY, fillCol);
        }
        startX += wObj.width + spaceWidth;
      }
      startY += lh;
    }
    bCtx.restore();
  }

  // 3. Draw buffer onto main canvas
  ctx.save();
  
  const cx = (PROJECT_WIDTH  / 2) * scale;
  const cy = (PROJECT_HEIGHT / 2) * scale;
  ctx.translate(cx, cy);
  applyTransform(ctx, transform, scale);
  
  ctx.globalAlpha = op;
  // Buffer was drawn centered at (w/2, h/2) so we draw it offset by -w/2, -h/2
  ctx.drawImage(cache.canvas, -w / 2, -h / 2, w, h);
  
  ctx.restore();
}

/**
 * Subtitle layer — renders like text with optional slide-in animation.
 */
export function renderSubtitleLayer(ctx, layer, currentTime, scale) {
  // Subtitles live near the bottom by default
  const subtitleLayer = {
    ...layer,
    transform: {
      ...layer.transform,
      y: layer.transform?.y ?? (PROJECT_HEIGHT * 0.35), // 35% from center = 88% from top
    },
  };
  renderTextLayer(ctx, subtitleLayer, currentTime, scale);
}

/**
 * Sticker — treated as image.
 */
export function renderStickerLayer(ctx, layer, currentTime, scale) {
  renderImageLayer(ctx, layer, currentTime, scale);
}

/* ─── Main render function ───────────────────────────────────────────────── */

function renderLayer(ctx, layer, currentTime, scale) {
  switch (layer.type) {
    case 'image':    renderImageLayer(ctx, layer, currentTime, scale);    break;
    case 'text':     renderTextLayer(ctx, layer, currentTime, scale);     break;
    case 'subtitle': renderSubtitleLayer(ctx, layer, currentTime, scale); break;
    case 'sticker':  renderStickerLayer(ctx, layer, currentTime, scale);  break;
    default: break;
  }
}

/* ─── Transitions ────────────────────────────────────────────────────────── */

function renderTransitions(ctx, project, currentTime, scale, activeLayers) {
  const renderedLayerIds = new Set();
  if (!project.transitions) return renderedLayerIds;

  const canvasW = PROJECT_WIDTH * scale;
  const canvasH = PROJECT_HEIGHT * scale;

  for (const trans of project.transitions) {
    if (!trans.betweenLayers || trans.betweenLayers.length !== 2) continue;
    const [id1, id2] = trans.betweenLayers;
    
    const layer1 = activeLayers.find(l => l.id === id1);
    const layer2 = activeLayers.find(l => l.id === id2);
    if (!layer1 || !layer2) continue;

    const duration = trans.duration || 0.5;
    const transStart = layer2.startTime;
    const transEnd = transStart + duration;

    if (currentTime >= transStart && currentTime < transEnd) {
      const progress = (currentTime - transStart) / duration;
      
      ctx.save();
      switch (trans.type) {
        case 'slide':
          ctx.save();
          ctx.translate(-progress * canvasW, 0);
          renderLayer(ctx, layer1, currentTime, scale);
          ctx.restore();
          ctx.save();
          ctx.translate((1 - progress) * canvasW, 0);
          renderLayer(ctx, layer2, currentTime, scale);
          ctx.restore();
          break;
        case 'zoom':
          ctx.save();
          ctx.globalAlpha = 1 - progress;
          ctx.translate(canvasW / 2, canvasH / 2);
          ctx.scale(1 + progress * 0.5, 1 + progress * 0.5);
          ctx.translate(-canvasW / 2, -canvasH / 2);
          renderLayer(ctx, layer1, currentTime, scale);
          ctx.restore();
          
          ctx.save();
          ctx.globalAlpha = progress;
          renderLayer(ctx, layer2, currentTime, scale);
          ctx.restore();
          break;
        case 'wipe':
          renderLayer(ctx, layer1, currentTime, scale);
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, progress * canvasW, canvasH);
          ctx.clip();
          renderLayer(ctx, layer2, currentTime, scale);
          ctx.restore();
          break;
        case 'fade':
        default:
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - progress);
          renderLayer(ctx, layer1, currentTime, scale);
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = Math.max(0, progress);
          renderLayer(ctx, layer2, currentTime, scale);
          ctx.restore();
          break;
      }
      ctx.restore();
      
      renderedLayerIds.add(id1);
      renderedLayerIds.add(id2);
    }
  }
  return renderedLayerIds;
}

/**
 * Render a single frame to the canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} project        — full Timeline JSON
 * @param {number} currentTime    — seconds
 * @param {number} scale          — canvasWidth / PROJECT_WIDTH
 */
export function renderFrame(ctx, project, currentTime, scale) {
  if (!ctx || !project) return;

  const canvasW = PROJECT_WIDTH  * scale;
  const canvasH = PROJECT_HEIGHT * scale;

  // 1. Clear
  ctx.clearRect(0, 0, canvasW, canvasH);

  if (!project.tracks?.length) return;

  // 2. Gather active non-AV layers, sorted tracks[0] = bottom, last = top
  const activeLayers = [];
  for (const track of project.tracks) {
    for (const layer of track.layers) {
      if (layer.type === 'video' || layer.type === 'audio') continue;
      if (isLayerActive(layer, currentTime)) {
        activeLayers.push({ ...layer, _muted: track.muted });
      }
    }
  }

  // 3. Render Transitions
  const transitionedIds = renderTransitions(ctx, project, currentTime, scale, activeLayers);

  // 4. Render remaining layers
  for (const layer of activeLayers) {
    if (transitionedIds.has(layer.id)) continue;
    renderLayer(ctx, layer, currentTime, scale);
  }
}
