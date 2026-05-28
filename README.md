# WebCut — Browser-Based Video Editor

A full-stack, browser-based video editor inspired by CapCut. Built with React + Vite on the frontend and Node.js + Express + FFmpeg on the backend.

---

## Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | 18+ (LTS recommended) |
| **npm** | 9+ |
| **FFmpeg** | Any recent stable build (must be on system `PATH`) |

> **macOS**: `brew install ffmpeg`  
> **Ubuntu/Debian**: `sudo apt install ffmpeg`  
> **Windows**: Download from [ffmpeg.org](https://ffmpeg.org) and add to PATH

---

## Getting Started

### 1. Clone & Install

```bash
# Install client dependencies
cd project/client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Start the Development Server

**Terminal 1 — Backend (port 3001):**
```bash
cd project/server
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd project/client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Features

- 🎬 **Multi-track timeline** — Video, audio, image, text, and subtitle tracks with drag-and-drop layers
- ✂️ **Clip operations** — Drag, resize, split, reorder, move across tracks
- 🔤 **Rich text / subtitles** — Custom fonts, colors, gradients, stroke, shadows, karaoke highlights
- 🖼️ **Sticker system** — Built-in vector SVG stickers draggable to timeline
- 🎵 **Audio engine** — Multi-track audio playback with per-layer volume control and master volume
- 🖥️ **Canvas preview** — Real-time `requestAnimationFrame` render loop with `OffscreenCanvas` text caching
- 🔁 **Transitions** — Fade, wipe, zoom, and cross-dissolve between clips
- 💾 **Project save / load** — JSON serialization to local storage + `.Webcut.json` file export/import
- 📤 **MP4 export** — FFmpeg-powered server-side rendering via REST API with SSE progress streaming and blazing fast in-memory pipe overlay rendering
- ↩️ **Undo / Redo** — 30-level undo stack
- 🔒 **Track lock / mute** — Per-track locking and muting controls
- 📐 **Zoom & fit** — Timeline zoom (0.5× – 5×) and canvas preview scale (Fit / 50% / 100%)
- ⌨️ **Keyboard shortcuts** — Space (play/pause), Ctrl+Z/Y (undo/redo), Delete (remove clip)

---

## Architecture

```
project/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── animations/     # Animation preset definitions (TikTok Style, etc.)
│       ├── assets/         # Static assets
│       ├── components/     # UI components (TopBar, MediaPanel, panels/, etc.)
│       ├── hooks/          # Custom React hooks (useKeyboardShortcuts, etc.)
│       ├── pages/          # EditorPage layout
│       ├── renderer/       # Canvas renderer, audio engine, render loop, transform overlay
│       ├── store/          # Zustand state (projectStore, uiStore)
│       ├── subtitles/      # Subtitle parsers and importers
│       ├── timeline/       # Timeline, TrackRow, ClipBlock, Ruler components
│       └── utils/          # Shared utilities
│
└── server/                 # Express backend
    ├── ffmpeg/             # FFmpeg timeline parser & filter graph generator, with canvas-based frame streaming
    ├── routes/             # API routes (media, export, project)
    ├── uploads/            # Uploaded media files (served as /files/uploads)
    ├── exports/            # Rendered MP4 outputs (served as /files/exports)
    └── index.js            # Entry point, CORS, multer, static serving
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/media` | List uploaded media |
| `POST` | `/api/media/upload` | Upload a media file (multipart) |
| `DELETE` | `/api/media/:id` | Delete a media file |
| `POST` | `/api/project/validate` | Validate media paths in a project file |
| `POST` | `/api/export` | Start an MP4 export job |
| `GET` | `/api/export/progress/:id` | SSE stream for export progress |

---

## Advanced Rendering Optimizations

The backend export pipeline utilizes an advanced streaming architecture to achieve maximum performance:
1. **Node Canvas Pre-rendering**: Text, subtitles, images, and stickers are drawn sequentially by `node-canvas` on the server using the exact same rendering logic as the frontend canvas, ensuring 1:1 pixel parity for animations.
2. **In-Memory Pipe Streaming**: Uncompressed RGBA frames are streamed completely asynchronously directly into FFmpeg (`image2pipe`) via an in-memory `PassThrough` stream, entirely bypassing the hard drive and maximizing I/O performance.
3. **Synchronized Filtergraph**: FFmpeg combines the background video, base audio streams, and the streaming overlay via a complex filtergraph, with calculated `setpts` logic to perfectly sync all elements.

---

## Known Limitations

- **Max 10 layers** recommended per track for real-time preview performance
- **Max export duration**: 300 seconds (5 minutes)
- **Audio sync**: Achieved via `AudioContext` scrubbing — slight drift may occur on very long clips
- **Video preview**: Canvas-rendered frames (not native `<video>` element) — no hardware decoding in preview
- **Transitions**: Applied via FFmpeg filter graph during export only; preview shows a static blend
- **No mobile support**: UI is designed for desktop browsers (1280px+ width)

---

## Building for Production

```bash
cd project/client
npm run build       # Outputs to client/dist/
npm run preview     # Serves the production build locally
```

---

## License

MIT
