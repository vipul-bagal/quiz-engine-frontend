import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, Clock, CheckCircle2, Globe, Lock } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Card, Badge, Spinner, Button, EmptyState } from '../../components/ui';
import { getAvailableCourses, requestEnrollment } from '../../api/courses';



const statusConfig = {
  NOT_ENROLLED: { label: null, tone: 'default' },
  PENDING: { label: 'Request pending', tone: 'warn' },
  APPROVED: { label: 'Enrolled', tone: 'accent' },
  REJECTED: { label: 'Request declined', tone: 'danger' },
};

function CourseCard({ c, navigate, requesting, onEnroll }) {
  const status = statusConfig[c.enrollmentStatus];
  return (
    <Card
      variant="interactive"
      className="!p-5"
      onClick={() => c.enrollmentStatus === 'APPROVED' && navigate(`/student/courses/${c.id}`)}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <p className="font-medium text-[17px]">{c.name}</p>
        {c.visibility === 'PUBLIC' ? (
          <Badge tone="accent"><Globe size={10} className="inline mr-1" />public</Badge>
        ) : (
          <Badge><Lock size={10} className="inline mr-1" />private</Badge>
        )}
      </div>
      {c.description && <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">{c.description}</p>}

      {c.enrollmentStatus === 'NOT_ENROLLED' && (
        <Button
          variant="secondary"
          className="!py-2 !text-xs"
          disabled={requesting === c.id}
          onClick={(e) => { e.stopPropagation(); onEnroll(c.id); }}
        >
          {requesting === c.id ? 'Requesting…' : c.visibility === 'PUBLIC' ? 'Enroll' : 'Request to enroll'}
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
}

export default function BrowseCourses() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('mine'); // 'mine' | 'all'
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

  const myCourses = courses?.filter((c) => c.enrollmentStatus === 'APPROVED') || [];
  const otherCourses = courses?.filter((c) => c.enrollmentStatus !== 'APPROVED') || [];
  const visibleCourses = tab === 'mine' ? myCourses : (courses || []);

  return (
    <DashboardShell navItems={studentNavItems}>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">Courses</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Public courses enroll you instantly. Private courses need instructor approval.
      </p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('mine')} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${tab === 'mine' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
          My courses{myCourses.length > 0 ? ` (${myCourses.length})` : ''}
        </button>
        <button onClick={() => setTab('all')} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${tab === 'all' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
          All courses
        </button>
      </div>

      {notice && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-accent)]/40">
          <p className="text-sm text-[var(--color-accent)]">{notice}</p>
        </Card>
      )}

      {courses === null && <div className="flex justify-center py-12"><Spinner /></div>}

      {courses && tab === 'mine' && myCourses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Not enrolled in any course yet"
          description="Switch to All Courses to find something to join."
          action={<Button variant="secondary" className="!text-xs" onClick={() => setTab('all')}>Browse all courses</Button>}
        />
      )}

      {courses && tab === 'all' && courses.length === 0 && (
        <EmptyState icon={BookOpen} title="No courses available yet" description="Check back once your instructors publish courses." />
      )}

      {courses && visibleCourses.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {visibleCourses.map((c) => (
            <CourseCard key={c.id} c={c} navigate={navigate} requesting={requesting} onEnroll={handleEnroll} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
