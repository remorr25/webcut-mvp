import { useMemo, useEffect, useState } from 'react';
import { audioEngine } from '../renderer/audioEngine';

export default function AudioWaveform({ layer, width }) {
  const [buffer, setBuffer] = useState(() => audioEngine.getBuffer(layer.id));
  
  useEffect(() => {
    // If not loaded, we might need to wait or it loads naturally later.
    // We can poll or just rely on preloadAll. For now, check once after a short delay.
    if (!buffer) {
      const timer = setTimeout(() => {
        setBuffer(audioEngine.getBuffer(layer.id));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [buffer, layer.id]);

  const pathData = useMemo(() => {
    if (!buffer || width <= 0) return '';
    
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = 14; // pixels (half of row height ~ 18px)
    
    let path = `M 0,${amp}`;
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      path += ` L ${i},${amp + (min * amp)} L ${i},${amp + (max * amp)}`;
    }
    
    return path;
  }, [buffer, width]);

  if (!buffer) return null;

  return (
    <svg 
      width="100%" 
      height="100%" 
      preserveAspectRatio="none" 
      style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }}
    >
      <path d={pathData} stroke="#ffffff" strokeWidth="1" fill="none" />
    </svg>
  );
}
