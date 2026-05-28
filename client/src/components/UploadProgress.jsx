import useUIStore from '../store/uiStore';

/* ─── Single upload row ──────────────────────────────────────────────────── */
function UploadRow({ item }) {
  const barColor = item.error
    ? '#ff6b6b'
    : item.success
    ? '#63e6a0'
    : 'linear-gradient(90deg, #6c63ff, #9b8fff)';

  return (
    <div style={{
      padding: '8px 10px',
      borderBottom: '1px solid #2a2a2a',
      lastChild: { borderBottom: 'none' },
    }}>
      {/* Filename + status icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: item.done ? '0' : '5px',
        gap: '8px',
      }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          color: item.error ? '#ff6b6b' : '#d0d0d0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}>
          {item.name}
        </span>

        <span style={{ fontSize: '12px', flexShrink: 0 }}>
          {item.done && item.success && '✓'}
          {item.done && item.error  && '✕'}
          {!item.done && (
            <span style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
              {item.progress}%
            </span>
          )}
        </span>
      </div>

      {/* Progress bar (hidden once done) */}
      {!item.done && (
        <div style={{
          height: '3px',
          background: '#2a2a2a',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${item.progress}%`,
            background: barColor,
            borderRadius: '2px',
            transition: 'width 0.1s linear',
          }} />
        </div>
      )}

      {/* Error message */}
      {item.error && (
        <p style={{
          margin: '3px 0 0',
          fontSize: '10px',
          color: '#ff6b6b',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.4,
        }}>
          {item.error}
        </p>
      )}
    </div>
  );
}

/* ─── UploadProgress overlay ─────────────────────────────────────────────── */
export default function UploadProgress() {
  const uploadQueue = useUIStore(s => s.uploadQueue);

  if (uploadQueue.length === 0) return null;

  const active  = uploadQueue.filter(u => !u.done).length;
  const total   = uploadQueue.length;

  return (
    <div
      id="upload-progress-overlay"
      style={{
        position: 'fixed',
        bottom: '232px',   // sits just above the 220px timeline + some margin
        right: '16px',
        width: '260px',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        zIndex: 1000,
        animation: 'fadeSlideUp 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: '#141414',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#888',
          textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif',
        }}>
          Uploading
        </span>
        <span style={{
          fontSize: '10px',
          color: active > 0 ? '#6c63ff' : '#63e6a0',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
        }}>
          {active > 0 ? `${active} of ${total} active` : `${total} done`}
        </span>
      </div>

      {/* Upload rows — max 5 visible, scroll for more */}
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {uploadQueue.map(item => (
          <UploadRow key={item.id} item={item} />
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
