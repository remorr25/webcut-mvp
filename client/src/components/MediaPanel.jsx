import { useEffect, useRef, useState } from 'react';
import useProjectStore from '../store/projectStore';
import { buildSlideshowFromImages } from '../utils/slideshowUtils';
import useUpload from '../hooks/useUpload';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ACCEPTED = 'video/mp4,video/webm,image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/ogg';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function mimeCategory(mime = '') {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  return 'unknown';
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/* ─── Video thumbnail via canvas ─────────────────────────────────────────── */
function VideoThumb({ src, alt }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    const onMeta  = () => { video.currentTime = 0.1; };
    const onSeeked = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = video.videoWidth  || 160;
      canvas.height = video.videoHeight || 90;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      setReady(true);
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('seeked', onSeeked);
    video.load();
    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', onSeeked);
      video.src = '';
    };
  }, [src]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#111' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: ready ? 'block' : 'none' }} aria-label={alt} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '18px' }}>▶</div>
      )}
    </div>
  );
}

/* ─── Audio waveform placeholder ─────────────────────────────────────────── */
function AudioThumb() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '28px' }}>
        {[4,8,14,10,18,12,7,16,9,13,5,11,15,8,4].map((h, i) => (
          <div key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', background: '#6c63ff', opacity: 0.7 }} />
        ))}
      </div>
      <span style={{ fontSize: '9px', color: '#6c63ff', letterSpacing: '0.05em', fontFamily: 'Inter,sans-serif' }}>AUDIO</span>
    </div>
  );
}

/* ─── Single media card ──────────────────────────────────────────────────── */
function MediaCard({ item, selected, onToggle, removeMediaItem }) {
  const [hovered, setHovered] = useState(false);
  const cat = mimeCategory(item.mimetype);

  /* ── Drag to timeline: full metadata ── */
  function handleDragStart(e) {
    const layerData = {
      type:     cat === 'unknown' ? 'video' : cat,
      name:     item.filename,
      src:      item.url,
      duration: cat === 'image' ? 5 : 10,
      meta: {
        uploadId:     item.id,
        originalName: item.filename,
        mimetype:     item.mimetype,
        size:         item.size,
        url:          item.url,
      },
    };
    e.dataTransfer.setData('application/layer-json', JSON.stringify(layerData));
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div
      draggable
      onClick={() => cat === 'image' && onToggle(item.id)}
      onDragStart={handleDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${item.filename}\n${formatBytes(item.size)}`}
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: selected ? '2px solid #6c63ff' : hovered ? '1px solid #6c63ff' : '1px solid #2a2a2a',
        transition: 'border-color 0.15s',
        background: '#111',
        flexShrink: 0,
      }}
    >
      {/* Thumbnail */}
      {cat === 'image'  && <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />}
      {cat === 'video'  && <VideoThumb src={item.url} alt={item.filename} />}
      {(cat === 'audio' || cat === 'unknown') && <AudioThumb />}

      {/* Type badge */}
      <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(0,0,0,0.65)', borderRadius: '3px', padding: '1px 5px', fontSize: '8px', fontWeight: 700, fontFamily: 'Inter,sans-serif', color: cat === 'video' ? '#6c63ff' : cat === 'audio' ? '#63d4ff' : '#63ff9a', letterSpacing: '0.06em', textTransform: 'uppercase', pointerEvents: 'none' }}>
        {cat}
      </div>
      
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeMediaItem(item.id); }}
        style={{
          position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)',
          border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '10px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
        }}
      >×</button>
      
      {/* Checkmark */}
      {selected && (
        <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#6c63ff', color: '#fff', width: '16px', height: '16px', borderRadius: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
      )}
    </div>
  );
}

/* ─── Skeleton Card ────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      aspectRatio: '16 / 9',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      flexShrink: 0,
    }} className="skeleton-shimmer" />
  );
}

/* ─── MediaPanel ──────────────────────────────────────────────────────────── */
export default function MediaPanel() {
  const mediaLibrary = useProjectStore(s => s.mediaLibrary);
  const isMediaLoading = useProjectStore(s => s.isMediaLoading);
  const fetchMedia   = useProjectStore(s => s.fetchMedia);
  const removeMediaItem = useProjectStore(s => s.removeMediaItem);
  const project      = useProjectStore(s => s.project);
  const loadProject  = useProjectStore(s => s.loadProject);
  
  const [dragOver, setDragOver] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const fileInputRef = useRef(null);
  const { uploadMany } = useUpload();

  /* ── Fetch on mount ── */
  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  /* ── Selection logic ── */
  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const createSlideshow = () => {
    const selectedItems = mediaLibrary.filter(m => selectedIds.has(m.id));
    const { track, transitions, projectDuration } = buildSlideshowFromImages(selectedItems);
    
    loadProject({
      ...project,
      duration: Math.max(project?.duration || 0, projectDuration),
      tracks: [...(project?.tracks || []), track],
      transitions: [...(project?.transitions || []), ...transitions]
    });
    
    setSelectedIds(new Set());
  };

  /* ── Process files (drop or input) ── */
  async function processFiles(files) {
    await uploadMany(files);
    // mediaLibrary is already updated optimistically via addMediaItem in useUpload
  }

  /* ── Drag handlers ── */
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }
  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  return (
    <aside
      id="left-panel"
      style={{
        width: '280px',
        flexShrink: 0,
        background: '#1a1a1a',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif' }}>
          Media Library
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            id="media-refresh-btn"
            onClick={fetchMedia}
            title="Refresh media library"
            style={{ background: 'none', border: '1px solid #333', borderRadius: '5px', color: '#666', fontSize: '12px', padding: '3px 7px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#666'; }}
          >
            ↻
          </button>
          <button
            id="media-import-btn"
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#6c63ff', border: 'none', borderRadius: '5px', color: '#fff', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter,sans-serif', padding: '4px 10px', cursor: 'pointer' }}
          >
            + Import
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {/* ── Slideshow Controls ── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a2a', background: '#111', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', fontFamily: 'Inter,sans-serif' }}>
          Select 2+ images to create a slideshow
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={createSlideshow}
            disabled={selectedIds.size < 2}
            style={{ 
              flex: 1, padding: '8px', background: selectedIds.size >= 2 ? '#6c63ff' : '#333', 
              color: selectedIds.size >= 2 ? '#fff' : '#666', border: 'none', borderRadius: '4px', 
              cursor: selectedIds.size >= 2 ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '11px' 
            }}
          >
            Create Slideshow {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ padding: '8px', background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '11px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Grid + drop zone ── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          overflow: 'hidden auto',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
          outline: dragOver ? '2px dashed #6c63ff' : '2px dashed transparent',
          outlineOffset: '-6px',
          transition: 'outline-color 0.15s',
          borderRadius: '4px',
        }}
      >
        {/* Empty state */}
        {mediaLibrary.length === 0 && !isMediaLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', color: dragOver ? '#6c63ff' : '#444', transition: 'color 0.15s', textAlign: 'center', padding: '20px', fontFamily: 'Inter,sans-serif' }}>
            <div style={{ fontSize: '32px', opacity: 0.5 }}>🎬</div>
            <span style={{ fontSize: '12px', lineHeight: 1.5 }}>
              {dragOver ? 'Drop to upload' : 'Drop files here\nor click Import'}
            </span>
            <span style={{ fontSize: '10px', color: '#333' }}>MP4 · WebM · JPG · PNG · MP3 · WAV</span>
          </div>
        )}

        {/* Loading Skeletons */}
        {isMediaLoading && mediaLibrary.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* 2-column grid */}
        {mediaLibrary.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {mediaLibrary.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggle={toggleSelect}
                removeMediaItem={removeMediaItem}
              />
            ))}
          </div>
        )}

        {/* Drag-over overlay */}
        {dragOver && (
          <div style={{ position: 'absolute', inset: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(108,99,255,0.08)', borderRadius: '6px', pointerEvents: 'none', fontSize: '13px', fontWeight: 600, color: '#6c63ff', fontFamily: 'Inter,sans-serif' }}>
            Drop to upload
          </div>
        )}
      </div>
    </aside>
  );
}
