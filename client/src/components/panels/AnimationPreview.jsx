import { useEffect, useRef } from 'react';
import { renderFrame, PROJECT_WIDTH, PROJECT_HEIGHT } from '../../renderer/canvasRenderer';

export default function AnimationPreview({ layer }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const DURATION = 2.0; // 2 seconds loop
    let startTime = performance.now();
    let rafId;

    const renderScale = 200 / PROJECT_WIDTH; 
    canvas.width = 200;
    canvas.height = Math.round(PROJECT_HEIGHT * renderScale); 

    function render() {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      let t = elapsed % DURATION;
      
      // Force position to center for preview
      const mockLayer = {
        ...layer,
        startTime: 0,
        duration: DURATION,
        transform: {
          ...layer.transform,
          x: 0, 
          y: 0,
          scaleX: 1,
          scaleY: 1,
        }
      };

      const mockProject = {
        tracks: [{ layers: [mockLayer] }]
      };
      
      // Custom clear
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render
      renderFrame(ctx, mockProject, t, renderScale);
      
      rafId = requestAnimationFrame(render);
    }
    
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [layer]);

  return (
    <div style={{
      width: '100%',
      height: '160px',
      background: '#0a0a0a',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '6px',
      border: '1px solid #2a2a2a',
      marginBottom: '12px',
      overflow: 'hidden'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ height: '100%', aspectRatio: `${PROJECT_WIDTH}/${PROJECT_HEIGHT}`, background: '#111' }} 
      />
    </div>
  );
}
