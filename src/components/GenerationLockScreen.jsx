import { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { cancelGenerationJob } from '../api/questions';
import { ConfirmDialog } from './ui';

/**
 * Just the visual — no polling logic — so it can be reused both by
 * GenerationLockGate (wraps smaller pages) and directly via useGenerationLock
 * for an early-return pattern (used on pages too large/complex to safely
 * wrap their entire existing render body).
 */
export default function GenerationLockScreen({ activeJob, courses, onCancelled }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const courseName = courses?.find((c) => c.id === activeJob.courseId)?.name || 'your course';

  async function handleCancel() {
    setCancelling(true);
    setError('');
    try {
      await cancelGenerationJob(activeJob.id);
      setShowConfirm(false);
      onCancelled?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel this job.');
      setShowConfirm(false);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <Loader2 size={28} className="text-[var(--color-accent)] animate-spin mb-5" />
      <p className="text-base font-medium mb-1.5 max-w-md">
        The quiz "{activeJob.courseContext}" in the course "{courseName}" is being generated.
      </p>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">Meanwhile, you can explore other sections.</p>

      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs text-[var(--color-text-faint)] hover:text-[var(--color-danger)] inline-flex items-center gap-1.5"
      >
        <XCircle size={13} /> This looks stuck — stop it
      </button>
      {error && <p className="text-xs text-[var(--color-danger)] mt-2">{error}</p>}

      {showConfirm && (
        <ConfirmDialog
          title="Stop this generation job?"
          message="Only do this if it's genuinely stuck — for example, after a server restart. If it's still actually running, stopping it won't affect any cost already spent, but you'll lose this specific run's progress."
          confirmLabel={cancelling ? 'Stopping…' : 'Stop it'}
          onConfirm={handleCancel}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
