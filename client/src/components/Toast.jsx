import { useEffect, useRef } from 'react';
import useUIStore from '../store/uiStore';

/* ─── Icon per toast type ────────────────────────────────────────────────── */
const ICONS = {
  success: { emoji: '✓', color: '#63e6a0', bg: 'rgba(99,230,160,0.12)', border: 'rgba(99,230,160,0.25)' },
  error:   { emoji: '✕', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.25)' },
  info:    { emoji: 'ℹ', color: '#63d4ff', bg: 'rgba(99,212,255,0.12)',  border: 'rgba(99,212,255,0.25)'  },
};

/* ─── Single toast item ──────────────────────────────────────────────────── */
function ToastItem({ toast }) {
  const removeToast = useUIStore(s => s.removeToast);
  const style = ICONS[toast.type] ?? ICONS.info;
  const mountedRef = useRef(false);
  const elRef = useRef(null);

  /* Entrance animation via class swap */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    // tiny delay so the browser registers the initial state before animating in
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });
    mountedRef.current = true;
  }, []);

  return (
    <div
      ref={elRef}
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        padding: '10px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        maxWidth: '320px',
        width: '100%',
        /* Start hidden, animate in */
        opacity: 0,
        transform: 'translateX(24px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
    >
      {/* Icon badge */}
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: style.border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        color: style.color,
        flexShrink: 0,
        marginTop: '1px',
        fontWeight: 700,
      }}>
        {style.emoji}
      </div>

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        color: '#e8e8e8',
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {toast.message}
      </span>

      {/* Dismiss button */}
      <button
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: '#555',
          cursor: 'pointer',
          fontSize: '15px',
          lineHeight: 1,
          padding: '0',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#999')}
        onMouseLeave={e => (e.currentTarget.style.color = '#555')}
      >
        ×
      </button>
    </div>
  );
}

/* ─── Toast container ────────────────────────────────────────────────────── */
export default function Toast() {
  const toasts = useUIStore(s => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '240px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1100,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto', width: '100%' }}>
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
