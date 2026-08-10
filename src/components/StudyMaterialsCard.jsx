import { useEffect, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Video, Download, Maximize, X, Play } from 'lucide-react';
import { Card, Spinner } from './ui';
import { getMaterialsForSession } from '../api/materials';

function mediaIcon(mediaType) {
  if (mediaType === 'IMAGE') return ImageIcon;
  if (mediaType === 'VIDEO') return Video;
  return FileText;
}

function VideoPlayer({ material, onClose }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    containerRef.current?.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 bg-black/60">
        <p className="text-sm text-white truncate">{material.originalFilename}</p>
        <div className="flex items-center gap-3">
          {!document.fullscreenElement && (
            <button onClick={() => containerRef.current?.requestFullscreen?.().catch(() => {})} className="text-white/70 hover:text-white">
              <Maximize size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          src={material.signedUrl}
          controls
          controlsList={material.downloadable ? '' : 'nodownload'}
          autoPlay
          className="max-w-full max-h-full"
        />
      </div>
    </div>
  );
}

export default function StudyMaterialsCard({ sessionId }) {
  const [materials, setMaterials] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    getMaterialsForSession(sessionId).then(setMaterials).catch(() => setMaterials([]));
  }, [sessionId]);

  if (materials === null) return null;
  if (materials.length === 0) return null;

  return (
    <>
      <Card variant="elevated" className="mb-6">
        <h3 className="font-[var(--font-display)] font-semibold text-sm mb-3">Study material</h3>
        <div className="space-y-2">
          {materials.map((m) => {
            const Icon = mediaIcon(m.mediaType);
            const isVideo = m.mediaType === 'VIDEO';
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-[var(--color-surface-raised)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={15} className="text-[var(--color-text-faint)] shrink-0" />
                  <span className="text-sm truncate">{m.originalFilename}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isVideo ? (
                    <button
                      onClick={() => setPlayingVideo(m)}
                      className="text-xs font-medium text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <Play size={12} /> Watch
                    </button>
                  ) : (
                    <a href={m.signedUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--color-accent)] hover:underline">
                      View
                    </a>
                  )}
                  {m.downloadable && (
                    <a href={m.signedUrl} download={m.originalFilename} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                      <Download size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {playingVideo && <VideoPlayer material={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </>
  );
}
