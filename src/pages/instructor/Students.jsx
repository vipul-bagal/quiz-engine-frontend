import { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner } from '../../components/ui';
import { getMyStudents } from '../../api/analytics';

export default function Students() {
  const [students, setStudents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Students</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Everyone who has taken a quiz on your content.</p>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!loading && students && students.length === 0 && (
        <Card>
          <div className="flex flex-col items-center text-center py-6">
            <Users2 size={28} className="text-[var(--color-text-faint)] mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">No student activity yet.</p>
          </div>
        </Card>
      )}

      {!loading && students && students.length > 0 && (
        <div className="space-y-2.5">
          {students.map((s) => (
            <Card key={s.userId} className="!p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.email}</p>
                <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                  {s.completedSessions}/{s.totalSessions} sessions completed · {s.totalAttempts} questions answered
                </p>
              </div>
              <Badge tone={s.accuracy >= 0.7 ? 'accent' : s.accuracy >= 0.4 ? 'warn' : 'danger'}>
                {Math.round(s.accuracy * 100)}% accuracy
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
