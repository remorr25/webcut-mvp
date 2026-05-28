import useProjectStore from '../store/projectStore';
import { audioEngine } from './audioEngine';

let rafId = null;
let lastTime = 0;

export function startPlaybackClock() {
  if (rafId) return;
  lastTime = performance.now();
  
  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    
    const store = useProjectStore.getState();
    if (store.isPlaying) {
      let nextTime = store.currentTime + dt;
      if (nextTime >= (store.project?.duration || 30)) {
        nextTime = 0;
        store.setIsPlaying(false);
        audioEngine.stop();
      } else {
        rafId = requestAnimationFrame(loop);
      }
      store.setCurrentTime(nextTime);
    } else {
      audioEngine.stop();
      rafId = null;
    }
  }
  
  const store = useProjectStore.getState();
  const activeLayers = [];
  if (store.project?.tracks) {
    for (const track of store.project.tracks) {
      for (const layer of track.layers) {
        if (store.currentTime >= (layer.startTime || 0) && store.currentTime < (layer.startTime || 0) + (layer.duration || 0)) {
          activeLayers.push({ ...layer, _muted: track.muted });
        }
      }
    }
  }
  audioEngine.play(store.currentTime, activeLayers);
  
  rafId = requestAnimationFrame(loop);
}

export function stopPlaybackClock() {
  audioEngine.stop();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
