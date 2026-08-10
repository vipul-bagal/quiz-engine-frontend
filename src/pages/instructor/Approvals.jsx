import { useEffect, useState } from 'react';
import { Check, X, ShieldCheck, Inbox } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner, EmptyState } from '../../components/ui';
import { getApprovalsSummary } from '../../api/approvals';
import { approveEnrollment, rejectEnrollment, approveCourseEditorRequest, rejectCourseEditorRequest } from '../../api/courses';
import { approveQuizEditorRequest, rejectQuizEditorRequest, decideQuizAccessRequest } from '../../api/questionSets';

const sections = [
  { key: 'courseEnrollments', title: 'Course enrollment requests', empty: 'No pending enrollment requests.' },
  { key: 'courseEditorRequests', title: 'Course editor requests', empty: 'No pending editor requests for your courses.' },
  { key: 'quizEditorRequests', title: 'Quiz editor requests', empty: 'No pending editor requests for your quizzes.' },
  { key: 'quizAccessRequests', title: 'Restricted quiz access requests', empty: 'No pending access requests.' },
];

export default function Approvals() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function refresh() {
    setError('');
    getApprovalsSummary()
      .then(setSummary)
      .catch(() => setError('Could not load approvals. Try refreshing the page.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleDecision(item, decision) {
    try {
      if (item.type === 'COURSE_ENROLLMENT') {
        decision === 'approve' ? await approveEnrollment(item.courseId, item.id) : await rejectEnrollment(item.courseId, item.id);
      } else if (item.type === 'COURSE_EDITOR') {
        decision === 'approve' ? await approveCourseEditorRequest(item.courseId, item.id) : await rejectCourseEditorRequest(item.courseId, item.id);
      } else if (item.type === 'QUIZ_EDITOR') {
        decision === 'approve' ? await approveQuizEditorRequest(item.quizId, item.id) : await rejectQuizEditorRequest(item.quizId, item.id);
      } else if (item.type === 'QUIZ_ACCESS') {
        await decideQuizAccessRequest(item.quizId, item.id, decision === 'approve' ? 'approve' : 'reject');
      }
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not process this request.');
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <div className="flex items-center gap-2 mb-1.5">
        <ShieldCheck size={20} className="text-[var(--color-accent)]" />
        <h1 className="font-[var(--font-display)] text-2xl font-semibold">Approvals</h1>
      </div>
      <p className="text-[var(--color-text-muted)] mb-8">
        Everything waiting on your decision — enrollment requests, editor access, and restricted quiz access.
      </p>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {error && (
        <Card variant="elevated" className="!border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      )}

      {!loading && summary && sections.map(({ key, title, empty }) => {
        const items = summary[key] || [];
        return (
          <div key={key} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-[var(--font-display)] font-semibold text-sm">{title}</h2>
              {items.length > 0 && <Badge tone="warn">{items.length}</Badge>}
            </div>
            {items.length === 0 ? (
              <EmptyState icon={Inbox} title="All clear" description={empty} />
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id} variant="interactive" className="!p-4 !cursor-default flex items-center justify-between">
                    <div title={item.studentEmail || item.instructorEmail}>
                      <p className="text-sm font-medium">{item.studentName || item.instructorName}</p>
                      <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                        {item.courseName || item.quizTitle}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleDecision(item, 'approve')} className="p-2 rounded-lg text-[var(--color-accent)] hover:bg-[var(--color-accent)]/12">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleDecision(item, 'reject')} className="p-2 rounded-lg text-[var(--color-danger)] hover:bg-[var(--color-danger)]/12">
                        <X size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </DashboardShell>
  );
}
