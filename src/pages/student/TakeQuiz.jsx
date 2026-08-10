import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, X, Maximize, Loader2, Dumbbell, Pause, Play } from 'lucide-react';
import { Button, Card, Badge, Spinner, ConfirmDialog } from '../../components/ui';
import { getNextQuestion, submitAnswer, completeSession, getSessionInfo } from '../../api/quiz';

const difficultyTone = { easy: 'accent', medium: 'warn', hard: 'danger' };

// Fisher-Yates — shuffles display order only. Each option still carries its
// real backend `index`, so selection/submission is unaffected by shuffling;
// this purely stops "the correct answer is always A" from being learnable.
function shuffle(options) {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TakeQuiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [sessionInfo, setSessionInfo] = useState(null);
  const [question, setQuestion] = useState(null);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false); // last question submitted, generating results
  const [questionNumber, setQuestionNumber] = useState(1);
  const [error, setError] = useState('');
  const [showQuit, setShowQuit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);

  // Enter fullscreen on mount. Browsers may block this without a direct user
  // gesture; if it's rejected we just fall back to the normal viewport and
  // offer a manual "Enter fullscreen" button instead of blocking the quiz.
  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => { /* left in windowed mode, no big deal */ });
    }
    function onChange() { setIsFullscreen(Boolean(document.fullscreenElement)); }
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    getSessionInfo(sessionId).then(setSessionInfo).catch(() => setSessionInfo({ title: 'Quiz', sessionType: 'ORIGINAL' }));
  }, [sessionId]);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setSelected([]);
    setError('');
    try {
      const data = await getNextQuestion(sessionId);
      if (data.completed) {
        // Show the "generating your results" state immediately — completing
        // the session can genuinely take a few seconds server-side.
        setFinishing(true);
        await completeSession(sessionId);
        navigate(`/student/results/${sessionId}`, { state: { justSubmitted: true } });
        return;
      }
      setQuestion(data);
      setShuffledOptions(shuffle(data.options));
    } catch (err) {
      setError('Could not load the next question.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => { loadNext(); }, [loadNext]);

  function toggleOption(index) {
    const isMulti = question.questionType === 'MULTI_CORRECT';
    if (isMulti) {
      setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    } else {
      setSelected([index]);
    }
  }

  async function handleNext() {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await submitAnswer({ sessionId, questionId: question.id, selectedOptionIndexes: selected });
      setQuestionNumber((n) => n + 1);
      await loadNext();
    } catch (err) {
      setError('Could not submit your answer.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuit() {
    navigate(sessionInfo?.sessionType === 'PRACTICE' ? '/student/practice' : '/student');
  }

  const isMulti = question?.questionType === 'MULTI_CORRECT';
  const isPractice = sessionInfo?.sessionType === 'PRACTICE';

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Minimal header — no sidebar, no distractions */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {isPractice && <Dumbbell size={16} className="text-[var(--color-warn)] shrink-0" />}
          <p className="text-sm font-medium truncate">{sessionInfo?.title || 'Loading…'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isFullscreen && containerRef.current?.requestFullscreen && (
            <button
              onClick={() => containerRef.current.requestFullscreen().catch(() => {})}
              className="text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)] inline-flex items-center gap-1.5"
            >
              <Maximize size={13} /> Fullscreen
            </button>
          )}
          <button
            onClick={() => setPaused(true)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1.5"
          >
            <Pause size={13} /> Pause
          </button>
          <button
            onClick={() => setShowQuit(true)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] inline-flex items-center gap-1.5"
          >
            <X size={14} /> Quit
          </button>
        </div>
      </div>

      {paused && (
        <div className="fixed inset-0 z-40 bg-[var(--color-bg)] flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/12 flex items-center justify-center mb-6">
            <Pause size={26} className="text-[var(--color-accent)]" />
          </div>
          <p className="text-lg font-medium mb-1.5">Paused</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-7 text-center max-w-xs">
            Take your time. Nothing is submitted until you resume and answer.
          </p>
          <Button onClick={() => setPaused(false)}>
            <Play size={15} /> Resume
          </Button>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        {finishing ? (
          <div className="flex flex-col items-center text-center max-w-sm">
            <Spinner size={32} />
            <p className="text-base font-medium mt-5 mb-1.5">Hang on!</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Your AI-powered results and insights on your performance are being generated.
            </p>
          </div>
        ) : loading && !question ? (
          <Spinner size={28} />
        ) : error && !question ? (
          <Card variant="elevated" className="max-w-xl w-full"><p className="text-sm text-[var(--color-danger)]">{error}</p></Card>
        ) : question ? (
          <div className="max-w-xl w-full">
            <div className="flex items-center justify-between mb-5">
              <Badge tone={difficultyTone[question.difficulty] || 'default'}>{question.difficulty}</Badge>
              <span className="text-xs text-[var(--color-text-faint)] font-mono">Question {questionNumber}</span>
            </div>

            <Card variant="elevated" className="!p-7">
              {question.imageUrl && (
                <img src={question.imageUrl} alt="" className="w-full max-h-64 object-contain rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] mb-4" />
              )}
              <p className="text-[19px] text-[var(--color-text)] mb-1.5 leading-relaxed font-medium">{question.questionText}</p>
              {isMulti && (
                <p className="text-xs text-[var(--color-accent)] mb-5 font-medium">Select all that apply</p>
              )}
              {!isMulti && <div className="mb-6" />}

              <div className="space-y-2.5 mb-6">
                {shuffledOptions.map((opt) => {
                  const isSelected = selected.includes(opt.index);
                  const indicatorShape = isMulti ? 'rounded-md' : 'rounded-full';

                  return (
                    <button
                      key={opt.index}
                      onClick={() => toggleOption(opt.index)}
                      className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all duration-150 flex items-center gap-3 ${
                        isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      <span
                        className={`shrink-0 w-[18px] h-[18px] border-2 ${indicatorShape} flex items-center justify-center transition-colors ${
                          isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} className="text-[#0a0f12]" />}
                      </span>
                      <span className="text-sm flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              <Button onClick={handleNext} disabled={selected.length === 0 || submitting} className="w-full">
                {submitting ? (<><Loader2 size={15} className="animate-spin" /> Submitting…</>) : (<>Next <ArrowRight size={15} /></>)}
              </Button>

              {error && <p className="text-sm text-[var(--color-danger)] mt-3">{error}</p>}
            </Card>
          </div>
        ) : null}
      </div>

      {showQuit && (
        <ConfirmDialog
          title="Quit this quiz?"
          message="Your progress is saved. You can resume exactly where you left off later from your dashboard."
          confirmLabel="Quit"
          onConfirm={handleQuit}
          onCancel={() => setShowQuit(false)}
        />
      )}
    </div>
  );
}
