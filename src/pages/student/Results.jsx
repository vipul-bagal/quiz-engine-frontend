import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card, Badge, Spinner } from '../../components/ui';
import ConsistencyPulse from '../../components/pulse/ConsistencyPulse';
import { getSessionSummary, getConceptAnalysis } from '../../api/quiz';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'Browse courses', icon: BookOpen },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

const classificationCopy = {
  MASTERED: { label: 'Mastered', tone: 'accent', desc: 'Correct on every variant — consistent understanding.' },
  GUESSED: { label: 'Inconsistent', tone: 'warn', desc: 'Correct on some variants but not others — may indicate guessing rather than true understanding.' },
  NOT_UNDERSTOOD: { label: 'Not understood', tone: 'danger', desc: 'Incorrect on every variant.' },
  INSUFFICIENT_DATA: { label: 'Insufficient data', tone: 'default', desc: 'Only one variant of this concept was answered.' },
};

export default function Results() {
  const { sessionId } = useParams();
  const [summary, setSummary] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSessionSummary(sessionId), getConceptAnalysis(sessionId)])
      .then(([summaryData, analysisData]) => { setSummary(summaryData); setAnalysis(analysisData); })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (<DashboardShell navItems={navItems}><div className="flex justify-center py-20"><Spinner /></div></DashboardShell>);
  }

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Your results</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Accuracy alone doesn't tell you what you actually understood — the breakdown below does.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Accuracy</p>
          <p className="font-[var(--font-display)] text-3xl font-semibold">{Math.round((summary?.accuracy || 0) * 100)}%</p>
          <p className="text-xs text-[var(--color-text-faint)] mt-1">{summary?.correct} of {summary?.totalAttempts} correct</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Concepts mastered</p>
          <p className="font-[var(--font-display)] text-3xl font-semibold text-[var(--color-accent)]">{analysis?.mastered}</p>
          <p className="text-xs text-[var(--color-text-faint)] mt-1">of {analysis?.totalConcepts} total</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Likely guessed</p>
          <p className="font-[var(--font-display)] text-3xl font-semibold text-[var(--color-warn)]">{analysis?.guessed}</p>
          <p className="text-xs text-[var(--color-text-faint)] mt-1">inconsistent across variants</p>
        </Card>
      </div>

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Concept breakdown</h2>

      <div className="space-y-3">
        {analysis?.concepts.map((c) => {
          const copy = classificationCopy[c.classification];
          return (
            <Card key={c.conceptGroupId} className="!p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{c.conceptName}</p>
                    <Badge tone={copy.tone}>{copy.label}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{copy.desc}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-faint)] font-mono">{c.variantsCorrect}/{c.variantsAnswered}</span>
                  <ConsistencyPulse results={c.resultsInOrder} classification={c.classification} width={72} height={28} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}
