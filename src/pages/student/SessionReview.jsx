import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, ArrowLeft } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { studentNavItems } from '../../components/studentNav';
import { Spinner, Button } from '../../components/ui';
import ReviewQuestionCard from '../../components/ReviewQuestionCard';
import { getSessionReview } from '../../api/quiz';



export default function SessionReview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    getSessionReview(sessionId).then(setReviews).catch(() => setReviews([]));
  }, [sessionId]);

  return (
    <DashboardShell navItems={studentNavItems}>
      <button onClick={() => navigate(`/student/results/${sessionId}`)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={13} /> Back to results
      </button>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">Review answers</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Every question, your answer, and the correct one — in the order you answered them.</p>

      {reviews === null && <div className="flex justify-center py-12"><Spinner /></div>}

      {reviews && (
        <div className="max-w-2xl mx-auto space-y-4">
          {reviews.map((r, i) => (
            <div key={r.questionId}>
              <p className="text-xs text-[var(--color-text-faint)] font-mono mb-2">Question {i + 1}</p>
              <ReviewQuestionCard review={r} />
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
