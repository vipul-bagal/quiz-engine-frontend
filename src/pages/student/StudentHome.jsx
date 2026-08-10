import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, Zap, Lock, PlayCircle, RotateCcw, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Card, Badge, Spinner, Button, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getMySessions, startSession, getAvailableQuizzes } from '../../api/quiz';
import { requestQuizAccess } from '../../api/questionSets';



/**
 * Portrait square-ish tile — replaces the old horizontal row. Title and
 * meta sit up top, the action button anchors the bottom and is sized to
 * be the clear, easy-to-hit focal point of the card.
 */
function QuizTile({ q, onStart, onResume, onViewResults, onRetake, onRequestAccess, starting, requesting }) {
  const icon = q.status === 'ONGOING' ? RotateCcw : q.status === 'COMPLETED' ? CheckCircle2 : PlayCircle;
  const Icon = icon;
  const iconColor = q.status === 'ONGOING' ? 'var(--color-warn)' : 'var(--color-accent)';

  return (
    <Card variant="interactive" className="!p-5 !cursor-default flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)` }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <p className="text-base font-medium leading-snug mb-1">{q.title}</p>
        {q.description && (
          <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mb-2" title={q.description}>
            {q.description}
          </p>
        )}
        <p className="text-xs text-[var(--color-text-faint)] font-mono">
          {q.courseName} · {q.questionCount} questions
        </p>
      </div>

      <div className="mt-4">
        {!q.hasAccess && (
          <Button variant="secondary" className="w-full" disabled={requesting === q.questionSetId} onClick={() => onRequestAccess(q.questionSetId)}>
            {requesting === q.questionSetId ? 'Requesting…' : 'Request access'}
          </Button>
        )}
        {q.hasAccess && q.status === 'NEW' && (
          <Button variant="secondary" className="w-full" disabled={starting === q.questionSetId} onClick={() => onStart(q.questionSetId)}>
            {starting === q.questionSetId ? 'Starting…' : 'Start quiz'}
          </Button>
        )}
        {q.hasAccess && q.status === 'ONGOING' && (
          <Button className="w-full" onClick={() => onResume(q.sessionId)}>Resume</Button>
        )}
        {q.hasAccess && q.status === 'COMPLETED' && (
          <div className="flex gap-2">
            {q.reportStatus === 'READY' ? (
              <Button variant="secondary" className="flex-1" onClick={() => onViewResults(q.sessionId)}>View results</Button>
            ) : (
              <Button variant="secondary" className="flex-1" onClick={() => onViewResults(q.sessionId)}>
                <Loader2 size={14} className="animate-spin" /> Analyzing
              </Button>
            )}
            <Button variant="ghost" className="!px-3.5" disabled={starting === q.questionSetId} onClick={() => onRetake(q.questionSetId)} title="Retake">
              <RefreshCw size={15} />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function StudentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(null);

  function refreshQuizzes() {
    setError('');
    getAvailableQuizzes()
      .then(setQuizzes)
      .catch((err) => {
        setError(err.response?.data?.error || err.message || 'Could not load your quizzes.');
        setQuizzes([]);
      });
  }

  useEffect(() => { refreshQuizzes(); }, []);

  async function handleStartQuiz(questionSetId) {
    setStarting(questionSetId);
    try {
      const session = await startSession({ questionSetId });
      navigate(`/student/take-quiz/${session.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not start this quiz.');
    } finally {
      setStarting(null);
    }
  }

  function handleResume(sessionId) {
    navigate(`/student/take-quiz/${sessionId}`);
  }

  function handleViewResults(sessionId) {
    navigate(`/student/results/${sessionId}`);
  }

  async function handleRequestAccess(questionSetId) {
    setRequestingAccess(questionSetId);
    try {
      await requestQuizAccess(questionSetId);
      refreshQuizzes();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not request access.');
    } finally {
      setRequestingAccess(null);
    }
  }

  const ongoing = quizzes?.filter((q) => q.hasAccess && q.status === 'ONGOING') || [];
  const priorityNew = quizzes?.find((q) => q.hasAccess && q.status === 'NEW' && q.priority);
  const newQuizzes = (quizzes?.filter((q) => q.hasAccess && q.status === 'NEW') || []).filter((q) => q !== priorityNew);
  const completed = quizzes?.filter((q) => q.hasAccess && q.status === 'COMPLETED') || [];
  const locked = quizzes?.filter((q) => !q.hasAccess) || [];

  const tileProps = { onResume: handleResume, onStart: handleStartQuiz, onViewResults: handleViewResults, onRetake: handleStartQuiz, onRequestAccess: handleRequestAccess, starting, requesting: requestingAccess };

  return (
    <DashboardShell navItems={studentNavItems}>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">
        Welcome, {user?.firstName || user?.fullName?.split(' ')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">Quizzes from every course you're enrolled in.</p>

      {quizzes === null && !error && <div className="flex justify-center py-8"><Spinner /></div>}

      {error && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)] mb-1 font-medium">Couldn't load your quizzes</p>
          <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
        </Card>
      )}

      {priorityNew && (
        <Card
          variant="elevated"
          className="mb-8 !border-[var(--color-warn)]/40 bg-gradient-to-br from-[var(--color-warn-glow)] to-transparent"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-[var(--color-warn)]" />
                <span className="text-[11px] uppercase tracking-wider text-[var(--color-warn)] font-semibold">Take this first</span>
              </div>
              <p className="font-medium text-[19px]">{priorityNew.title}</p>
              <p className="text-xs text-[var(--color-text-faint)] font-mono mt-1" title={priorityNew.instructorEmail}>
                {priorityNew.courseName} · by {priorityNew.instructorName} · {priorityNew.questionCount} questions
              </p>
            </div>
            <Button disabled={starting === priorityNew.questionSetId} onClick={() => handleStartQuiz(priorityNew.questionSetId)}>
              {starting === priorityNew.questionSetId ? 'Starting…' : 'Start now'}
            </Button>
          </div>
        </Card>
      )}

      {ongoing.length > 0 && (
        <>
          <h2 className="font-[var(--font-display)] font-semibold mb-3 text-base flex items-center gap-1.5">
            <RotateCcw size={15} className="text-[var(--color-warn)]" /> Ongoing
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {ongoing.map((q) => (<QuizTile key={q.questionSetId} q={q} {...tileProps} />))}
          </div>
        </>
      )}

      {newQuizzes.length > 0 && (
        <>
          <h2 className="font-[var(--font-display)] font-semibold mb-3 text-base">New</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {newQuizzes.map((q) => (<QuizTile key={q.questionSetId} q={q} {...tileProps} />))}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <h2 className="font-[var(--font-display)] font-semibold mb-3 text-base flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-[var(--color-accent)]" /> Past quizzes
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {completed.map((q) => (<QuizTile key={q.questionSetId} q={q} {...tileProps} />))}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <h2 className="font-[var(--font-display)] font-semibold mb-3 text-base flex items-center gap-1.5">
            <Lock size={15} /> Restricted quizzes
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {locked.map((q) => (<QuizTile key={q.questionSetId} q={q} {...tileProps} />))}
          </div>
        </>
      )}

      {quizzes && quizzes.length === 0 && !error && (
        <EmptyState
          icon={BookOpen}
          title="No quizzes yet"
          description="This can mean: your instructor hasn't published a quiz for your course yet, your course enrollment is still pending approval, or you're not yet enrolled in any course."
          action={
            <Button variant="secondary" className="!text-xs" onClick={() => navigate('/student/courses')}>
              Browse courses
            </Button>
          }
        />
      )}
    </DashboardShell>
  );
}
