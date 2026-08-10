import { useEffect, useState } from 'react';
import { Compass, UserPlus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { browseAllCourses, requestCourseEditAccess } from '../../api/courses';
import { browseAllQuestionSets, requestQuizEditAccess } from '../../api/questionSets';

const accessConfig = {
  OWNER: { label: 'You own this', tone: 'accent' },
  APPROVED: { label: 'Editor access', tone: 'accent' },
  PENDING: { label: 'Request pending', tone: 'warn' },
  REJECTED: { label: 'Request declined', tone: 'danger' },
  NONE: { label: null, tone: 'default' },
};

export default function BrowseAll() {
  const [tab, setTab] = useState('quizzes');
  const [courses, setCourses] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [requesting, setRequesting] = useState(null);

  function refreshCourses() {
    browseAllCourses().then(setCourses).catch(() => setCourses([]));
  }
  function refreshQuizzes() {
    browseAllQuestionSets().then(setQuizzes).catch(() => setQuizzes([]));
  }

  useEffect(() => { refreshCourses(); refreshQuizzes(); }, []);

  async function handleRequestCourseAccess(courseId) {
    setRequesting(courseId);
    try {
      await requestCourseEditAccess(courseId);
      refreshCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not send request.');
    } finally {
      setRequesting(null);
    }
  }

  async function handleRequestQuizAccess(quizId) {
    setRequesting(quizId);
    try {
      await requestQuizEditAccess(quizId);
      refreshQuizzes();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not send request.');
    } finally {
      setRequesting(null);
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <div className="flex items-center gap-2 mb-1.5">
        <Compass size={20} className="text-[var(--color-accent)]" />
        <h1 className="font-[var(--font-display)] text-2xl font-semibold">Browse all</h1>
      </div>
      <p className="text-[var(--color-text-muted)] mb-6">
        Everything created by every instructor. You can view, but editing requires an approved request from the owner.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('quizzes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'quizzes' ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
        >
          Quizzes
        </button>
        <button
          onClick={() => setTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'courses' ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}
        >
          Courses
        </button>
      </div>

      {tab === 'quizzes' && (
        <>
          {quizzes === null && <div className="flex justify-center py-12"><Spinner /></div>}
          {quizzes && quizzes.length === 0 && <Card><p className="text-sm text-[var(--color-text-muted)]">No quizzes exist yet.</p></Card>}
          {quizzes && quizzes.length > 0 && (
            <div className="space-y-2.5">
              {quizzes.map((q) => {
                const access = accessConfig[q.myEditAccessStatus] || accessConfig.NONE;
                const canRequest = q.myEditAccessStatus === 'NONE' || q.myEditAccessStatus === 'REJECTED';
                return (
                  <Card key={q.id} className="!p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium truncate">{q.title}</p>
                        {access.label && <Badge tone={access.tone}>{access.label}</Badge>}
                        <Badge tone={q.publishStatus === 'PUBLISHED' ? 'accent' : 'default'}>
                          {q.publishStatus === 'PUBLISHED' ? 'published' : 'draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-faint)] font-mono" title={q.creatorEmail}>
                        by {q.creatorName} · {q.questionCount} questions · {q.courseNames?.join(', ') || 'standalone quiz'}
                      </p>
                    </div>
                    {canRequest && (
                      <Button
                        variant="secondary"
                        className="!py-1.5 !text-xs shrink-0"
                        disabled={requesting === q.id}
                        onClick={() => handleRequestQuizAccess(q.id)}
                      >
                        <UserPlus size={13} /> Request edit access
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'courses' && (
        <>
          {courses === null && <div className="flex justify-center py-12"><Spinner /></div>}
          {courses && courses.length === 0 && <Card><p className="text-sm text-[var(--color-text-muted)]">No courses exist yet.</p></Card>}
          {courses && courses.length > 0 && (
            <div className="space-y-2.5">
              {courses.map((c) => {
                const access = accessConfig[c.myEditAccessStatus] || accessConfig.NONE;
                const canRequest = c.myEditAccessStatus === 'NONE' || c.myEditAccessStatus === 'REJECTED';
                return (
                  <Card key={c.id} className="!p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        {access.label && <Badge tone={access.tone}>{access.label}</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-text-faint)] font-mono" title={c.creatorEmail}>
                        by {c.creatorName} · {c.approvedStudentCount} enrolled
                      </p>
                    </div>
                    {canRequest && (
                      <Button
                        variant="secondary"
                        className="!py-1.5 !text-xs shrink-0"
                        disabled={requesting === c.id}
                        onClick={() => handleRequestCourseAccess(c.id)}
                      >
                        <UserPlus size={13} /> Request edit access
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
