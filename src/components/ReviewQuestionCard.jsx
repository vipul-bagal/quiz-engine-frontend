import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge } from './ui';

const difficultyTone = { easy: 'accent', medium: 'warn', hard: 'danger' };

/**
 * Shows one answered question. Collapsed by default (question text + concept
 * + correct/incorrect badge); clicking expands to reveal options (correct
 * one highlighted), the student's own pick, and the explanation.
 */
export default function ReviewQuestionCard({ review, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const correctOptions = review.options.filter((o) => o.correct).map((o) => o.text);
  const selectedTexts = review.selectedOptionIndexes
    .map((i) => review.options.find((o) => o.index === i)?.text)
    .filter(Boolean);

  return (
    <Card variant="interactive" className="!p-5 !cursor-pointer" onClick={() => setExpanded((e) => !e)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge tone={difficultyTone[review.difficulty] || 'default'}>{review.difficulty}</Badge>
            <span className="text-xs text-[var(--color-text-faint)] font-mono">{review.conceptName}</span>
          </div>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">{review.questionText}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={review.correct ? 'accent' : 'danger'}>
            {review.correct ? <CheckCircle2 size={11} className="inline mr-1" /> : <XCircle size={11} className="inline mr-1" />}
            {review.correct ? 'Correct' : 'Incorrect'}
          </Badge>
          {expanded ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1.5 mb-4">
            {review.options.map((opt) => {
              const isSelected = review.selectedOptionIndexes.includes(opt.index);
              let classes = 'border-[var(--color-border)]';
              if (opt.correct) classes = 'border-[var(--color-accent)] bg-[var(--color-accent)]/8';
              else if (isSelected) classes = 'border-[var(--color-danger)] bg-[var(--color-danger)]/8';

              return (
                <div key={opt.index} className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border text-sm ${classes}`}>
                  <span>{opt.text}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.correct && <CheckCircle2 size={14} className="text-[var(--color-accent)]" />}
                    {isSelected && !opt.correct && <XCircle size={14} className="text-[var(--color-danger)]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5 text-xs mb-4 px-1">
            <p><span className="text-[var(--color-text-faint)]">Correct answer:</span> <span className="text-[var(--color-accent)] font-medium">{correctOptions.join(', ')}</span></p>
            <p><span className="text-[var(--color-text-faint)]">Your answer:</span> <span className={review.correct ? 'text-[var(--color-accent)] font-medium' : 'text-[var(--color-danger)] font-medium'}>{selectedTexts.length > 0 ? selectedTexts.join(', ') : 'No answer recorded'}</span></p>
          </div>

          {review.explanation && (
            <div className="pt-3 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{review.explanation}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
