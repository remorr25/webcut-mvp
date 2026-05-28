import { useEffect, useCallback } from 'react';
import useProjectStore from '../store/projectStore';
import { formatTime } from '../utils/timeUtils';
import { audioEngine } from '../renderer/audioEngine';

/* ─── Icon SVGs ──────────────────────────────────────────────────────────── */
function SkipStartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
    </svg>
  );
}
function SkipEndIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6zm8.5 0h2V6h-2z"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
    </svg>
  );
}
function VolumeIcon({ muted }) {
  return muted ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
    </svg>
  );
}

/* ─── Control button ─────────────────────────────────────────────────────── */
function CtrlBtn({ onClick, title, active = false, large = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'rgba(108,99,255,0.2)' : 'none',
        border: 'none',
        borderRadius: large ? '50%' : '6px',
        color: active ? '#6c63ff' : '#c0c0c0',
        width:  large ? '38px' : '28px',
        height: large ? '38px' : '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = large ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? 'rgba(108,99,255,0.2)' : 'none';
        e.currentTarget.style.color = active ? '#6c63ff' : '#c0c0c0';
      }}
    >
      {children}
    </button>
  );
}

/* ─── PlaybackControls ───────────────────────────────────────────────────── */
export default function PlaybackControls() {
  const isPlaying    = useProjectStore(s => s.isPlaying);
  const currentTime  = useProjectStore(s => s.currentTime);
  const project      = useProjectStore(s => s.project);
  const masterVolume = useProjectStore(s => s.masterVolume);
  const setIsPlaying    = useProjectStore(s => s.setIsPlaying);
  const setCurrentTime  = useProjectStore(s => s.setCurrentTime);
  const setMasterVolume = useProjectStore(s => s.setMasterVolume);

  const duration  = project?.duration ?? 0;
  const fps       = project?.fps      ?? 30;

  /* ── Spacebar shortcut ── */
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      setIsPlaying(!isPlaying);
    }
    if (e.code === 'Home') { e.preventDefault(); setCurrentTime(0); }
    if (e.code === 'End')  { e.preventDefault(); setCurrentTime(duration); }
  }, [isPlaying, duration, setIsPlaying, setCurrentTime]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const playPause  = () => setIsPlaying(!isPlaying);
  const skipStart  = () => { setIsPlaying(false); setCurrentTime(0); };
  const skipEnd    = () => { setIsPlaying(false); setCurrentTime(duration); };

  const handleVolumeChange = (val) => {
    setMasterVolume(val);
    audioEngine.setMasterVolume(val);
  };

  const toggleMute = () => {
    const newVal = masterVolume > 0 ? 0 : 1;
    handleVolumeChange(newVal);
  };

  const currentLabel = formatTime(currentTime, fps);
  const durationLabel = formatTime(duration, fps);
  const volumePct = Math.round((masterVolume ?? 1) * 100);

  return (
    <div
      id="playback-controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(20,20,20,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #2a2a2a',
        borderRadius: '30px',
        padding: '6px 16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        userSelect: 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Skip to start */}
      <CtrlBtn onClick={skipStart} title="Skip to start (Home)">
        <SkipStartIcon />
      </CtrlBtn>

      {/* Play / Pause */}
      <CtrlBtn onClick={playPause} title={isPlaying ? 'Pause (Space)' : 'Play (Space)'} large active={isPlaying}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </CtrlBtn>

      {/* Skip to end */}
      <CtrlBtn onClick={skipEnd} title="Skip to end (End)">
        <SkipEndIcon />
      </CtrlBtn>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: '#2a2a2a', margin: '0 4px' }} />

      {/* Time display */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', minWidth: '130px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8e8e8', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
          {currentLabel}
        </span>
        <span style={{ fontSize: '10px', color: '#555' }}>/</span>
        <span style={{ fontSize: '11px', color: '#666', fontVariantNumeric: 'tabular-nums' }}>
          {durationLabel}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: '#2a2a2a', margin: '0 4px' }} />

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={toggleMute}
          title={masterVolume === 0 ? 'Unmute' : 'Mute'}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
        >
          <VolumeIcon muted={masterVolume === 0} />
        </button>
        <input
          id="master-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume ?? 1}
          onChange={e => handleVolumeChange(parseFloat(e.target.value))}
          title={`Volume: ${volumePct}%`}
          style={{
            width: '72px',
            accentColor: '#6c63ff',
            cursor: 'pointer',
            height: '3px',
          }}
        />
        <span style={{ fontSize: '10px', color: '#555', minWidth: '26px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {volumePct}%
        </span>
      </div>
    </div>
  );
}
