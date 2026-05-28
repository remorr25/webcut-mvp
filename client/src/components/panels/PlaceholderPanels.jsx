/* Placeholder panel components — will be replaced in later tasks */

export function LeftPanel() {
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
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #333',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: '#888',
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
      }}>
        Media
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#444',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      }}>
        Media panel — coming soon
      </div>
    </aside>
  );
}

export function RightPanel() {
  return (
    <aside
      id="right-panel"
      style={{
        width: '280px',
        flexShrink: 0,
        background: '#1a1a1a',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #333',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: '#888',
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
      }}>
        Properties
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#444',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      }}>
        Properties panel — coming soon
      </div>
    </aside>
  );
}

export function PreviewArea() {
  return (
    <main
      id="preview-area"
      style={{
        flex: 1,
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 16:9 canvas placeholder */}
      <div style={{
        width: 'min(100%, calc((100vh - 48px - 220px) * 16/9))',
        aspectRatio: '16 / 9',
        background: '#141414',
        border: '1px solid #2a2a2a',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <span style={{
          color: '#333',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.04em',
        }}>
          Preview — 1920 × 1080
        </span>
        {/* Corner markers */}
        {['top-left','top-right','bottom-left','bottom-right'].map(pos => {
          const [v, h] = pos.split('-');
          return (
            <div key={pos} style={{
              position: 'absolute',
              [v]: 0,
              [h]: 0,
              width: '12px',
              height: '12px',
              borderTop: v === 'top' ? '2px solid #6c63ff' : 'none',
              borderBottom: v === 'bottom' ? '2px solid #6c63ff' : 'none',
              borderLeft: h === 'left' ? '2px solid #6c63ff' : 'none',
              borderRight: h === 'right' ? '2px solid #6c63ff' : 'none',
            }} />
          );
        })}
      </div>
    </main>
  );
}

export function TimelinePanel() {
  return (
    <section
      id="timeline-panel"
      style={{
        height: '220px',
        flexShrink: 0,
        background: '#1a1a1a',
        borderTop: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #333',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: '#888',
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
        flexShrink: 0,
      }}>
        Timeline
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#444',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      }}>
        Timeline — coming soon
      </div>
    </section>
  );
}
