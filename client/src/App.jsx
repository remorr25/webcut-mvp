import { Component } from 'react';
import EditorPage from './pages/EditorPage';
import Toast from './components/Toast';
import UploadProgress from './components/UploadProgress';

/* ─── Error Boundary ─────────────────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f0f0f',
            color: '#f0f0f0',
            fontFamily: 'Inter, sans-serif',
            gap: '20px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          {/* Error icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255, 80, 80, 0.12)',
            border: '1px solid rgba(255, 80, 80, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            ⚠
          </div>

          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#f0f0f0' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '13px', color: '#888', maxWidth: '420px', lineHeight: 1.6 }}>
              An unexpected error occurred in the editor. Your project is auto-saved.
            </p>
          </div>

          {/* Error detail (collapsible in dev) */}
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '11px',
              color: '#ff6b6b',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '180px',
              lineHeight: 1.5,
            }}>
              {this.state.error.toString()}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReset}
              style={{
                background: '#6c63ff',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#c8c8c8',
                fontSize: '13px',
                fontWeight: 500,
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ─── App root ───────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <>
      <ErrorBoundary>
        <EditorPage />
      </ErrorBoundary>
      {/* Global overlays — outside ErrorBoundary so they always render */}
      <Toast />
      <UploadProgress />
    </>
  );
}
