import { useEffect, useState } from 'react';
import { LayoutDashboard, BarChart3, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { getAvailableCourses, requestEnrollment } from '../../api/courses';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'Browse courses', icon: BookOpen },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

const statusConfig = {
  NOT_ENROLLED: { label: null, tone: 'default' },
  PENDING: { label: 'Request pending', tone: 'warn' },
  APPROVED: { label: 'Enrolled', tone: 'accent' },
  REJECTED: { label: 'Request declined', tone: 'danger' },
};

export default function BrowseCourses() {
  const [courses, setCourses] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [notice, setNotice] = useState(null);

  function refresh() {
    getAvailableCourses().then(setCourses).catch(() => setCourses([]));
  }

  useEffect(() => { refresh(); }, []);

  async function handleEnroll(courseId) {
    setRequesting(courseId);
    try {
      const result = await requestEnrollment(courseId);
      setNotice(result.message);
      refresh();
    } catch (err) {
      setNotice(err.response?.data?.error || 'Could not send enrollment request.');
    } finally {
      setRequesting(null);
    }
  }

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Browse courses</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Request to join a course — your instructor needs to approve before you get access.</p>

      {notice && (
        <Card className="mb-6 !border-[var(--color-accent)]/40">
          <p className="text-sm text-[var(--color-accent)]">{notice}</p>
        </Card>
      )}

      {courses === null && <div className="flex justify-center py-12"><Spinner /></div>}

      {courses && courses.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No courses available yet.</p></Card>
      )}

      {courses && courses.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {courses.map((c) => {
            const status = statusConfig[c.enrollmentStatus];
            return (
              <Card key={c.id} className="!p-5">
                <p className="font-medium text-sm mb-1">{c.name}</p>
                {c.description && <p className="text-xs text-[var(--color-text-muted)] mb-3">{c.description}</p>}

                {c.enrollmentStatus === 'NOT_ENROLLED' && (
                  <Button
                    variant="secondary"
                    className="!py-2 !text-xs"
                    disabled={requesting === c.id}
                    onClick={() => handleEnroll(c.id)}
                  >
                    {requesting === c.id ? 'Requesting…' : 'Enroll'}
                  </Button>
                )}

                {c.enrollmentStatus === 'PENDING' && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-warn)]">
                    <Clock size={13} /> Awaiting instructor approval
                  </div>
                )}

                {c.enrollmentStatus === 'APPROVED' && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-accent)]">
                    <CheckCircle2 size={13} /> Enrolled — quizzes available on your dashboard
                  </div>
                )}

                {c.enrollmentStatus === 'REJECTED' && (
                  <Badge tone="danger">Request declined</Badge>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
