import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

/**
 * UI Store — ephemeral UI state only; never persisted.
 *
 * activeTool   : 'select' | 'trim' | 'split'
 * activePanel  : 'media' | 'text' | 'audio' | 'transitions' | 'export'
 * uploadQueue  : UploadItem[]
 * toasts       : Toast[]
 * exportHistory: ExportItem[]
 *
 * UploadItem: { id, name, progress, done, success, error }
 * Toast:      { id, message, type: 'success'|'error'|'info', createdAt }
 */
const TOAST_TTL = 4000; // ms before auto-dismiss

const useUIStore = create((set, get) => ({
  /* ── Tool / Panel ─────────────────────────────────────────────────────── */
  activeTool:  'select',
  activePanel: 'media',

  setActiveTool(tool) {
    const valid = ['select', 'trim', 'split'];
    if (!valid.includes(tool)) {
      console.warn(`[uiStore] Unknown tool: "${tool}". Expected one of: ${valid.join(', ')}`);
      return;
    }
    set({ activeTool: tool });
  },

  setActivePanel(panel) {
    const valid = ['media', 'text', 'audio', 'transitions', 'export'];
    if (!valid.includes(panel)) {
      console.warn(`[uiStore] Unknown panel: "${panel}". Expected one of: ${valid.join(', ')}`);
      return;
    }
    set({ activePanel: panel });
  },

  /* ── Export History ─────────────────────────────────────────────────────── */
  exportHistory: JSON.parse(localStorage.getItem('WebCut-export-history') || '[]'),
  addExportToHistory(record) {
    set(s => {
      const newHistory = [record, ...s.exportHistory].slice(0, 5); // Keep last 5
      localStorage.setItem('WebCut-export-history', JSON.stringify(newHistory));
      return { exportHistory: newHistory };
    });
  },

  /* ── Upload Queue ─────────────────────────────────────────────────────── */
  uploadQueue: [],

  /**
   * Register a new upload in the queue.
   * @param {string} id   — unique id for this upload (use uuid)
   * @param {string} name — display filename
   */
  addUpload(id, name) {
    set(s => ({
      uploadQueue: [
        ...s.uploadQueue,
        { id, name, progress: 0, done: false, success: false, error: null },
      ],
    }));
  },

  /**
   * Update progress (0–100) for an active upload.
   * @param {string} id
   * @param {number} progress
   */
  updateUpload(id, progress) {
    set(s => ({
      uploadQueue: s.uploadQueue.map(u =>
        u.id === id ? { ...u, progress: Math.min(100, Math.max(0, progress)) } : u
      ),
    }));
  },

  /**
   * Mark an upload as finished.
   * @param {string}  id
   * @param {boolean} success
   * @param {string=} error — error message if !success
   */
  finishUpload(id, success, error = null) {
    set(s => ({
      uploadQueue: s.uploadQueue.map(u =>
        u.id === id ? { ...u, done: true, success, error, progress: success ? 100 : u.progress } : u
      ),
    }));
    // Auto-prune completed items after 3 s
    setTimeout(() => {
      set(s => ({ uploadQueue: s.uploadQueue.filter(u => u.id !== id) }));
    }, 3000);
  },

  /* ── Toasts ───────────────────────────────────────────────────────────── */
  toasts: [],

  /**
   * Push a toast notification. Auto-dismisses after TOAST_TTL ms.
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  addToast(message, type = 'info') {
    const id = uuidv4();
    set(s => ({
      toasts: [...s.toasts, { id, message, type, createdAt: Date.now() }],
    }));
    setTimeout(() => get().removeToast(id), TOAST_TTL);
    return id;
  },

  /** Manually dismiss a toast by id. */
  removeToast(id) {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },
}));

export default useUIStore;
