import { useRef, useState, useEffect } from 'react';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';

/* ── Icon components (inline SVG — no extra deps) ────────────────────────── */
function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function OpenFolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6c63ff"/>
      <polygon points="11,8 25,16 11,24" fill="white"/>
      <rect x="7" y="8" width="3" height="16" rx="1.5" fill="white" opacity="0.7"/>
    </svg>
  );
}

/* ── Saved flash badge ───────────────────────────────────────────────────── */
function SavedBadge({ visible }) {
  return (
    <span
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        fontSize: '11px',
        color: '#6c63ff',
        fontWeight: 500,
        letterSpacing: '0.02em',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      ✓ Saved
    </span>
  );
}

/* ── TopBar ──────────────────────────────────────────────────────────────── */
export default function TopBar() {
  const project           = useProjectStore(s => s.project);
  const saveProject       = useProjectStore(s => s.saveProject);
  const exportProjectFile = useProjectStore(s => s.exportProjectFile);
  const importProjectFile = useProjectStore(s => s.importProjectFile);
  const updateProjectName = useProjectStore(s => s.updateProjectName);
  const undo              = useProjectStore(s => s.undo);
  const redo              = useProjectStore(s => s.redo);
  const undoStack         = useProjectStore(s => s.undoStack);
  const redoStack         = useProjectStore(s => s.redoStack);
  const setActivePanel    = useUIStore(s => s.setActivePanel);

  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const flashTimerRef = useRef(null);

  const projectName = project?.name ?? 'Untitled Project';

  /* Auto-focus when entering edit mode */
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleNameClick() {
    setDraft(projectName);
    setEditing(true);
  }

  function commitName() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== projectName) {
      updateProjectName(trimmed);
    }
    setEditing(false);
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') setEditing(false);
  }

  function handleSave() {
    saveProject();
    clearTimeout(flashTimerRef.current);
    setSavedFlash(true);
    flashTimerRef.current = setTimeout(() => setSavedFlash(false), 2000);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      importProjectFile(file);
    }
    e.target.value = null;
  }

  function handleExport() {
    setActivePanel('export');
  }

  return (
    <header
      style={{
        height: '48px',
        background: '#141414',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <LogoIcon />
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: '18px',
          letterSpacing: '0.08em',
          color: '#6c63ff',
          lineHeight: 1,
        }}>
          WebCut
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '22px', background: '#333', flexShrink: 0 }} />

      {/* Editable project name */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            style={{
              background: '#252525',
              border: '1px solid #6c63ff',
              borderRadius: '5px',
              color: '#f0f0f0',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              padding: '3px 10px',
              outline: 'none',
              width: '240px',
              maxWidth: '100%',
            }}
          />
        ) : (
          <button
            onClick={handleNameClick}
            title="Click to rename project"
            style={{
              background: 'none',
              border: 'none',
              color: '#f0f0f0',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              cursor: 'text',
              padding: '3px 8px',
              borderRadius: '5px',
              transition: 'background 0.15s',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {projectName}
          </button>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', background: 'transparent',
            border: 'none', borderRadius: '4px', cursor: undoStack.length === 0 ? 'default' : 'pointer',
            color: undoStack.length === 0 ? '#444' : '#aaa',
          }}
          onMouseEnter={e => { if(undoStack.length > 0) { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = undoStack.length === 0 ? '#444' : '#aaa'; }}
        >
          <UndoIcon />
        </button>

        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Shift+Z)"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', background: 'transparent',
            border: 'none', borderRadius: '4px', cursor: redoStack.length === 0 ? 'default' : 'pointer',
            color: redoStack.length === 0 ? '#444' : '#aaa',
          }}
          onMouseEnter={e => { if(redoStack.length > 0) { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = '#fff'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = redoStack.length === 0 ? '#444' : '#aaa'; }}
        >
          <RedoIcon />
        </button>

        <div style={{ width: '1px', height: '16px', background: '#333', margin: '0 4px' }} />

        <SavedBadge visible={savedFlash} />

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1px solid #333', borderRadius: '6px',
            color: '#c8c8c8', fontSize: '12px', fontWeight: 500, padding: '5px 12px',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = '#f0f0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c8c8c8'; }}
        >
          <OpenFolderIcon /> Open
        </button>

        <button
          onClick={exportProjectFile}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1px solid #333', borderRadius: '6px',
            color: '#c8c8c8', fontSize: '12px', fontWeight: 500, padding: '5px 12px',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = '#f0f0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c8c8c8'; }}
        >
          <SaveIcon /> Save File
        </button>

        <div style={{ width: '1px', height: '16px', background: '#333', margin: '0 4px' }} />

        <button
          id="topbar-save-btn"
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#252525',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#c8c8c8',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            padding: '5px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#333';
            e.currentTarget.style.color = '#f0f0f0';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#252525';
            e.currentTarget.style.color = '#c8c8c8';
          }}
        >
          <SaveIcon /> Save
        </button>

        <button
          id="topbar-export-btn"
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#6c63ff',
            border: '1px solid #6c63ff',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            padding: '5px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#7b74ff';
            e.currentTarget.style.borderColor = '#7b74ff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#6c63ff';
            e.currentTarget.style.borderColor = '#6c63ff';
          }}
        >
          <ExportIcon /> Export
        </button>
      </div>
    </header>
  );
}
