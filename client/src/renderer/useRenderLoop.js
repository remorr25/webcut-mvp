import { useEffect, useRef, useCallback } from 'react';
import useProjectStore from '../store/projectStore';
import { renderFrame, PROJECT_WIDTH } from './canvasRenderer';

/**
 * useRenderLoop
 *
 * Drives the canvas render loop via requestAnimationFrame.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef
 * @returns {{ startLoop, stopLoop, renderOnce }}
 */
export default function useRenderLoop(canvasRef) {
  const rafRef      = useRef(null);
  const lastTimeRef = useRef(null); // DOMHighResTimeStamp of last rAF

  // Read store values imperatively inside rAF to avoid stale closure issues
  const getProject     = () => useProjectStore.getState().project;
  const getCurrentTime = () => useProjectStore.getState().currentTime;
  const getIsPlaying   = () => useProjectStore.getState().isPlaying;
  const setCurrentTime = (t) => useProjectStore.getState().setCurrentTime(t);
  const setIsPlaying   = (b) => useProjectStore.getState().setIsPlaying(b);

  /* ── Compute scale from current canvas size ────────────────────────────── */
  function getScale() {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    return canvas.width / PROJECT_WIDTH;
  }

  /* ── Single frame render (used for scrub preview too) ──────────────────── */
  const renderOnce = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const proj = getProject();
    renderFrame(ctx, proj, getCurrentTime(), getScale());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]);

  /* ── rAF loop stored in a ref to avoid stale-closure self-reference ────── */
  const loopRef = useRef(null);
  // eslint-disable-next-line react-hooks/refs
  loopRef.current = (timestamp) => {
    const isPlaying   = getIsPlaying();
    const project     = getProject();
    const duration    = project?.duration ?? 0;
    let   currentTime = getCurrentTime();

    if (!isPlaying) {
      lastTimeRef.current = null;
      return; // stop loop
    }

    // Compute deltaTime (seconds) from rAF timestamps
    if (lastTimeRef.current !== null) {
      const delta = (timestamp - lastTimeRef.current) / 1000; // ms → s
      currentTime = currentTime + delta;

      if (currentTime >= duration && duration > 0) {
        // Reached end — stop playback
        setCurrentTime(duration);
        setIsPlaying(false);
        renderOnce();
        lastTimeRef.current = null;
        return;
      }

      setCurrentTime(currentTime);
    }
    lastTimeRef.current = timestamp;

    // Render this frame
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      renderFrame(ctx, project, currentTime, getScale());
    }

    rafRef.current = requestAnimationFrame((ts) => loopRef.current(ts));
  };

  /* ── Public controls ────────────────────────────────────────────────────── */
  const startLoop = useCallback(() => {
    if (rafRef.current) return; // already running
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame((ts) => loopRef.current(ts));
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  /* ── React to isPlaying changes ──────────────────────────────────────── */
  useEffect(() => {
    return useProjectStore.subscribe((state, prevState) => {
      if (state.isPlaying !== prevState.isPlaying) {
        if (state.isPlaying) {
          startLoop();
        } else {
          stopLoop();
          renderOnce(); // scrub to current frame when paused
        }
      }
    });
  }, [startLoop, stopLoop, renderOnce]);

  /* ── React to currentTime changes when paused (scrub) ────────────────── */
  useEffect(() => {
    return useProjectStore.subscribe((state, prevState) => {
      if (state.currentTime !== prevState.currentTime) {
        if (!getIsPlaying()) renderOnce();
      }
    });
  }, [renderOnce]);

  /* ── React to project changes when paused (e.g. style editing) ───────── */
  useEffect(() => {
    return useProjectStore.subscribe((state, prevState) => {
      if (state.project !== prevState.project) {
        if (!getIsPlaying()) renderOnce();
      }
    });
  }, [renderOnce]);

  /* ── Cleanup on unmount ──────────────────────────────────────────────── */
  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  return { startLoop, stopLoop, renderOnce };
}
