import express from 'express';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads');

const router = express.Router();

router.post('/validate', async (req, res) => {
  try {
    const project = req.body;
    if (!project || !project.tracks) {
      return res.status(400).json({ error: 'Invalid project JSON' });
    }

    const missingFiles = [];

    for (const track of project.tracks) {
      for (const layer of track.layers) {
        if (layer.source?.src) {
          const filePath = path.join(UPLOADS_DIR, layer.source.src);
          if (!(await fse.pathExists(filePath))) {
            missingFiles.push(layer.source.src);
          }
        }
      }
    }

    return res.json({
      valid: missingFiles.length === 0,
      missingFiles
    });
  } catch (error) {
    console.error('Project validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

export default router;
