import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, Shuffle, Users2, BookOpen, Circle, ShieldCheck, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner, Button, StatCard, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getOverview } from '../../api/analytics';
import { getMyQuestionSets } from '../../api/questionSets';
import { getApprovalsSummary } from '../../api/approvals';

function pendingCount(summary) {
  if (!summary) return 0;
  return (summary.courseEnrollments?.length || 0)
    + (summary.courseEditorRequests?.length || 0)
    + (summary.quizEditorRequests?.length || 0)
    + (summary.quizAccessRequests?.length || 0);
}

function labelFor(item) {
  switch (item.type) {
    case 'COURSE_ENROLLMENT': return `${item.studentName} wants to enrol in ${item.courseName}`;
    case 'COURSE_EDITOR': return `${item.instructorName} wants edit access to ${item.courseName}`;
    case 'QUIZ_EDITOR': return `${item.instructorName} wants edit access to ${item.quizTitle}`;
    case 'QUIZ_ACCESS': return `${item.studentName} wants access to ${item.quizTitle}`;
    default: return '';
  }
}

export default function InstructorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentQuizzes, setRecentQuizzes] = useState(null);
  const [approvals, setApprovals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview().catch(() => null),
      getMyQuestionSets({ page: 0, size: 10 }).catch(() => ({ content: [] })),
      getApprovalsSummary().catch(() => null),
    ]).then(([o, sets, a]) => {
      setOverview(o);
      setRecentQuizzes(sets.content);
      setApprovals(a);
      setLoading(false);
    });
  }, []);

  const hasContent = overview && overview.totalQuizzes > 0;
  const totalPending = pendingCount(approvals);

  const allPendingItems = approvals ? [
    ...(approvals.courseEnrollments || []),
    ...(approvals.courseEditorRequests || []),
    ...(approvals.quizEditorRequests || []),
    ...(approvals.quizAccessRequests || []),
  ] : [];

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">
        Welcome, {user?.firstName || user?.fullName?.split(' ')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">Here's what's happening across your courses and quizzes.</p>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!loading && totalPending > 0 && (
        <Card variant="elevated" className="mb-8 !border-[var(--color-warn)]/40 bg-gradient-to-br from-[var(--color-warn-glow)] to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[var(--color-warn)]" />
              <h2 className="font-[var(--font-display)] font-semibold text-sm">Awaiting your approval</h2>
              <Badge tone="warn">{totalPending}</Badge>
            </div>
            <Link to="/instructor/approvals" className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1">
              Review all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1.5">
            {allPendingItems.slice(0, 3).map((item, i) => (
              <p key={i} className="text-sm text-[var(--color-text-muted)] truncate">{labelFor(item)}</p>
            ))}
            {totalPending > 3 && (
              <p className="text-xs text-[var(--color-text-faint)]">and {totalPending - 3} more…</p>
            )}
          </div>
        </Card>
      )}

      {!loading && !hasContent && (
        <EmptyState
          icon={Upload}
          title="No quizzes yet"
          description="Upload course material as a PDF to generate your first quiz, grounded in your own content."
          action={
            <Link to="/instructor/generate">
              <Button className="!text-xs">Generate a quiz</Button>
            </Link>
          }
        />
      )}

      {!loading && hasContent && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[var(--font-display)] font-semibold text-sm">Recent quizzes</h2>
            <Link to="/instructor/mix-quiz" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-3 mb-8 -mx-1 px-1">
            {recentQuizzes?.map((q) => (
              <Card key={q.id} variant="interactive" className="!p-5 min-w-[280px] max-w-[280px] min-h-[180px] flex flex-col justify-between shrink-0" onClick={() => navigate(`/instructor/quiz/${q.id}`)}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Circle size={8} className={q.publishStatus === 'PUBLISHED' ? 'text-[var(--color-accent)] fill-current' : 'text-[var(--color-text-faint)] fill-current'} />
                  <span className="text-xs uppercase tracking-wide text-[var(--color-text-faint)] font-medium">
                    {q.publishStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-[19px] font-medium truncate leading-snug">{q.title}</p>
                <p className="text-sm text-[var(--color-text-faint)] font-mono mt-2">{q.questionCount} questions</p>
                {q.courseNames?.length > 0 && (
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 truncate">{q.courseNames.join(', ')}</p>
                )}
              </Card>
            ))}
            {recentQuizzes?.length === 0 && (
              <Card className="!p-4 min-w-[220px]"><p className="text-xs text-[var(--color-text-muted)]">No quizzes yet.</p></Card>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Class activity"
              icon={Users2}
              value={overview.totalEnrolledStudents}
              sub={`${overview.totalCourses} courses · ${overview.totalQuizzes} quizzes${overview.draftQuizzes > 0 ? ` · ${overview.draftQuizzes} draft` : ''}`}
            />

            <Card variant="interactive" className="flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/12 flex items-center justify-center mb-3">
                  <Upload size={16} className="text-[var(--color-accent)]" />
                </div>
                <p className="text-sm font-medium mb-1">Create a new quiz</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">Upload a PDF and generate fresh questions.</p>
              </div>
              <Link to="/instructor/generate"><Button variant="secondary" className="w-full !text-xs">Generate quiz</Button></Link>
            </Card>

            <Card variant="interactive" className="flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-[var(--color-warn)]/12 flex items-center justify-center mb-3">
                  <Shuffle size={16} className="text-[var(--color-warn)]" />
                </div>
                <p className="text-sm font-medium mb-1">Mix a quiz</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">Combine existing questions into a new set.</p>
              </div>
              <Link to="/instructor/mix-quiz"><Button variant="secondary" className="w-full !text-xs">Mix quiz</Button></Link>
            </Card>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
