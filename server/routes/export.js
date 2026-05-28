import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fse from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';

import { parseTimeline } from '../ffmpeg/timelineParser.js';
import { buildFilterComplex } from '../ffmpeg/filterGenerator.js';
import { generateFrameSequence } from '../ffmpeg/frameRenderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

const router = express.Router();

// Global map to hold export progress emitters
const progressEmitters = new Map();
let activeExports = 0;
const MAX_CONCURRENT_EXPORTS = 3;

router.post('/', async (req, res, next) => {
  try {
    if (activeExports >= MAX_CONCURRENT_EXPORTS) {
      return res.status(429).json({ error: 'Server busy. Too many concurrent exports.' });
    }

    const { project } = req.body;
    
    if (!project || !project.tracks) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }

    const exportId = uuidv4();
    const outputPath = path.join(EXPORTS_DIR, `${exportId}.mp4`);
    
    // Parse the timeline to get absolute paths and validate
    const parsedTimeline = await parseTimeline(project, exportId);
    if (parsedTimeline.errors.length > 0) {
      return res.status(400).json({ error: 'Missing source files', details: parsedTimeline.errors });
    }

    const tempDir = path.join(__dirname, '..', 'temp', exportId);
    await fse.ensureDir(tempDir);
    
    // Create an in-memory pipe for frames
    const { PassThrough } = await import('stream');
    const framesStream = new PassThrough();
    let fps = 30;
    
    // Run frame generation concurrently with FFmpeg (do not await)
    generateFrameSequence(parsedTimeline, project, framesStream)
      .then(res => { fps = res.fps; })
      .catch(err => { console.error('Frame streaming failed:', err); });

    activeExports++;

    // Build the filter graph
    const { inputs, filterComplex, outputMap } = buildFilterComplex(parsedTimeline, project, framesStream, fps);
    
    const emitter = new EventEmitter();
    progressEmitters.set(exportId, emitter);

    // Setup ffmpeg
    const command = ffmpeg();
    inputs.forEach(inputObj => {
      if (typeof inputObj === 'string') {
        command.addInput(inputObj);
      } else if (inputObj && inputObj.stream) {
        command.addInput(inputObj.stream);
        if (inputObj.options) command.inputOptions(inputObj.options);
        if (inputObj.format) command.inputFormat(inputObj.format);
      } else if (inputObj && inputObj.path) {
        command.addInput(inputObj.path);
        if (inputObj.options) command.inputOptions(inputObj.options);
      }
    });
    
    command.complexFilter(filterComplex, outputMap);
    
    command.outputOptions([
      '-c:v libx264',
      '-preset fast',
      '-crf 22',
      '-c:a aac',
      '-b:a 192k',
      '-pix_fmt yuv420p',
      '-movflags +faststart'
    ]);
    
    command.output(outputPath);
    
    command.on('start', (cmdStr) => {
      console.log(`[FFmpeg] Started export ${exportId}\n${cmdStr}`);
    });
    
    command.on('progress', (progress) => {
      // fluent-ffmpeg progress object has { frames, currentFps, currentKbps, targetSize, timemark, percent }
      // Sometimes percent is undefined if length is unknown, but we provided a base video with duration
      emitter.emit('progress', { percent: progress.percent || 0 });
    });
    
    const cleanupTemp = async () => {
      activeExports--;
      try {
        await fse.remove(path.join(__dirname, '..', 'temp', exportId));
      } catch(e) {}
    };

    command.on('end', async () => {
      console.log(`[FFmpeg] Finished export ${exportId}`);
      let fileSize = 0;
      try {
        const stats = await fse.stat(outputPath);
        fileSize = stats.size;
      } catch(e) {}
      emitter.emit('end', { url: `/files/exports/${exportId}.mp4`, fileSize });
      progressEmitters.delete(exportId);
      cleanupTemp();
    });
    
    command.on('error', (err, stdout, stderr) => {
      console.error(`[FFmpeg] Error in export ${exportId}:`, err.message);
      emitter.emit('error', { message: err.message, stderr });
      progressEmitters.delete(exportId);
      cleanupTemp();
    });

    command.run();

    return res.status(202).json({ exportId });

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error during export setup' });
  }
});

// SSE endpoint for progress
router.get('/progress/:id', (req, res) => {
  const { id } = req.params;
  const emitter = progressEmitters.get(id);

  if (!emitter) {
    return res.status(404).json({ error: 'Export ID not found or already finished' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onProgress = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', percent: data.percent })}\n\n`);
  };

  const onEnd = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'complete', url: data.url, fileSize: data.fileSize })}\n\n`);
    res.end();
  };

  const onError = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: data.message, stderr: data.stderr })}\n\n`);
    res.end();
  };

  emitter.on('progress', onProgress);
  emitter.on('end', onEnd);
  emitter.on('error', onError);

  req.on('close', () => {
    emitter.off('progress', onProgress);
    emitter.off('end', onEnd);
    emitter.off('error', onError);
  });
});

export default router;
