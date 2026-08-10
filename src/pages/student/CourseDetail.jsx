import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, ArrowLeft, PlayCircle, RotateCcw, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Card, Badge, Spinner, Button, EmptyState } from '../../components/ui';
import { getQuizzesForCourse, requestQuizAccess } from '../../api/questionSets';
import { startSession } from '../../api/quiz';



const statusMeta = {
  NEW: { label: 'Not started', tone: 'default', icon: PlayCircle },
  ONGOING: { label: 'In progress', tone: 'warn', icon: RotateCcw },
  COMPLETED: { label: 'Completed', tone: 'accent', icon: CheckCircle2 },
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(null);
  const [requesting, setRequesting] = useState(null);

  function refresh() {
    setError('');
    getQuizzesForCourse(courseId)
      .then(setQuizzes)
      .catch((err) => setError(err.response?.data?.error || err.message || 'Could not load quizzes for this course.'));
  }

  useEffect(() => { refresh(); }, [courseId]);

  async function handleStart(questionSetId) {
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

  async function handleRequestAccess(questionSetId) {
    setRequesting(questionSetId);
    try {
      await requestQuizAccess(questionSetId);
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not request access.');
    } finally {
      setRequesting(null);
    }
  }

  return (
    <DashboardShell navItems={studentNavItems}>
      <button onClick={() => navigate('/student/courses')} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={13} /> Back to courses
      </button>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">
        {quizzes && quizzes.length > 0 ? quizzes[0].courseName : 'Course quizzes'}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-6">Every published quiz in this course.</p>

      {error && (
        <Card variant="elevated" className="!border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)] mb-1 font-medium">Couldn't load quizzes</p>
          <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
        </Card>
      )}

      {!error && quizzes === null && <div className="flex justify-center py-12"><Spinner /></div>}

      {!error && quizzes && quizzes.length === 0 && (
        <EmptyState icon={BookOpen} title="No quizzes yet" description="Your instructor hasn't published any quizzes for this course yet." />
      )}

      {!error && quizzes && quizzes.length > 0 && (
        <div className="space-y-3">
          {quizzes.map((q) => {
            const meta = statusMeta[q.status];
            const Icon = meta.icon;
            return (
              <Card key={q.questionSetId} variant="interactive" className="!p-5 !cursor-default">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-[17px]">{q.title}</p>
                      {q.priority && <Badge tone="warn">priority</Badge>}
                    </div>
                    {q.description && <p className="text-xs text-[var(--color-text-muted)] mb-2 leading-relaxed">{q.description}</p>}
                    <p className="text-xs text-[var(--color-text-faint)] font-mono" title={q.instructorEmail}>by {q.instructorName} · {q.questionCount} questions</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {q.hasAccess && (
                      <Badge tone={meta.tone}><Icon size={11} className="inline mr-1" />{meta.label}</Badge>
                    )}
                    {!q.hasAccess && (
                      <Button variant="secondary" className="!py-1.5 !text-xs" disabled={requesting === q.questionSetId} onClick={() => handleRequestAccess(q.questionSetId)}>
                        {requesting === q.questionSetId ? 'Requesting…' : 'Request access'}
                      </Button>
                    )}
                    {q.hasAccess && q.status === 'NEW' && (
                      <Button className="!py-1.5 !text-xs" disabled={starting === q.questionSetId} onClick={() => handleStart(q.questionSetId)}>
                        {starting === q.questionSetId ? 'Starting…' : 'Take quiz'}
                      </Button>
                    )}
                    {q.hasAccess && q.status === 'ONGOING' && (
                      <Button className="!py-1.5 !text-xs" onClick={() => navigate(`/student/take-quiz/${q.sessionId}`)}>Resume</Button>
                    )}
                    {q.hasAccess && q.status === 'COMPLETED' && (
                      <div className="flex items-center gap-1.5">
                        <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => navigate(`/student/results/${q.sessionId}`)}>
                          {q.reportStatus === 'READY' ? 'Results' : (<><Loader2 size={12} className="animate-spin" /> Analyzing</>)}
                        </Button>
                        <Button variant="ghost" className="!py-1.5 !text-xs" disabled={starting === q.questionSetId} onClick={() => handleStart(q.questionSetId)}>
                          <RefreshCw size={12} /> Retake
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
