import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, X, AlertTriangle, Upload, FileStack, Lightbulb, ListChecks } from 'lucide-react';
import { getActiveGenerationJobs, getGenerationJob, reattachGenerationMaterials, cancelGenerationJob } from '../api/questions';
import { getMyCourses } from '../api/courses';
import { Button, Modal, Card, ConfirmDialog } from './ui';

const POLL_INTERVAL_MS = 3000;
const SUMMARY_SHOWN_KEY = 'summary_shown_for_job';

function ReattachMaterialsModal({ job, onClose, onDone }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (files.length === 0) { setError('Select the same files originally uploaded for this quiz.'); return; }
    setUploading(true);
    setError('');
    try {
      await reattachGenerationMaterials(job.id, files);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not attach these files — make sure the filenames match exactly what you originally uploaded.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-1">Re-upload study material</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Your quiz and questions generated successfully, but saving the source files failed. Re-upload the
        exact same file(s) — same filenames — and we'll attach them properly.
      </p>
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--color-accent)]/12 file:text-[var(--color-accent)] file:text-xs file:font-medium mb-4"
      />
      {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>I'll do this later</Button>
        <Button onClick={handleSubmit} disabled={uploading}>{uploading ? 'Uploading…' : 'Attach files'}</Button>
      </div>
    </Modal>
  );
}

function SummaryModal({ job, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/12 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} className="text-[var(--color-accent)]" />
        </div>
        <h3 className="font-[var(--font-display)] font-semibold text-lg mb-4">Generation complete</h3>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[var(--color-text-faint)] mb-1"><FileStack size={13} /></div>
            <p className="font-[var(--font-display)] text-xl font-semibold">{job.resultTotalDocuments}</p>
            <p className="text-xs text-[var(--color-text-faint)]">document{job.resultTotalDocuments === 1 ? '' : 's'}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[var(--color-text-faint)] mb-1"><Lightbulb size={13} /></div>
            <p className="font-[var(--font-display)] text-xl font-semibold">{job.resultUniqueConcepts}</p>
            <p className="text-xs text-[var(--color-text-faint)]">unique concepts</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[var(--color-text-faint)] mb-1"><ListChecks size={13} /></div>
            <p className="font-[var(--font-display)] text-xl font-semibold">{job.resultGeneratedCount}/{job.totalQuestionsRequested}</p>
            <p className="text-xs text-[var(--color-text-faint)]">questions</p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-5">
          We picked {Math.min(job.resultGeneratedCount, job.totalQuestionsRequested)} of these for the quiz by default, including every
          picture question. Review and adjust exactly which ones are included from the quiz page.
        </p>
        <Button onClick={onClose} className="w-full">Got it</Button>
      </div>
    </Modal>
  );
}

export default function GenerationStatusBanner() {
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState(null);
  const [justFinished, setJustFinished] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [showReattach, setShowReattach] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [courses, setCourses] = useState(null);
  const trackedJobId = useRef(null);

  useEffect(() => {
    getMyCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    async function poll() {
      try {
        const jobs = await getActiveGenerationJobs();
        if (cancelled) return;

        if (jobs.length > 0) {
          setActiveJob(jobs[0]);
          trackedJobId.current = jobs[0].id;
          setDismissed(false);
          setJustFinished(null);
        } else if (trackedJobId.current) {
          const finished = await getGenerationJob(trackedJobId.current);
          if (!cancelled) {
            setActiveJob(null);
            setJustFinished(finished);
            trackedJobId.current = null;

            if (finished.status === 'COMPLETED' && sessionStorage.getItem(SUMMARY_SHOWN_KEY) !== finished.id) {
              sessionStorage.setItem(SUMMARY_SHOWN_KEY, finished.id);
              setShowSummary(true);
            }
            if (finished.status !== 'COMPLETED' || finished.materialsAttached) {
              setTimeout(() => setJustFinished(null), 8000);
            }
          }
        }
      } catch {
        // Background convenience banner — fail silently.
      }
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, []);

  const job = activeJob || justFinished;

  async function handleCancel() {
    if (!job) return;
    setCancelling(true);
    try {
      await cancelGenerationJob(job.id);
      setActiveJob(null);
      setJustFinished(null);
      trackedJobId.current = null;
      setShowCancelConfirm(false);
    } catch {
      // If cancelling failed (e.g. it already finished naturally in the
      // meantime), the next poll will reconcile the real state anyway.
      setShowCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  }

  if (dismissed || !job) return null;

  const isActive = job.status === 'PENDING' || job.status === 'IN_PROGRESS';
  const isCompleted = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';
  const needsReattach = isCompleted && !job.materialsAttached;
  const courseName = courses?.find((c) => c.id === job.courseId)?.name || 'your course';

  return (
    <>
      <div
        className={`mb-6 rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
          isActive
            ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/6'
            : needsReattach
            ? 'border-[var(--color-warn)]/30 bg-[var(--color-warn)]/6'
            : isCompleted
            ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/6'
            : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/6'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isActive && <Loader2 size={16} className="text-[var(--color-accent)] animate-spin shrink-0" />}
          {needsReattach && <AlertTriangle size={16} className="text-[var(--color-warn)] shrink-0" />}
          {isCompleted && !needsReattach && <CheckCircle2 size={16} className="text-[var(--color-accent)] shrink-0" />}
          {isFailed && <XCircle size={16} className="text-[var(--color-danger)] shrink-0" />}

          <div className="min-w-0">
            {isActive && (
              <p className="text-sm text-[var(--color-text)] truncate">
                The quiz "{job.courseContext}" in the course "{courseName}" is being generated.
                <span className="text-[var(--color-text-faint)]"> Meanwhile, you can explore other sections.</span>
              </p>
            )}
            {needsReattach && (
              <p className="text-sm text-[var(--color-text)]">
                Quiz ready ({job.resultGeneratedCount} questions), but the source files didn't save.
                <span className="text-[var(--color-text-faint)]"> Re-upload them to keep the material with this quiz.</span>
              </p>
            )}
            {isCompleted && !needsReattach && (
              <p className="text-sm text-[var(--color-text)]">
                Quiz ready — {job.resultGeneratedCount} question{job.resultGeneratedCount === 1 ? '' : 's'} saved as a draft.
              </p>
            )}
            {isFailed && (
              <p className="text-sm text-[var(--color-text)]">
                Generation failed: <span className="text-[var(--color-text-muted)]">{job.errorMessage || 'unknown error'}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isActive && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs text-[var(--color-text-faint)] hover:text-[var(--color-danger)]"
            >
              Stuck? Stop it
            </button>
          )}
          {needsReattach && (
            <button
              onClick={() => setShowReattach(true)}
              className="text-xs font-medium text-[var(--color-warn)] hover:underline inline-flex items-center gap-1"
            >
              <Upload size={12} /> Re-upload
            </button>
          )}
          {job.resultQuestionSetId && (
            <button
              onClick={() => navigate(`/instructor/quiz/${job.resultQuestionSetId}`)}
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              {isCompleted ? 'View quiz' : 'View what was saved'}
            </button>
          )}
          {!isActive && !needsReattach && (
            <button onClick={() => setDismissed(true)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {showReattach && (
        <ReattachMaterialsModal
          job={job}
          onClose={() => setShowReattach(false)}
          onDone={() => { setShowReattach(false); setJustFinished({ ...job, materialsAttached: true }); }}
        />
      )}

      {showSummary && <SummaryModal job={job} onClose={() => setShowSummary(false)} />}

      {showCancelConfirm && (
        <ConfirmDialog
          title="Stop this generation job?"
          message="Only do this if it's genuinely stuck — for example, after a server restart. If it's still actually running, stopping it won't affect any cost already spent, but you'll lose this specific run's progress."
          confirmLabel={cancelling ? 'Stopping…' : 'Stop it'}
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  );
}
