import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import fse from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';
import uploadRouter from './routes/upload.js';
import mediaRouter  from './routes/media.js';
import exportRouter from './routes/export.js';
import projectRouter from './routes/project.js';

/* ─── Resolve __dirname in ESM ──────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ─── Config ─────────────────────────────────────────────────────────────── */
const PORT       = process.env.PORT       || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/* ─── FFmpeg path (env override or system default) ──────────────────────── */
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';

/* ─── Bootstrap required directories ────────────────────────────────────── */
const DIRS = ['uploads', 'exports', 'temp'].map(d => path.join(__dirname, d));

async function ensureDirectories() {
  await Promise.all(DIRS.map(dir => fse.ensureDir(dir)));
  console.log(
    '✅  Directories ready:',
    DIRS.map(d => path.relative(__dirname, d)).join(', ')
  );
}

/* ─── Verify FFmpeg on startup ───────────────────────────────────────────── */
function verifyFfmpeg() {
  return new Promise((resolve, reject) => {
    execFile(ffmpegBin, ['-version'], (err, stdout) => {
      if (err) {
        reject(
          new Error(
            `❌  FFmpeg not found or not executable.\n` +
            `    Set FFMPEG_PATH in .env or install ffmpeg on your system.\n` +
            `    Binary tried: "${ffmpegBin}"\n` +
            `    Original error: ${err.message}`
          )
        );
        return;
      }
      const versionLine = stdout.split('\n')[0].trim();
      console.log(`✅  FFmpeg detected: ${versionLine}`);
      resolve();
    });
  });
}

/* ─── App ────────────────────────────────────────────────────────────────── */
const app = express();

/* CORS */
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

/* Body parsers */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* Static file serving */
app.use('/files/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/files/exports', express.static(path.join(__dirname, 'exports')));

/* Health check */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─── API Routes ─────────────────────────────────────────────────────────── */
app.use('/api/upload', uploadRouter);
app.use('/api/media',  mediaRouter);
app.use('/api/export', exportRouter);
app.use('/api/project', projectRouter);

/* ─── 404 Handler ────────────────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ─── Global Error Handler ───────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('🔴  Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

/* ─── Bootstrap & Listen ─────────────────────────────────────────────────── */
async function bootstrap() {
  try {
    await ensureDirectories();
    await verifyFfmpeg();

    const files = await fse.readdir(path.join(__dirname, 'exports'));
    const now = Date.now();
    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(__dirname, 'exports', file);
        const stats = await fse.stat(filePath);
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await fse.remove(filePath);
        }
      }
    }

    app.listen(PORT, () => {
      console.log(`\n🚀  Server running  →  http://localhost:${PORT}`);
      console.log(`    CORS origin      →  ${CLIENT_URL}`);
      console.log(`    Static uploads   →  /files/uploads`);
      console.log(`    Static exports   →  /files/exports`);
      console.log(`    Health check     →  GET /api/health\n`);
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

bootstrap();
