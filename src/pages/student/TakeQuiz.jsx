import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Button, Card, Badge, Spinner } from '../../components/ui';
import { getNextQuestion, submitAnswer, completeSession } from '../../api/quiz';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

export default function TakeQuiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [error, setError] = useState('');

  const loadNext = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setSelected([]);
    setError('');
    try {
      const data = await getNextQuestion(sessionId);
      if (data.completed) {
        await completeSession(sessionId);
        navigate(`/student/results/${sessionId}`);
        return;
      }
      setQuestion(data);
    } catch (err) {
      setError('Could not load the next question.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => { loadNext(); }, [loadNext]);

  function toggleOption(index) {
    if (feedback) return;
    const isMulti = question.questionType === 'MULTI_CORRECT';
    if (isMulti) {
      setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    } else {
      setSelected([index]);
    }
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer({ sessionId, questionId: question.id, selectedOptionIndexes: selected });
      setFeedback(result);
    } catch (err) {
      setError('Could not submit your answer.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setQuestionNumber((n) => n + 1);
    loadNext();
  }

  if (loading) {
    return (<DashboardShell navItems={navItems}><div className="flex justify-center py-20"><Spinner /></div></DashboardShell>);
  }

  if (error && !question) {
    return (<DashboardShell navItems={navItems}><Card><p className="text-sm text-[var(--color-danger)]">{error}</p></Card></DashboardShell>);
  }

  if (!question) return null;

  const isMulti = question.questionType === 'MULTI_CORRECT';

  return (
    <DashboardShell navItems={navItems}>
      <div className="flex items-center justify-between mb-6">
        <Badge>{question.difficulty}</Badge>
        <span className="text-xs text-[var(--color-text-faint)] font-mono">Question {questionNumber}</span>
      </div>

      <Card>
        <p className="text-lg text-[var(--color-text)] mb-1.5 leading-relaxed">{question.questionText}</p>
        {isMulti && <p className="text-xs text-[var(--color-accent)] mb-5">Select all that apply</p>}
        {!isMulti && <div className="mb-5" />}

        <div className="space-y-2.5 mb-6">
          {question.options.map((opt) => {
            const isSelected = selected.includes(opt.index);
            let stateClasses = 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)]';

            if (feedback) {
              const isCorrectOption = feedback.correctOptionIndexes.includes(opt.index);
              if (isCorrectOption) stateClasses = 'border-[var(--color-accent)] bg-[var(--color-accent)]/10';
              else if (isSelected) stateClasses = 'border-[var(--color-danger)] bg-[var(--color-danger)]/10';
            } else if (isSelected) {
              stateClasses = 'border-[var(--color-accent)] bg-[var(--color-accent)]/10';
            }

            return (
              <button
                key={opt.index}
                onClick={() => toggleOption(opt.index)}
                disabled={!!feedback}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between ${stateClasses} disabled:cursor-default`}
              >
                <span className="text-sm">{opt.text}</span>
                {feedback && feedback.correctOptionIndexes.includes(opt.index) && <CheckCircle2 size={16} className="text-[var(--color-accent)] shrink-0" />}
                {feedback && isSelected && !feedback.correctOptionIndexes.includes(opt.index) && <XCircle size={16} className="text-[var(--color-danger)] shrink-0" />}
              </button>
            );
          })}
        </div>

        {!feedback && (
          <Button onClick={handleSubmit} disabled={selected.length === 0 || submitting} className="w-full">
            {submitting ? 'Submitting…' : 'Submit answer'}
          </Button>
        )}

        {feedback && (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 text-sm font-medium ${feedback.correct ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
              {feedback.correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
              {feedback.correct ? 'Correct' : 'Not quite'}
            </div>
            {feedback.explanation && <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{feedback.explanation}</p>}
            <Button onClick={handleNext} className="w-full">Next question <ArrowRight size={15} /></Button>
          </div>
        )}

        {error && <p className="text-sm text-[var(--color-danger)] mt-3">{error}</p>}
      </Card>
    </DashboardShell>
  );
}
