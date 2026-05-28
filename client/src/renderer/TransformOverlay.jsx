import { useEffect, useRef } from 'react';
import useProjectStore from '../store/projectStore';
import { applyAnimations } from '../animations/animationEngine';
import { PROJECT_WIDTH, PROJECT_HEIGHT } from './canvasRenderer';

/**
 * Calculates local bounding box (width, height) for a layer in project space (unscaled).
 */
function getLayerDimensions(layer) {
  if (layer.type === 'text' || layer.type === 'subtitle') {
    const cfg = layer.text;
    if (!cfg) return { w: 100, h: 50 };
    // Create a temporary canvas context just to measure text if needed
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${cfg.fontWeight ?? 700} ${cfg.fontSize ?? 48}px ${cfg.fontFamily ?? 'Inter'}, sans-serif`;
    const metrics = ctx.measureText(cfg.content || '');
    return { w: metrics.width, h: (cfg.fontSize ?? 48) * 1.2 };
  }
  if (layer.type === 'image' || layer.type === 'sticker') {
    // We would need the loaded image dimensions here. For now, approximate or read from meta if available.
    // If not stored in meta, we default to 400x400
    return { w: layer.meta?.width ?? 400, h: layer.meta?.height ?? 400 };
  }
  if (layer.type === 'video') {
    return { w: layer.meta?.width ?? 1080, h: layer.meta?.height ?? 1920 };
  }
  return { w: 100, h: 100 };
}

export default function TransformOverlay({ containerRef }) {
  const overlayRef = useRef(null);
  
  const project = useProjectStore(s => s.project);
  const currentTime = useProjectStore(s => s.currentTime);
  const selectedLayerId = useProjectStore(s => s.selectedLayerId);
  const updateLayer = useProjectStore(s => s.updateLayer);

  // Drag state
  const dragState = useRef({
    active: false,
    mode: null, // 'translate', 'scale', 'rotate'
    startX: 0,
    startY: 0,
    initialTransform: null
  });

  // Find layer
  let layer = null;
  if (project?.tracks) {
    for (const track of project.tracks) {
      const found = track.layers.find(l => l.id === selectedLayerId);
      if (found) { layer = found; break; }
    }
  }

  // Is layer active?
  const isActive = layer && (currentTime >= (layer.startTime || 0) && currentTime < (layer.startTime || 0) + (layer.duration || 1));

  useEffect(() => {
    const canvas = overlayRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let rafId;

    function renderLoop() {
      // Match dimensions
      const { clientWidth, clientHeight } = container;
      if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isActive && layer) {
        const scale = canvas.width / PROJECT_WIDTH;
        const cx = (PROJECT_WIDTH / 2) * scale;
        const cy = (PROJECT_HEIGHT / 2) * scale;
        
        const { transform } = applyAnimations(layer, currentTime);
        const { w, h } = getLayerDimensions(layer);

        // Draw bounding box
        ctx.save();
        ctx.translate(cx, cy);
        
        const tx = (transform.x ?? 0) * scale;
        const ty = (transform.y ?? 0) * scale;
        const sX = transform.scaleX ?? 1;
        const sY = transform.scaleY ?? 1;
        const rot = ((transform.rotation ?? 0) * Math.PI) / 180;

        ctx.translate(tx, ty);
        ctx.rotate(rot);
        ctx.scale(sX, sY);

        const scaledW = w * scale;
        const scaledH = h * scale;

        // Bounding box outline
        ctx.strokeStyle = '#6c63ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-scaledW / 2, -scaledH / 2, scaledW, scaledH);

        // Corner handles
        ctx.fillStyle = '#fff';
        const hs = 6; // handle size
        ctx.fillRect(-scaledW / 2 - hs/2, -scaledH / 2 - hs/2, hs, hs); // TL
        ctx.fillRect(scaledW / 2 - hs/2, -scaledH / 2 - hs/2, hs, hs);  // TR
        ctx.fillRect(-scaledW / 2 - hs/2, scaledH / 2 - hs/2, hs, hs);  // BL
        ctx.fillRect(scaledW / 2 - hs/2, scaledH / 2 - hs/2, hs, hs);   // BR

        // Rotation handle
        ctx.beginPath();
        ctx.moveTo(0, -scaledH / 2);
        ctx.lineTo(0, -scaledH / 2 - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -scaledH / 2 - 20, hs/2 + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      rafId = requestAnimationFrame(renderLoop);
    }

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [layer, currentTime, isActive, containerRef]);

  // Event handlers
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    function onMouseDown(e) {
      if (!isActive || !layer) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Simplistic hit test for MVP: Just drag anywhere if clicked
      // In a full engine, we inverse transform mouse into local rect coordinates.
      // We will assume "translate" mode for now unless they click very high above center for rotate.

      const scale = canvas.width / PROJECT_WIDTH;
      const cx = (PROJECT_WIDTH / 2) * scale;
      const cy = (PROJECT_HEIGHT / 2) * scale;
      const tx = cx + ((layer.transform?.x ?? 0) * scale);
      const ty = cy + ((layer.transform?.y ?? 0) * scale);
      
      const distToCenter = Math.sqrt((mouseX - tx)**2 + (mouseY - ty)**2);
      
      // If clicked somewhat near it
      if (distToCenter < 150) {
        dragState.current = {
          active: true,
          mode: 'translate',
          startX: mouseX,
          startY: mouseY,
          initialTransform: { ...(layer.transform || {}) }
        };
      }
    }

    function onMouseMove(e) {
      const state = dragState.current;
      if (!state.active) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scale = canvas.width / PROJECT_WIDTH;

      if (state.mode === 'translate') {
        const dx = (mouseX - state.startX) / scale;
        const dy = (mouseY - state.startY) / scale;
        
        updateLayer(layer.id, {
          transform: {
            ...state.initialTransform,
            x: (state.initialTransform.x || 0) + dx,
            y: (state.initialTransform.y || 0) + dy
          }
        });
      }
    }

    function onMouseUp() {
      dragState.current.active = false;
    }

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isActive, layer, updateLayer]);

  return (
    <canvas
      ref={overlayRef}
      id="transform-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: 50,
      }}
    />
  );
}
