import TopBar from '../components/TopBar';
import MediaPanel from '../components/MediaPanel';
import TextPanel from '../components/TextPanel';
import StickerPanel from '../components/StickerPanel';
import TransitionPanel from '../components/panels/TransitionPanel';
import ExportPanel from '../components/panels/ExportPanel';
import LeftSidebar from '../components/LeftSidebar';
import PreviewCanvas from '../renderer/PreviewCanvas';
import Timeline from '../timeline/Timeline';
import PropertiesPanel from '../components/panels/PropertiesPanel';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import useUIStore from '../store/uiStore';
import ErrorBoundary from '../components/ErrorBoundary';

function LeftPanelArea() {
  const activePanel = useUIStore(s => s.activePanel);
  return (
    <ErrorBoundary componentName="Sidebar Panel">
      <LeftSidebar />
      {activePanel === 'media' && <MediaPanel />}
      {activePanel === 'text' && <TextPanel />}
      {activePanel === 'stickers' && <StickerPanel />}
      {activePanel === 'transitions' && <TransitionPanel />}
      {activePanel === 'export' && <ExportPanel />}
    </ErrorBoundary>
  );
}

/**
 * EditorPage
 * Full-height, 3-zone flex layout:
 *
 *  ┌──────────────────────────────────────────┐  ← TopBar      48px
 *  │  Left(280px) │ Preview(flex-1) │ Right(280px) │  ← Middle row flex-1
 *  └──────────────────────────────────────────┘
 *  │            Timeline                      │  ← Timeline   220px
 *  └──────────────────────────────────────────┘
 */
export default function EditorPage() {
  useKeyboardShortcuts();

  return (
    <div
      id="editor-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#0f0f0f',
      }}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <TopBar />

      {/* ── Middle Row ──────────────────────────────────────────────────── */}
      <div
        id="editor-middle"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <LeftPanelArea />
        <ErrorBoundary componentName="Preview Canvas">
          <PreviewCanvas />
        </ErrorBoundary>
        <ErrorBoundary componentName="Properties Panel">
          <PropertiesPanel />
        </ErrorBoundary>
      </div>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <ErrorBoundary componentName="Timeline">
        <Timeline />
      </ErrorBoundary>
    </div>
  );
}
