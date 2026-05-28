import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';
import { createLayer } from '../utils/layerUtils';

/* ─── Client-side validation (mirrors server rules) ─────────────────────── */
const ALLOWED_MIMES = new Set([
  'video/mp4', 'video/webm',
  'image/jpeg', 'image/png', 'image/webp',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
]);
const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

function validateFile(file) {
  if (!ALLOWED_MIMES.has(file.type)) {
    return `"${file.name}": unsupported type (${file.type || 'unknown'}).`;
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}": exceeds 500 MB limit (${(file.size / 1024 ** 2).toFixed(1)} MB).`;
  }
  return null; // valid
}

/**
 * useUpload
 *
 * Uploads files via XHR (for real progress%), integrates with the global
 * uiStore upload queue and toast notifications, and updates the projectStore
 * mediaLibrary on success.
 *
 * Returns:
 *   upload(file, trackId?)  — validate + start an upload
 *   uploadMany(files, trackId?) — upload multiple sequentially
 */
export default function useUpload() {
  const addLayer      = useProjectStore(s => s.addLayer);
  const addMediaItem  = useProjectStore(s => s.addMediaItem);
  const project       = useProjectStore(s => s.project);

  const addUpload     = useUIStore(s => s.addUpload);
  const updateUpload  = useUIStore(s => s.updateUpload);
  const finishUpload  = useUIStore(s => s.finishUpload);
  const addToast      = useUIStore(s => s.addToast);

  /**
   * Upload a single File.
   * @param {File}    file
   * @param {string=} trackId
   * @returns {Promise<object>} server response
   */
  const upload = useCallback(
    (file, trackId = null) =>
      new Promise((resolve, reject) => {
        /* ── Client-side validation ── */
        const validationError = validateFile(file);
        if (validationError) {
          addToast(validationError, 'error');
          return reject(new Error(validationError));
        }

        const uploadId = uuidv4();
        addUpload(uploadId, file.name);

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        /* ── Progress ── */
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            updateUpload(uploadId, Math.round((e.loaded / e.total) * 100));
          }
        });

        /* ── Done ── */
        xhr.addEventListener('load', () => {
          if (xhr.status === 201) {
            let data;
            try { data = JSON.parse(xhr.responseText); }
            catch {
              const msg = `"${file.name}": server returned invalid JSON.`;
              finishUpload(uploadId, false, msg);
              addToast(msg, 'error');
              return reject(new Error(msg));
            }

            /* ── Infer layer type from MIME ── */
            const mime = data.mimetype ?? '';
            let layerType = 'video';
            if (mime.startsWith('audio/')) layerType = 'audio';
            if (mime.startsWith('image/')) layerType = 'image';

            /* ── Add to mediaLibrary ── */
            addMediaItem(data);

            /* ── Build layer and add to first matching track ── */
            const layer = createLayer(layerType, {
              name:     data.originalName ?? data.filename,
              src:      data.url,
              duration: layerType === 'image' ? 5 : 10,
              meta: {
                uploadId:     data.id,
                originalName: data.originalName,
                mimetype:     data.mimetype,
                size:         data.size,
              },
            });

            const targetTrackId =
              trackId ??
              project?.tracks?.find(t => t.type === layerType)?.id ??
              project?.tracks?.[0]?.id;

            if (targetTrackId) addLayer(targetTrackId, layer);

            finishUpload(uploadId, true);
            addToast(`"${file.name}" uploaded successfully.`, 'success');
            resolve(data);

          } else {
            let msg = `Upload failed (HTTP ${xhr.status})`;
            try {
              const body = JSON.parse(xhr.responseText);
              if (body.error) msg = body.error;
            } catch { /* ignore */ }
            if (xhr.status === 413) msg = `"${file.name}" exceeds 500 MB limit.`;

            finishUpload(uploadId, false, msg);
            addToast(msg, 'error');
            reject(new Error(msg));
          }
        });

        /* ── Network error ── */
        xhr.addEventListener('error', () => {
          const msg = 'Network error — could not reach the server.';
          finishUpload(uploadId, false, msg);
          addToast(msg, 'error');
          reject(new Error(msg));
        });

        /* ── Abort ── */
        xhr.addEventListener('abort', () => {
          const msg = `Upload of "${file.name}" was cancelled.`;
          finishUpload(uploadId, false, msg);
          reject(new Error(msg));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      }),
    [addLayer, addMediaItem, project, addUpload, updateUpload, finishUpload, addToast]
  );

  /**
   * Upload multiple files sequentially (preserves per-file progress accuracy).
   * @param {FileList|File[]} files
   * @param {string=} trackId
   */
  const uploadMany = useCallback(
    async (files, trackId = null) => {
      const results = [];
      for (const file of Array.from(files)) {
        try {
          const result = await upload(file, trackId);
          results.push({ file, result, error: null });
        } catch (err) {
          results.push({ file, result: null, error: err });
        }
      }
      return results;
    },
    [upload]
  );

  return { upload, uploadMany };
}
