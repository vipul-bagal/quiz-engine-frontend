import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Spinner } from '../../components/ui';
import { getMyAnalytics } from '../../api/analytics';

function StatCard({ label, value, sub }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{label}</p>
      <p className="font-[var(--font-display)] text-3xl font-semibold text-[var(--color-text)]">{value}</p>
      {sub && <p className="text-xs text-[var(--color-text-faint)] mt-1">{sub}</p>}
    </Card>
  );
}

function BreakdownBar({ label, count, max, color }) {
  const pct = max === 0 ? 0 : (count / max) * 100;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--color-text-muted)] font-mono">{label}</span>
        <span className="text-[var(--color-text)] font-mono">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell navGroups={instructorNavGroups}>
        <div className="flex justify-center py-12"><Spinner /></div>
      </DashboardShell>
    );
  }

  if (!data || data.totalQuestions === 0) {
    return (
      <DashboardShell navGroups={instructorNavGroups}>
        <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Analytics</h1>
        <Card className="mt-6"><p className="text-sm text-[var(--color-text-muted)]">No data yet — generate your first quiz to see analytics here.</p></Card>
      </DashboardShell>
    );
  }

  const difficultyColors = { easy: 'var(--color-accent)', medium: 'var(--color-warn)', hard: 'var(--color-danger)' };
  const maxDifficulty = Math.max(...Object.values(data.byDifficulty));
  const maxCourse = Math.max(...Object.values(data.byCourse));

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Analytics</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Aggregate stats across everything you've generated.</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total questions" value={data.totalQuestions} />
        <StatCard label="Distinct concepts" value={data.totalConcepts} />
        <StatCard label="Generation batches" value={data.totalBatches} />
        <StatCard label="Critique yield" value={`${Math.round(data.yieldRate * 100)}%`} sub={`${data.totalGenerated} saved of ${data.totalRequested} requested`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">By difficulty</h2>
          {Object.entries(data.byDifficulty).map(([diff, count]) => (
            <BreakdownBar key={diff} label={diff} count={count} max={maxDifficulty} color={difficultyColors[diff] || 'var(--color-text-muted)'} />
          ))}
        </Card>
        <Card>
          <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">By course</h2>
          {Object.entries(data.byCourse).map(([course, count]) => (
            <BreakdownBar key={course} label={course} count={count} max={maxCourse} color="var(--color-accent)" />
          ))}
        </Card>
      </div>
    </DashboardShell>
  );
}
