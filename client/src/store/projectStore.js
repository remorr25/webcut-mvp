import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { audioEngine } from '../renderer/audioEngine';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const STORAGE_KEY  = 'capcut-mvp-project';
const MAX_UNDO     = 30;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function recomputeDuration(tracks) {
  let max = 0;
  for (const track of tracks) {
    for (const layer of track.layers) {
      const end = (layer.startTime ?? 0) + (layer.duration ?? 0);
      if (end > max) max = end;
    }
  }
  return max;
}

/* ─── Store ──────────────────────────────────────────────────────────────── */
const useProjectStore = create((set, get) => ({
  /* ── State ─────────────────────────────────────────────────────────────── */
  project:         null,
  mediaLibrary:    [],
  isMediaLoading:  false,
  selectedLayerId: null,
  currentTime:     0,
  isPlaying:       false,
  zoom:            1,
  exportProgress:  0,
  masterVolume:    1,

  /* Undo / Redo */
  undoStack: [],   // array of project snapshots (JSON strings for deep copy)
  redoStack: [],

  /* ── Undo helpers ───────────────────────────────────────────────────────── */

  /** Push current project onto the undo stack before a mutation. */
  _pushUndo() {
    const { project, undoStack } = get();
    if (!project) return;
    const snapshot = JSON.stringify(project);
    const next = [...undoStack, snapshot];
    if (next.length > MAX_UNDO) next.shift();
    set({ undoStack: next, redoStack: [] });
  },

  undo() {
    const { undoStack, redoStack, project } = get();
    if (undoStack.length === 0) return;
    const prev = JSON.parse(undoStack[undoStack.length - 1]);
    set({
      project:   prev,
      undoStack: undoStack.slice(0, -1),
      redoStack: project ? [...redoStack, JSON.stringify(project)] : redoStack,
      selectedLayerId: null,
    });
  },

  redo() {
    const { redoStack, undoStack, project } = get();
    if (redoStack.length === 0) return;
    const next = JSON.parse(redoStack[redoStack.length - 1]);
    set({
      project:   next,
      redoStack: redoStack.slice(0, -1),
      undoStack: project ? [...undoStack, JSON.stringify(project)] : undoStack,
      selectedLayerId: null,
    });
  },

  /* ── Project lifecycle ──────────────────────────────────────────────────── */

  initProject() {
    const project = {
      id: 'My New Project',
      duration: 30, // seconds
      tracks: [
        { id: 'track-v1', type: 'video', layers: [] },
        { id: 'track-a1', type: 'audio', layers: [] }
      ],
      transitions: []
    };
    audioEngine.cleanup();
    set({
      project,
      selectedLayerId: null,
      currentTime: 0,
      isPlaying: false,
      undoStack: [],
      redoStack: []
    });
    audioEngine.preloadAll(project);
  },

  loadProject: (json) => {
    // Ensure transitions array exists on load
    const project = { ...json, transitions: json.transitions || [] };
    audioEngine.cleanup();
    set({ project, selectedLayerId: null, currentTime: 0, isPlaying: false, undoStack: [], redoStack: [] });
    audioEngine.preloadAll(project);
  },

  updateProjectName(name) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      return { project: { ...state.project, name: String(name), updatedAt: Date.now() } };
    });
    get().saveProject();
  },

  saveProject() {
    const { project } = get();
    if (!project) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, updatedAt: Date.now() }));
    } catch (e) {
      console.warn('[projectStore] saveProject failed:', e.message);
    }
  },

  exportProjectFile() {
    const { project } = get();
    if (!project) return;
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'Untitled'}.WebCut.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importProjectFile(file) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.id || !json.tracks || !json.fps || !json.resolution) {
        throw new Error('Invalid project file structure');
      }

      // Validate assets via backend
      const res = await fetch('/api/project/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
      if (res.ok) {
        const { valid, missingFiles } = await res.json();
        if (!valid) {
          alert(`Warning: The following media files are missing on the server and won't load:\n\n${missingFiles.join('\n')}`);
        }
      }

      get().loadProject(json);
      get().saveProject();
    } catch (e) {
      console.error('[projectStore] importProjectFile failed:', e);
      alert('Failed to import project: ' + e.message);
    }
  },

  /* ── Playback & view ────────────────────────────────────────────────────── */

  setCurrentTime(t)     { set({ currentTime: Math.max(0, t) }); },
  setIsPlaying(b)       { set({ isPlaying: Boolean(b) }); },
  setZoom(n)            { set({ zoom: Math.max(0.5, Math.min(n, 5)) }); },
  setExportProgress(n)  { set({ exportProgress: Math.max(0, Math.min(n, 100)) }); },
  setMasterVolume(n)    { set({ masterVolume: Math.max(0, Math.min(n, 1)) }); },
  selectLayer(id)       { set({ selectedLayerId: id ?? null }); },

  /* ── Timeline mutations (all push undo) ─────────────────────────────────── */

  addTrack(type = 'video') {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const count    = state.project.tracks.filter(t => t.type === type).length + 1;
      const newTrack = {
        id: uuidv4(), type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`,
        muted: false, locked: false, layers: [],
      };
      return {
        project: { ...state.project, tracks: [...state.project.tracks, newTrack], updatedAt: Date.now() },
      };
    });
  },

  addLayer(trackId, layer) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = state.project.tracks.map(track => {
        if (track.id !== trackId) return track;
        return { ...track, layers: [...track.layers, { id: uuidv4(), ...layer }] };
      });
      return { project: { ...state.project, tracks, duration: recomputeDuration(tracks), updatedAt: Date.now() } };
    });
    audioEngine.preloadAll(get().project);
  },

  updateLayer(layerId, patch) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = state.project.tracks.map(track => ({
        ...track,
        layers: track.layers.map(l => l.id === layerId ? { ...l, ...patch } : l),
      }));
      return { project: { ...state.project, tracks, duration: recomputeDuration(tracks), updatedAt: Date.now() } };
    });
  },

  removeLayer(layerId) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = state.project.tracks.map(track => ({
        ...track,
        layers: track.layers.filter(l => l.id !== layerId),
      }));
      return {
        project: { ...state.project, tracks, duration: recomputeDuration(tracks), updatedAt: Date.now() },
        selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
      };
    });
  },

  /* ── Advanced Timeline Operations ──────────────────────────────────────── */

  splitLayer(layerId, splitTime) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      let newTracks = [...state.project.tracks];
      let splitHappened = false;

      newTracks = newTracks.map(track => {
        if (track.locked) return track; // cannot split in locked track
        const layerIdx = track.layers.findIndex(l => l.id === layerId);
        if (layerIdx === -1) return track;

        const layer = track.layers[layerIdx];
        const start = layer.startTime ?? 0;
        const dur = layer.duration ?? 5;
        const end = start + dur;

        // Check if splitTime intersects
        if (splitTime > start && splitTime < end) {
          splitHappened = true;
          const leftDur = splitTime - start;
          const rightDur = end - splitTime;

          const layer1 = { ...layer, id: uuidv4(), duration: leftDur };
          const layer2 = { ...layer, id: uuidv4(), startTime: splitTime, duration: rightDur };

          // Handle source start adjustments for video/audio
          if (layer.type === 'video' || layer.type === 'audio') {
             const srcStart = layer.sourceStart || 0;
             const speed = layer.speed || 1;
             layer2.sourceStart = srcStart + (leftDur * speed);
          }

          const newLayers = [...track.layers];
          newLayers.splice(layerIdx, 1, layer1, layer2); // replace original with both
          return { ...track, layers: newLayers };
        }
        return track;
      });

      if (!splitHappened) return state; // Undo stack will be slightly dirty, but acceptable
      return { project: { ...state.project, tracks: newTracks, duration: recomputeDuration(newTracks), updatedAt: Date.now() } };
    });
  },

  toggleTrackLock(trackId) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = state.project.tracks.map(t => t.id === trackId ? { ...t, locked: !t.locked } : t);
      return { project: { ...state.project, tracks, updatedAt: Date.now() } };
    });
  },

  toggleTrackMute(trackId) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = state.project.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t);
      return { project: { ...state.project, tracks, updatedAt: Date.now() } };
    });
  },

  reorderTrack(fromIndex, toIndex) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = [...state.project.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);
      return { project: { ...state.project, tracks, updatedAt: Date.now() } };
    });
  },

  moveLayerToTrack(layerId, targetTrackId, newStart) {
    get()._pushUndo();
    set(state => {
      if (!state.project) return state;
      const tracks = [...state.project.tracks];
      
      let layerToMove = null;
      let fromTrackIdx = -1;

      // Find and remove layer
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].locked) continue;
        const lIdx = tracks[i].layers.findIndex(l => l.id === layerId);
        if (lIdx !== -1) {
          layerToMove = tracks[i].layers[lIdx];
          fromTrackIdx = i;
          tracks[i] = { ...tracks[i], layers: tracks[i].layers.filter(l => l.id !== layerId) };
          break;
        }
      }

      if (!layerToMove) return state; // Error or locked track

      // Add to target track
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].id === targetTrackId) {
          if (tracks[i].locked) {
             // If target is locked, revert
             tracks[fromTrackIdx].layers.push(layerToMove);
             return state;
          }
          // Validate compatibility
          const tType = tracks[i].type;
          const lType = layerToMove.type;
          const isVisualTrack = tType === 'video';
          const isAudioTrack = tType === 'audio';
          
          if ((isAudioTrack && lType !== 'audio') || (isVisualTrack && lType === 'audio')) {
            // Revert on incompatibility
            tracks[fromTrackIdx].layers.push(layerToMove);
            return state;
          }

          layerToMove.startTime = newStart ?? layerToMove.startTime;
          tracks[i] = { ...tracks[i], layers: [...tracks[i].layers, layerToMove] };
          break;
        }
      }

      return { project: { ...state.project, tracks, duration: recomputeDuration(tracks), updatedAt: Date.now() } };
    });
  },

  /* ── Transitions ───────────────────────────────────────────────────────── */
  addTransition: (transition) => {
    get()._pushUndo();
    set(state => ({
      project: {
        ...state.project,
        transitions: [...(state.project.transitions || []), transition],
        updatedAt: Date.now()
      }
    }));
  },
  
  updateTransition: (id, patch) => {
    get()._pushUndo();
    set(state => ({
      project: {
        ...state.project,
        transitions: (state.project.transitions || []).map(t => t.id === id ? { ...t, ...patch } : t),
        updatedAt: Date.now()
      }
    }));
  },

  removeTransition: (id) => {
    get()._pushUndo();
    set(state => ({
      project: {
        ...state.project,
        transitions: (state.project.transitions || []).filter(t => t.id !== id),
        updatedAt: Date.now()
      }
    }));
  },

  /* ── Media Library ──────────────────────────────────────────────────────── */

  async fetchMedia() {
    set({ isMediaLoading: true });
    try {
      const res  = await fetch('/api/media');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ mediaLibrary: Array.isArray(data) ? data : [], isMediaLoading: false });
    } catch (e) {
      console.error('[projectStore] fetchMedia failed:', e.message);
      set({ isMediaLoading: false });
    }
  },

  addMediaItem(item) {
    set(s => ({ mediaLibrary: [item, ...s.mediaLibrary] }));
  },

  async removeMediaItem(id) {
    set(s => ({ mediaLibrary: s.mediaLibrary.filter(m => m.id !== id) }));
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('[projectStore] removeMediaItem failed:', e.message);
      get().fetchMedia();
    }
  },
}));

/* ─── Boot ───────────────────────────────────────────────────────────────── */
(function boot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      useProjectStore.getState().loadProject(parsed);
      return;
    }
  } catch {
    console.warn('[projectStore] localStorage parse failed, starting fresh.');
  }
  useProjectStore.getState().initProject();
})();

export default useProjectStore;
