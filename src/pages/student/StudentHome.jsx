import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card, Badge, Spinner, Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getMySessions, startSession } from '../../api/quiz';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

export default function StudentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMySessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  async function handleStart(e) {
    e.preventDefault();
    if (!courseId.trim()) return;
    setStarting(true);
    setError('');
    try {
      const session = await startSession({ courseId: courseId.trim() });
      navigate(`/student/take-quiz/${session.id}`);
    } catch (err) {
      setError('Could not start a quiz for that course.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">
        Welcome, {user?.email?.split('@')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">Take a quiz to test your understanding of course material.</p>

      <Card className="mb-8">
        <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Start a new quiz</h2>
        <form onSubmit={handleStart} className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Input label="Course ID" placeholder="e.g. psych-101" value={courseId} onChange={(e) => setCourseId(e.target.value)} />
          </div>
          <Button type="submit" disabled={starting}>{starting ? 'Starting…' : 'Start quiz'}</Button>
        </form>
        {error && <p className="text-sm text-[var(--color-danger)] mt-3">{error}</p>}
      </Card>

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Recent sessions</h2>

      {sessions === null && <div className="flex justify-center py-8"><Spinner /></div>}
      {sessions && sessions.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No quiz sessions yet — start one above.</p></Card>
      )}

      {sessions && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className="!p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.courseId || s.questionSet?.title || 'Mixed quiz'}</p>
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
