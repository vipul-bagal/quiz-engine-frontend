import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Check, Loader2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Card, Button, Spinner, EmptyState } from '../../components/ui';
import { getPracticeableQuizzes, startPractice } from '../../api/practice';

export default function Practice() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPracticeableQuizzes().then(setQuizzes).catch(() => setQuizzes([]));
  }, []);

  function toggle(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleStart() {
    if (selectedIds.length === 0) return;
    setStarting(true);
    setError('');
    try {
      const session = await startPractice(selectedIds);
      navigate(`/student/take-quiz/${session.id}`, { state: { justSubmitted: false } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start a practice session.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <DashboardShell navItems={studentNavItems}>
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/12 flex items-center justify-center">
          <Dumbbell size={20} className="text-[var(--color-accent)]" />
        </div>
        <h1 className="font-[var(--font-display)] text-[30px] font-semibold tracking-tight">Practice Mode</h1>
      </div>
      <p className="text-[var(--color-text-muted)] mb-8 max-w-2xl">
        Pick a few quizzes you've already taken. We'll build a short practice session weighted toward the concepts
        you didn't quite get, with at most one question for anything you've already mastered, capped at 30
        questions so it stays quick.
      </p>

      {quizzes === null && <div className="flex justify-center py-12"><Spinner /></div>}

      {quizzes && quizzes.length === 0 && (
        <EmptyState
          icon={Dumbbell}
          title="Nothing to practice yet"
          description="Complete a quiz first, then come back here to reinforce anything you found tricky."
        />
      )}

      {quizzes && quizzes.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-faint)] font-medium mb-3">
            Select quizzes to draw from
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {quizzes.map((q) => {
              const selected = selectedIds.includes(q.questionSetId);
              return (
                <button
                  key={q.questionSetId}
                  onClick={() => toggle(q.questionSetId)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors ${
                    selected
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md shrink-0 border-2 flex items-center justify-center ${
                      selected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
                    }`}
                  >
                    {selected && <Check size={13} strokeWidth={3} className="text-[#0a0f12]" />}
                  </span>
                  <span className="text-sm font-medium truncate">{q.title}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <Card variant="elevated" className="mb-4 !border-[var(--color-danger)]/40">
              <p className="text-sm text-[var(--color-danger)]">{error}</p>
            </Card>
          )}

          <Button onClick={handleStart} disabled={selectedIds.length === 0 || starting}>
            {starting ? (<><Loader2 size={15} className="animate-spin" /> Building your practice session…</>) : 'Start practice'}
          </Button>
        </>
      )}
    </DashboardShell>
  );
}
