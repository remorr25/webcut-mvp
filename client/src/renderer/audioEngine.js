class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    
    this.buffers = new Map();      // layerId -> AudioBuffer
    this.sourceNodes = new Map();  // layerId -> AudioBufferSourceNode
    this.gainNodes = new Map();    // layerId -> GainNode

    // Auto-resume AudioContext on first user interaction (browser policy)
    const resumeContext = () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      document.removeEventListener('click', resumeContext);
      document.removeEventListener('keydown', resumeContext);
    };
    document.addEventListener('click', resumeContext, { once: true });
    document.addEventListener('keydown', resumeContext, { once: true });
  }

  setMasterVolume(value) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  async loadTrack(layer) {
    if (!layer.src) return;
    if (this.buffers.has(layer.id)) return; // Already loaded

    try {
      const response = await fetch(layer.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(layer.id, audioBuffer);
    } catch (err) {
      // Ignore EncodingError for silent videos / images placed in video tracks
      if (!err.message?.includes('decode audio data')) {
        console.error(`Failed to load audio for layer ${layer.id}:`, err);
      }
    }
  }

  async preloadAll(project) {
    if (!project?.tracks) return;
    const promises = [];
    for (const track of project.tracks) {
      if (track.type === 'audio' || track.type === 'video') {
        for (const layer of track.layers) {
          if (layer.src && (layer.type === 'audio' || layer.type === 'video')) {
            promises.push(this.loadTrack(layer));
          }
        }
      }
    }
    await Promise.all(promises);
  }

  play(currentTime, activeLayers) {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.stop(); // Stop any currently playing nodes first

    for (const layer of activeLayers) {
      if (layer.type !== 'audio' && layer.type !== 'video') continue;
      if (layer._muted) continue;
      
      const buffer = this.buffers.get(layer.id);
      if (!buffer) continue; // Not loaded yet
      
      // Calculate where we are relative to this clip's start
      const layerLocalTime = currentTime - layer.startTime;
      if (layerLocalTime < 0 || layerLocalTime >= layer.duration) continue;
      
      // Where to start reading from the buffer (trimIn + local time)
      const offset = (layer.trimIn || 0) + layerLocalTime;
      
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      
      const gain = this.audioContext.createGain();
      gain.gain.value = layer.volume ?? 1;
      
      source.connect(gain);
      gain.connect(this.masterGain);
      
      source.start(0, offset); // Start immediately, at the calculated offset
      
      this.sourceNodes.set(layer.id, source);
      this.gainNodes.set(layer.id, gain);
    }
  }

  stop() {
    for (const [, source] of this.sourceNodes.entries()) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // ignore if already stopped
      }
    }
    this.sourceNodes.clear();
    
    for (const [, gain] of this.gainNodes.entries()) {
      gain.disconnect();
    }
    this.gainNodes.clear();
  }

  setVolume(layerId, volume) {
    const gainNode = this.gainNodes.get(layerId);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getBuffer(layerId) {
    return this.buffers.get(layerId);
  }

  cleanup() {
    this.stop();
    this.buffers.clear();
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();
