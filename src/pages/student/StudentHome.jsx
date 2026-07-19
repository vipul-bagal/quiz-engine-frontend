import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, ArrowRight, Zap } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getMySessions, startSession, getAvailableQuizzes } from '../../api/quiz';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'Browse courses', icon: BookOpen },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

export default function StudentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    getMySessions().then(setSessions).catch(() => setSessions([]));
    getAvailableQuizzes().then(setQuizzes).catch(() => setQuizzes([]));
  }, []);

  async function handleStartQuiz(questionSetId) {
    setStarting(questionSetId);
    try {
      const session = await startSession({ questionSetId });
      navigate(`/student/take-quiz/${session.id}`);
    } finally {
      setStarting(null);
    }
  }

  const priorityQuiz = quizzes?.find((q) => q.priority && !q.completed);
  const otherQuizzes = quizzes?.filter((q) => q !== priorityQuiz && !q.completed) || [];

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">
        Welcome, {user?.email?.split('@')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">Take a quiz to test your understanding of course material.</p>

      {quizzes === null && <div className="flex justify-center py-8"><Spinner /></div>}

      {priorityQuiz && (
        <Card className="mb-6 !border-[var(--color-warn)]/50 !bg-[var(--color-warn)]/6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Zap size={14} className="text-[var(--color-warn)]" />
                <span className="text-xs uppercase tracking-wide text-[var(--color-warn)] font-medium">Take this first</span>
              </div>
              <p className="font-medium text-sm">{priorityQuiz.title}</p>
              <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                {priorityQuiz.courseName} · {priorityQuiz.questionCount} questions
              </p>
            </div>
            <Button disabled={starting === priorityQuiz.questionSetId} onClick={() => handleStartQuiz(priorityQuiz.questionSetId)}>
              {starting === priorityQuiz.questionSetId ? 'Starting…' : 'Start now'}
            </Button>
          </div>
        </Card>
      )}

      {quizzes && otherQuizzes.length > 0 && (
        <>
          <h2 className="font-[var(--font-display)] font-semibold mb-3 text-sm">Available quizzes</h2>
          <div className="space-y-2 mb-8">
            {otherQuizzes.map((q) => (
              <Card key={q.questionSetId} className="!p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">{q.courseName} · {q.questionCount} questions</p>
                </div>
                <Button variant="secondary" className="!py-1.5 !text-xs" disabled={starting === q.questionSetId} onClick={() => handleStartQuiz(q.questionSetId)}>
                  {starting === q.questionSetId ? 'Starting…' : 'Start'}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {quizzes && quizzes.length === 0 && (
        <Card className="mb-8">
          <p className="text-sm text-[var(--color-text-muted)]">
            No quizzes available yet — browse courses and request enrollment to get started.
          </p>
        </Card>
      )}

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Recent sessions</h2>

      {sessions === null && <div className="flex justify-center py-8"><Spinner /></div>}
      {sessions && sessions.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No quiz sessions yet.</p></Card>
      )}

      {sessions && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className="!p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.courseId || 'Quiz session'}</p>
                <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">{new Date(s.startedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={s.completed ? 'accent' : 'warn'}>{s.completed ? 'completed' : 'in progress'}</Badge>
                <button
                  onClick={() => navigate(s.completed ? `/student/results/${s.id}` : `/student/take-quiz/${s.id}`)}
                  className="text-[var(--color-accent)] hover:underline text-sm inline-flex items-center gap-1"
                >
                  {s.completed ? 'View results' : 'Resume'} <ArrowRight size={13} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
