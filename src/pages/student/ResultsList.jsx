import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card, Spinner } from '../../components/ui';
import { getMySessions } from '../../api/quiz';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

export default function ResultsList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    getMySessions().then((data) => setSessions(data.filter((s) => s.completed))).catch(() => setSessions([]));
  }, []);

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">My results</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Completed quiz sessions and their concept breakdowns.</p>

      {sessions === null && <div className="flex justify-center py-12"><Spinner /></div>}
      {sessions && sessions.length === 0 && <Card><p className="text-sm text-[var(--color-text-muted)]">No completed quizzes yet.</p></Card>}

      {sessions && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Card key={s.id} className="!p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.courseId || s.questionSet?.title || 'Mixed quiz'}</p>
                <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">{new Date(s.completedAt || s.startedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => navigate(`/student/results/${s.id}`)} className="text-[var(--color-accent)] hover:underline text-sm inline-flex items-center gap-1">
                View breakdown <ArrowRight size={13} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
