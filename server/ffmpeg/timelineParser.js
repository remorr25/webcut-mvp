import path from 'path';
import fse from 'fs-extra';
import { fileURLToPath } from 'url';
import { createCanvas, registerFont } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const FONTS_DIR = path.join(__dirname, '..', 'fonts');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Register all fonts individually to prevent one bad file from failing all
const fontsToRegister = [
  { file: 'Inter.ttf', family: 'Inter' },
  { file: 'Inter-Bold.ttf', family: 'Inter', weight: 'bold' },
  { file: 'Poppins-Bold.ttf', family: 'Poppins', weight: 'bold' },
  { file: 'BebasNeue-Regular.ttf', family: 'Bebas Neue' },
  { file: 'Anton-Regular.ttf', family: 'Anton' }
];

for (const font of fontsToRegister) {
  try {
    registerFont(path.join(FONTS_DIR, font.file), { family: font.family, weight: font.weight });
  } catch (e) {
    console.warn(`[canvas] Failed to register font ${font.file}:`, e.message);
  }
}

const FONT_MAP = {
  'Inter': 'Inter.ttf',
  'Poppins': 'Poppins-Bold.ttf',
  'Bebas Neue': 'BebasNeue-Regular.ttf',
  'Anton': 'Anton-Regular.ttf'
};

export async function parseTimeline(project, exportId) {
  const result = {
    videoLayers: [],
    imageLayers: [],
    stickerLayers: [],
    audioLayers: [],
    textLayers: [],
    transitions: project.transitions || [],
    errors: [],
    duration: project.duration || 30
  };

  if (!project.tracks) return result;

  for (const track of project.tracks) {
    for (const layer of track.layers) {
      // Validate paths
      let absolutePath = null;
      if (layer.src) {
        // layer.src is usually like "/files/uploads/file.mp4"
        const filename = path.basename(layer.src);
        absolutePath = path.join(UPLOADS_DIR, filename);
        if (!fse.existsSync(absolutePath)) {
          result.errors.push(`Missing file for layer ${layer.id}: ${filename}`);
          continue;
        }
      }

      // We clone the layer and add absolutePath
      const parsedLayer = { ...layer, absolutePath };

      switch (layer.type) {
        case 'video':
          result.videoLayers.push(parsedLayer);
          break;
        case 'image':
          result.imageLayers.push(parsedLayer);
          break;
        case 'sticker':
          result.stickerLayers.push(parsedLayer);
          break;
        case 'audio':
          result.audioLayers.push(parsedLayer);
          break;
        case 'text':
        case 'subtitle': {
          const fontName = layer.text?.fontFamily || 'Inter';
          const fontFile = FONT_MAP[fontName] || 'Inter.ttf';
          const fontPath = path.join(FONTS_DIR, fontFile);
          
          if (!fse.existsSync(fontPath)) {
            result.errors.push(`Missing font in backend: ${fontFile}`);
          } else {
            parsedLayer.absoluteFontPath = fontPath;
          }
          result.textLayers.push(parsedLayer);
          break;
        }
      }
    }
  }

  // Sort visual layers by start time
  result.videoLayers.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  result.imageLayers.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  return result;
}
