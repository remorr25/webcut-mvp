import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fse from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/* ─── Allowed MIME types ─────────────────────────────────────────────────── */
const ALLOWED_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
]);

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

/* ─── Multer config ──────────────────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(`Unsupported file type: ${file.mimetype}`);
    err.status = 400;
    cb(err, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

/* ─── Router ─────────────────────────────────────────────────────────────── */
const router = express.Router();

/**
 * POST /api/upload
 * Accepts a single file field named "file".
 */
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err) {
      /* Multer size limit */
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `File too large. Maximum allowed size is 500 MB.`,
        });
      }
      /* Our custom fileFilter rejection */
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Send a "file" field.' });
    }

    const { filename, originalname, mimetype, size } = req.file;
    const id = path.parse(filename).name; // uuid without extension

    return res.status(201).json({
      id,
      filename,
      originalName: originalname,
      mimetype,
      size,
      url: `/files/uploads/${filename}`,
    });
  });
});

export default router;
