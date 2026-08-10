import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Video, Trash2, Upload, Eye, EyeOff, Download, DownloadCloud } from 'lucide-react';
import { Button, Card, Spinner, ConfirmDialog } from './ui';
import { getMaterialsForInstructor, uploadSupplementaryMaterial, updateMaterialVisibility, deleteMaterial } from '../api/materials';

function mediaIcon(mediaType) {
  if (mediaType === 'IMAGE') return ImageIcon;
  if (mediaType === 'VIDEO') return Video;
  return FileText;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function MaterialRow({ material, onToggle, onDelete }) {
  const Icon = mediaIcon(material.mediaType);
  return (
    <Card className="!p-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={15} className="text-[var(--color-text-faint)] shrink-0" />
        <div className="min-w-0">
          <a href={material.signedUrl} target="_blank" rel="noreferrer" className="text-sm truncate hover:text-[var(--color-accent)] block">
            {material.originalFilename}
          </a>
          <p className="text-xs text-[var(--color-text-faint)] font-mono">{formatSize(material.fileSizeBytes)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onToggle(material.id, { studentVisible: !material.studentVisible })}
          title={material.studentVisible ? 'Visible to students — click to hide' : 'Hidden from students — click to show'}
          className={`p-2 rounded-lg transition-colors ${material.studentVisible ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'text-[var(--color-text-faint)] hover:text-[var(--color-text)]'}`}
        >
          {material.studentVisible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={() => onToggle(material.id, { downloadable: !material.downloadable })}
          disabled={!material.studentVisible}
          title={!material.studentVisible ? 'Only visible materials can be downloadable' : material.downloadable ? 'Downloadable — click to disable' : 'Not downloadable — click to enable'}
          className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${material.downloadable ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'text-[var(--color-text-faint)] hover:text-[var(--color-text)]'}`}
        >
          {material.downloadable ? <DownloadCloud size={14} /> : <Download size={14} />}
        </button>
        <button onClick={() => onDelete(material)} className="p-2 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-danger)]">
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  );
}

function UploadSupplementaryForm({ quizId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [studentVisible, setStudentVisible] = useState(false);
  const [downloadable, setDownloadable] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadSupplementaryMaterial(quizId, file, { studentVisible, downloadable: studentVisible && downloadable });
      setFile(null);
      setStudentVisible(false);
      setDownloadable(false);
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload file.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="!p-4 space-y-3">
      <label className="flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-3 cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors">
        <Upload size={15} className="text-[var(--color-text-muted)] shrink-0" />
        <span className="text-sm text-[var(--color-text-muted)] truncate">
          {file ? file.name : 'Add a video, PDF, or image for after the quiz'}
        </span>
        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
      </label>

      {file && (
        <>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer">
              <input type="checkbox" checked={studentVisible} onChange={(e) => setStudentVisible(e.target.checked)} className="accent-[var(--color-accent)]" />
              Visible to students
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer">
              <input type="checkbox" checked={downloadable} disabled={!studentVisible} onChange={(e) => setDownloadable(e.target.checked)} className="accent-[var(--color-accent)] disabled:opacity-30" />
              Allow download
            </label>
          </div>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <Button onClick={handleUpload} disabled={uploading} className="!text-xs w-full">
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </>
      )}
    </Card>
  );
}

export default function MaterialsManager({ quizId }) {
  const [materials, setMaterials] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function refresh() {
    getMaterialsForInstructor(quizId).then(setMaterials).catch(() => setMaterials([]));
  }

  useEffect(() => { refresh(); }, [quizId]);

  async function handleToggle(materialId, patch) {
    await updateMaterialVisibility(materialId, patch);
    refresh();
  }

  async function handleDelete() {
    await deleteMaterial(confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  }

  if (!materials) return <div className="flex justify-center py-8"><Spinner /></div>;

  const source = materials.filter((m) => m.category === 'SOURCE');
  const supplementary = materials.filter((m) => m.category === 'SUPPLEMENTARY');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[var(--font-display)] font-semibold text-sm mb-1">Source material</h3>
        <p className="text-xs text-[var(--color-text-faint)] mb-3">
          What this quiz was generated from. Kept permanently, even if the quiz is archived.
        </p>
        {source.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No source material — this quiz was manually mixed.</p>
        ) : (
          <div className="space-y-2">
            {source.map((m) => (<MaterialRow key={m.id} material={m} onToggle={handleToggle} onDelete={setConfirmDelete} />))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-[var(--font-display)] font-semibold text-sm mb-1">Post-quiz material</h3>
        <p className="text-xs text-[var(--color-text-faint)] mb-3">
          Videos, extra reading, or images students see alongside their results — entirely optional.
        </p>
        {supplementary.length > 0 && (
          <div className="space-y-2 mb-3">
            {supplementary.map((m) => (<MaterialRow key={m.id} material={m} onToggle={handleToggle} onDelete={setConfirmDelete} />))}
          </div>
        )}
        <UploadSupplementaryForm quizId={quizId} onUploaded={refresh} />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.originalFilename}"?`}
          message="This removes it permanently, including from cloud storage. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
