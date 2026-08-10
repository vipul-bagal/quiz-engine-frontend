import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, ArrowRight, FileCheck } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Card, Spinner, EmptyState } from '../../components/ui';
import { getMySessions } from '../../api/quiz';



export default function ResultsList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    getMySessions().then((data) => setSessions(data.filter((s) => s.completed))).catch(() => setSessions([]));
  }, []);

  return (
    <DashboardShell navItems={studentNavItems}>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">My results</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Completed quiz sessions and their concept breakdowns.</p>

      {sessions === null && <div className="flex justify-center py-12"><Spinner /></div>}
      {sessions && sessions.length === 0 && (
        <EmptyState icon={BarChart3} title="No completed quizzes yet" description="Finish a quiz to see your concept breakdown here." />
      )}

      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {sessions.map((s) => (
            <Card
              key={s.id}
              variant="interactive"
              className="!p-5 aspect-square flex flex-col justify-between"
              onClick={() => navigate(`/student/results/${s.id}`)}
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/12 flex items-center justify-center mb-3">
                  <FileCheck size={16} className="text-[var(--color-accent)]" />
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-2">{s.courseId || s.questionSet?.title || 'Mixed quiz'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-faint)] font-mono mb-2">{new Date(s.completedAt || s.startedAt).toLocaleDateString()}</p>
                <span className="text-[var(--color-accent)] text-xs inline-flex items-center gap-1 font-medium">
                  View breakdown <ArrowRight size={12} />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
