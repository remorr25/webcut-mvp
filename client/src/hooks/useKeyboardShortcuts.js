import { useEffect } from 'react';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';

/**
 * useKeyboardShortcuts
 *
 * Global keyboard shortcut handler. Mount once at the App level.
 * Guards against firing inside inputs/textareas.
 */
export default function useKeyboardShortcuts() {
  const project          = useProjectStore(s => s.project);
  const isPlaying        = useProjectStore(s => s.isPlaying);
  const currentTime      = useProjectStore(s => s.currentTime);
  const selectedLayerId  = useProjectStore(s => s.selectedLayerId);
  const zoom             = useProjectStore(s => s.zoom);

  const setIsPlaying    = useProjectStore(s => s.setIsPlaying);
  const setCurrentTime  = useProjectStore(s => s.setCurrentTime);
  const removeLayer     = useProjectStore(s => s.removeLayer);
  const setZoom         = useProjectStore(s => s.setZoom);
  const undo            = useProjectStore(s => s.undo);
  const redo            = useProjectStore(s => s.redo);
  const splitLayer      = useProjectStore(s => s.splitLayer);

  const setActiveTool   = useUIStore(s => s.setActiveTool);

  useEffect(() => {
    const fps      = project?.fps ?? 30;
    const duration = project?.duration ?? 0;

    function onKeyDown(e) {
      // Don't fire in text inputs
      const tag = e.target?.tagName?.toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;

      switch (e.code) {
        /* ── Playback ── */
        case 'Space':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - 1 / fps));
          break;

        case 'ArrowRight':
          e.preventDefault();
          setCurrentTime(Math.min(duration, currentTime + 1 / fps));
          break;

        case 'Home':
          e.preventDefault();
          setCurrentTime(0);
          break;

        case 'End':
          e.preventDefault();
          setCurrentTime(duration);
          break;

        /* ── Edit ── */
        case 'KeyZ':
          if (ctrl) {
            e.preventDefault();
            if (e.shiftKey) { redo(); } else { undo(); }
          }
          break;

        case 'KeyY':
          if (ctrl) { e.preventDefault(); redo(); }
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedLayerId) {
            e.preventDefault();
            removeLayer(selectedLayerId);
          }
          break;

        /* ── Zoom ── */
        case 'Equal':     // + / =
          if (!ctrl) { e.preventDefault(); setZoom(zoom * 1.25); }
          break;
        case 'Minus':
          if (!ctrl) { e.preventDefault(); setZoom(zoom / 1.25); }
          break;

        /* ── Tools ── */
        case 'KeyV': if (!ctrl) { e.preventDefault(); setActiveTool('select'); } break;
        case 'KeyT': if (!ctrl) { e.preventDefault(); setActiveTool('trim'); }   break;
        case 'KeyS': 
          if (!ctrl) { 
            e.preventDefault(); 
            setActiveTool('split');
            if (selectedLayerId) {
              splitLayer(selectedLayerId, currentTime);
            }
          }  
          break;

        default: break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    project, isPlaying, currentTime, selectedLayerId, zoom,
    setIsPlaying, setCurrentTime, removeLayer, setZoom, undo, redo, splitLayer, setActiveTool,
  ]);
}
