import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, Trophy, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import ReviewQuestionCard from '../../components/ReviewQuestionCard';
import StudyMaterialsCard from '../../components/StudyMaterialsCard';
import { getQuizReport, getSessionReview } from '../../api/quiz';



const POLL_INTERVAL_MS = 2500;
const MIN_LOADER_MS = 4000;

export default function Results() {
  const { sessionId } = useParams();
  const location = useLocation();
  const justSubmitted = Boolean(location.state?.justSubmitted);

  const [report, setReport] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [ready, setReady] = useState(false);
  const [notYetAvailable, setNotYetAvailable] = useState(false);
  const [error, setError] = useState('');
  const startTimeRef = useRef(Date.now());

  function fetchOnce() {
    getQuizReport(sessionId)
      .then((data) => {
        if (data.reportStatus === 'READY') {
          setReport(data);
          setReady(true);
          setNotYetAvailable(false);
        } else {
          setNotYetAvailable(true);
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'Could not load your report.'));
  }

  useEffect(() => {
    if (!justSubmitted) {
      // Revisiting a past result from the list — this was submitted long
      // ago, so the report should already exist. One fetch, no polling,
      // no artificial loader — if it's genuinely not ready (a rare stuck
      // case), show a plain static message instead of implying live work.
      fetchOnce();
      return;
    }

    // Just finished a quiz — the report may genuinely still be generating,
    // so poll briefly and hold a minimum loader time for a clean handoff.
    let cancelled = false;
    let intervalId;

    async function poll() {
      try {
        const data = await getQuizReport(sessionId);
        if (cancelled) return;

        if (data.reportStatus === 'READY') {
          clearInterval(intervalId);
          setReport(data);
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
          setTimeout(() => { if (!cancelled) setReady(true); }, remaining);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load your report.');
      }
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(intervalId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, justSubmitted]);

  useEffect(() => {
    getSessionReview(sessionId).then(setReviews).catch(() => setReviews([]));
  }, [sessionId]);

  if (error) {
    return (<DashboardShell navItems={studentNavItems}><Card variant="elevated" className="!border-[var(--color-danger)]/40"><p className="text-sm text-[var(--color-danger)]">{error}</p></Card></DashboardShell>);
  }

  if (notYetAvailable) {
    return (
      <DashboardShell navItems={studentNavItems}>
        <Card variant="elevated" className="!border-[var(--color-warn)]/40 max-w-md">
          <p className="text-sm font-medium mb-1.5">Report not available yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            This can happen for older sessions. Tap below to try generating it again.
          </p>
          <Button variant="secondary" onClick={fetchOnce}>
            <RefreshCw size={14} /> Check again
          </Button>
        </Card>
      </DashboardShell>
    );
  }

  if (justSubmitted && (!ready || !report)) {
    return (
      <DashboardShell navItems={studentNavItems}>
        <div className="flex flex-col items-center justify-center py-24">
          <Spinner size={32} />
          <p className="text-sm text-[var(--color-text-muted)] mt-4">Analyzing your answers…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!report) {
    return (<DashboardShell navItems={studentNavItems}><div className="flex justify-center py-24"><Spinner /></div></DashboardShell>);
  }

  const pct = Math.round(report.accuracy * 100);

  return (
    <DashboardShell navItems={studentNavItems}>
      <div className="flex items-start justify-between gap-4 mb-1.5">
        <div>
          <p className="text-[var(--color-text-muted)] mb-1">Your report</p>
          <h1 className="font-[var(--font-display)] text-[30px] font-semibold tracking-tight">{report.headline}</h1>
        </div>
        <div className="text-right shrink-0">
          <p className="font-[var(--font-display)] text-[38px] font-semibold leading-none">
            {report.correctCount}<span className="text-lg text-[var(--color-text-muted)]">/{report.totalQuestions}</span>
          </p>
          <p className="text-xs text-[var(--color-text-faint)] mt-1">{pct}% accuracy</p>
        </div>
      </div>

      <StudyMaterialsCard sessionId={sessionId} />

      {report.doingWellConcepts.length > 0 && (
        <div className="mt-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={15} className="text-[var(--color-accent)]" />
            <h2 className="font-[var(--font-display)] font-semibold text-sm">Concepts conquered</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.doingWellConcepts.map((name) => (
              <Badge key={name} tone="accent">{name}</Badge>
            ))}
          </div>
        </div>
      )}

      {report.needsRevisionConcepts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-[var(--color-danger)]" />
            <h2 className="font-[var(--font-display)] font-semibold text-sm">Needs revision</h2>
          </div>
          <div className="space-y-2.5">
            {report.needsRevisionConcepts.map((c) => (
              <Card key={c.conceptGroupId} className="!p-4 !border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5">
                <p className="text-sm font-medium mb-1.5">{c.conceptName}</p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{c.narrative}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {report.guessedConcepts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-[var(--color-warn)]" />
            <h2 className="font-[var(--font-display)] font-semibold text-sm">Likely guessed</h2>
          </div>
          <div className="space-y-2.5">
            {report.guessedConcepts.map((c) => (
              <Card key={c.conceptGroupId} className="!p-4 !border-[var(--color-warn)]/30 bg-[var(--color-warn)]/5">
                <p className="text-sm font-medium mb-1.5">{c.conceptName}</p>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{c.narrative}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">All questions</h2>
      {reviews === null && <div className="flex justify-center py-8"><Spinner size={20} /></div>}
      {reviews && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewQuestionCard key={r.questionId} review={r} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
