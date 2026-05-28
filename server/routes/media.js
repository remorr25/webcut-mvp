import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/* ─── MIME map (by extension) ────────────────────────────────────────────── */
const EXT_MIME = {
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
};

function mimeFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  return EXT_MIME[ext] ?? 'application/octet-stream';
}

/* ─── Router ─────────────────────────────────────────────────────────────── */
const router = express.Router();

/**
 * GET /api/media
 * Returns all files in uploads/, sorted newest first.
 */
router.get('/', async (_req, res, next) => {
  try {
    await fse.ensureDir(UPLOADS_DIR);
    const files = await fse.readdir(UPLOADS_DIR);

    const items = await Promise.all(
      files
        .filter(f => !f.startsWith('.')) // skip hidden files
        .map(async filename => {
          const filepath = path.join(UPLOADS_DIR, filename);
          const stat = await fse.stat(filepath);
          const id   = path.parse(filename).name;
          return {
            id,
            filename,
            mimetype:  mimeFromFilename(filename),
            url:       `/files/uploads/${filename}`,
            size:      stat.size,
            createdAt: stat.birthtime.toISOString(),
          };
        })
    );

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(items);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/media/:id
 * :id is the UUID (filename without extension).
 * Scans uploads/ for a file whose basename (no ext) matches id.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate id looks like a UUID to prevent path traversal
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid media id.' });
    }

    await fse.ensureDir(UPLOADS_DIR);
    const files = await fse.readdir(UPLOADS_DIR);
    const match = files.find(f => path.parse(f).name === id);

    if (!match) {
      return res.status(404).json({ error: `Media "${id}" not found.` });
    }

    await fse.remove(path.join(UPLOADS_DIR, match));
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;
