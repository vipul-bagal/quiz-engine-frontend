import { useEffect, useState } from 'react';
import { BarChart3, ArrowLeft } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Spinner, StatCard, EmptyState, Badge } from '../../components/ui';
import { getQuizAnalytics } from '../../api/analytics';
import { getMyQuestionSets } from '../../api/questionSets';

function BreakdownBar({ label, count, max, color }) {
  const pct = max === 0 ? 0 : (count / max) * 100;
  return (
    <div className="mb-3.5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[var(--color-text-muted)] font-mono">{label}</span>
        <span className="text-[var(--color-text)] font-mono font-medium">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-surface-overlay)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-[var(--ease-out)]" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [sets, setSets] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyQuestionSets({ page: 0, size: 100 }).then((d) => setSets(d.content)).catch(() => setSets([]));
  }, []);

  function selectQuiz(id) {
    setSelectedId(id);
    setData(null);
    setError('');
    setLoading(true);
    getQuizAnalytics(id)
      .then(setData)
      .catch(() => setError('Could not load analytics for this quiz.'))
      .finally(() => setLoading(false));
  }

  if (!selectedId) {
    return (
      <DashboardShell navGroups={instructorNavGroups}>
        <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">Analytics</h1>
        <p className="text-[var(--color-text-muted)] mb-6">Select a quiz to see how students performed on it.</p>

        {sets === null && <div className="flex justify-center py-12"><Spinner /></div>}
        {sets && sets.length === 0 && (
          <EmptyState icon={BarChart3} title="No quizzes yet" description="Generate or mix a quiz to see analytics here." />
        )}
        {sets && sets.length > 0 && (
          <div className="space-y-2">
            {sets.map((s) => (
              <Card key={s.id} variant="interactive" className="!p-4 flex items-center justify-between" onClick={() => selectQuiz(s.id)}>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">{s.questionCount} questions</p>
                </div>
                <Badge tone={s.publishStatus === 'PUBLISHED' ? 'accent' : 'default'}>{s.publishStatus === 'PUBLISHED' ? 'published' : 'draft'}</Badge>
              </Card>
            ))}
          </div>
        )}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <button onClick={() => setSelectedId(null)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={13} /> All quizzes
      </button>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {error && (
        <Card variant="elevated" className="!border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      )}

      {!loading && data && (
        <>
          <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-6 tracking-tight">{data.quizTitle}</h1>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Students attempted" value={data.totalStudentsAttempted} />
            <StatCard label="Average accuracy" value={`${Math.round(data.avgAccuracy * 100)}%`} tone="accent" />
            <StatCard label="Concepts tracked" value={data.concepts.length} />
          </div>

          {Object.keys(data.byDifficulty).length > 0 && (
            <Card variant="elevated" className="mb-6">
              <h2 className="font-[var(--font-display)] font-semibold mb-5 text-sm">By difficulty</h2>
              {Object.entries(data.byDifficulty).map(([diff, count]) => (
                <BreakdownBar
                  key={diff}
                  label={diff}
                  count={count}
                  max={Math.max(...Object.values(data.byDifficulty))}
                  color={diff === 'easy' ? 'var(--color-accent)' : diff === 'medium' ? 'var(--color-warn)' : 'var(--color-danger)'}
                />
              ))}
            </Card>
          )}

          <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Concept performance</h2>
          {data.concepts.length === 0 ? (
            <Card><p className="text-sm text-[var(--color-text-muted)]">No student attempts yet.</p></Card>
          ) : (
            <div className="space-y-2.5">
              {data.concepts.map((c) => (
                <Card key={c.conceptGroupId} variant="interactive" className="!p-4 !cursor-default">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.conceptName}</p>
                      <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                        {c.studentsAnswered} student{c.studentsAnswered === 1 ? '' : 's'} answered
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.mastered > 0 && <Badge tone="accent">{c.mastered} mastered</Badge>}
                      {c.guessed > 0 && <Badge tone="warn">{c.guessed} guessed</Badge>}
                      {c.notUnderstood > 0 && <Badge tone="danger">{c.notUnderstood} not understood</Badge>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
