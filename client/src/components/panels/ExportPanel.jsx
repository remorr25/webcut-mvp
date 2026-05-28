import { useState, useRef } from 'react';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';

export default function ExportPanel() {
  const project = useProjectStore(s => s.project);
  const { exportHistory, addExportToHistory } = useUIStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [exportStats, setExportStats] = useState(null);
  const startTimeRef = useRef(0);

  const startExport = async () => {
    if (!project || project.tracks.length === 0) return;

    setIsExporting(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setExportStats(null);
    startTimeRef.current = Date.now();

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed to start');
      }

      const { exportId } = await res.json();

      // Listen to SSE
      const evtSource = new EventSource(`/api/export/progress/${exportId}`);

      evtSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setProgress(data.percent);
        } else if (data.type === 'complete') {
          const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
          const fileSizeMB = data.fileSize ? (data.fileSize / 1024 / 1024).toFixed(2) : 0;
          
          setDownloadUrl(data.url);
          setExportStats({ duration, fileSizeMB });
          
          addExportToHistory({
            id: exportId,
            url: data.url,
            date: Date.now(),
            fileSizeMB
          });

          setIsExporting(false);
          setProgress(100);
          evtSource.close();
        } else if (data.type === 'error') {
          const errMessage = data.error || 'Unknown error';
          const stderrInfo = data.stderr ? `\n\nFFmpeg Log:\n${data.stderr.slice(-500)}` : '';
          setError(`${errMessage}${stderrInfo}`);
          setIsExporting(false);
          evtSource.close();
        }
      };

      evtSource.onerror = (err) => {
        console.error('SSE Error:', err);
        setError('Lost connection to server during export');
        setIsExporting(false);
        evtSource.close();
      };

    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e8e8e8', fontFamily: 'Inter,sans-serif' }}>Export Video</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>
          Duration: {project?.duration || 0} seconds
        </div>
        <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif' }}>
          Resolution: 1080x1920
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', borderRadius: '6px', padding: '12px', fontSize: '11px', color: '#ff6b6b', fontFamily: 'Inter,sans-serif', whiteSpace: 'pre-wrap' }}>
          {error}
        </div>
      )}

      {isExporting ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', fontFamily: 'Inter,sans-serif' }}>
            <span>Rendering...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#6c63ff', transition: 'width 0.2s' }} />
          </div>
        </div>
      ) : downloadUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#00d2ff', fontFamily: 'Inter,sans-serif', fontWeight: 600, textAlign: 'center' }}>
            Export Complete!
          </div>
          {exportStats && (
            <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Inter,sans-serif', textAlign: 'center' }}>
              {exportStats.fileSizeMB} MB • Took {exportStats.duration}s
            </div>
          )}
          <a
            href={downloadUrl}
            download="export.mp4"
            style={{ 
              display: 'block', padding: '12px', background: '#00d2ff', color: '#000', 
              textAlign: 'center', textDecoration: 'none', borderRadius: '6px', 
              fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '13px' 
            }}
          >
            Download MP4
          </a>
          <button
            onClick={() => setDownloadUrl(null)}
            style={{ padding: '8px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontSize: '11px' }}
          >
            Export Again
          </button>
        </div>
      ) : (
        <button
          onClick={startExport}
          style={{ 
            width: '100%', padding: '12px', background: '#6c63ff', color: '#fff', 
            border: 'none', borderRadius: '6px', cursor: 'pointer', 
            fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '13px' 
          }}
        >
          Export MP4
        </button>
      )}

      {/* Export History */}
      {exportHistory && exportHistory.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', fontFamily: 'Inter,sans-serif' }}>Recent Exports</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {exportHistory.map(exp => (
              <a 
                key={exp.id} 
                href={exp.url} 
                download 
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#222', padding: '10px', borderRadius: '4px', textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'Inter,sans-serif' }}>{new Date(exp.date).toLocaleTimeString()}</span>
                  <span style={{ fontSize: '10px', color: '#888', fontFamily: 'Inter,sans-serif' }}>{exp.fileSizeMB} MB</span>
                </div>
                <span style={{ fontSize: '16px' }}>⬇️</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
