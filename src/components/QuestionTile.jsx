import { useState } from 'react';
import { Pencil, Trash2, X, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Select, Badge } from './ui';
import { updateQuestion } from '../api/questions';

const difficultyTone = { easy: 'accent', medium: 'warn', hard: 'danger' };

/**
 * A single question shown as a compact tile. Hovering reveals the option
 * list with the correct answer highlighted (instructor-only view). Clicking
 * opens a full edit modal. Used both in "My Questions" and inside the Mix
 * Quiz concept picker, so question review/editing works the same everywhere.
 */
export default function QuestionTile({ question, onUpdated, onDeleted, selectable, selected, onToggleSelect }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const options = JSON.parse(question.optionsJson);

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Card className="!p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 flex items-start gap-3">
              {selectable && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={onToggleSelect}
                  className="mt-1 accent-[var(--color-accent)]"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button className="text-left min-w-0" onClick={() => setEditing(true)}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge tone={difficultyTone[question.difficulty] || 'default'}>{question.difficulty}</Badge>
                  <Badge>{question.questionType === 'MULTI_CORRECT' ? 'multi-select' : 'single-select'}</Badge>
                  <span className="text-xs text-[var(--color-text-faint)] font-mono">
                    {question.conceptName} · variant {question.variantIndex}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text)]">{question.questionText}</p>
              </button>
            </div>
            {(onUpdated || onDeleted) && (
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]">
                  <Pencil size={14} />
                </button>
                {onDeleted && (
                  <button onClick={() => onDeleted(question.id)} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {hovered && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {opt.correct ? (
                    <CheckCircle2 size={13} className="text-[var(--color-accent)] shrink-0" />
                  ) : (
                    <span className="w-[13px] shrink-0" />
                  )}
                  <span className={opt.correct ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}>
                    {opt.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {editing && (
        <QuestionEditModal
          question={question}
          onClose={() => setEditing(false)}
          onSaved={(updated) => { setEditing(false); onUpdated?.(updated); }}
        />
      )}
    </>
  );
}

function QuestionEditModal({ question, onClose, onSaved }) {
  const [questionText, setQuestionText] = useState(question.questionText);
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [options, setOptions] = useState(() => JSON.parse(question.optionsJson));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateOptionText(idx, text) {
    setOptions(options.map((o, i) => (i === idx ? { ...o, text } : o)));
  }

  function toggleCorrect(idx) {
    const isMulti = question.questionType === 'MULTI_CORRECT';
    setOptions(options.map((o, i) => {
      if (i !== idx) return isMulti ? o : { ...o, correct: false };
      return { ...o, correct: !o.correct };
    }));
  }

  async function handleSave() {
    setError('');
    if (!options.some((o) => o.correct)) {
      setError('At least one option must be marked correct.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateQuestion(question.id, {
        questionText, questionType: question.questionType, options, explanation, difficulty,
      });
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[var(--font-display)] font-semibold">Edit question</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <Input label="Question text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />

          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
              Options — toggle the correct one(s)
            </span>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(idx)}
                    className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs ${
                      opt.correct ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[#0a0f12]' : 'border-[var(--color-border)] text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <input
                    className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none"
                    value={opt.text}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>

          <Input label="Explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} />

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
