import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button, Input, Select, Modal } from './ui';
import { createManualQuestion, uploadQuestionImage } from '../api/questions';

const emptyOption = () => ({ text: '', correct: false, misconceptionTag: null });

export default function CreateManualQuestionModal({ quizId, courseId, existingConcepts, onClose, onCreated }) {
  const [mode, setMode] = useState(existingConcepts?.length ? 'existing' : 'new');
  const [conceptGroupId, setConceptGroupId] = useState('');
  const [conceptName, setConceptName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('SINGLE_CORRECT');
  const [options, setOptions] = useState([emptyOption(), emptyOption()]);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateOptionText(idx, text) {
    setOptions(options.map((o, i) => (i === idx ? { ...o, text } : o)));
  }

  function toggleCorrect(idx) {
    const isMulti = questionType === 'MULTI_CORRECT';
    setOptions(options.map((o, i) => {
      if (i !== idx) return isMulti ? o : { ...o, correct: false };
      return { ...o, correct: !o.correct };
    }));
  }

  function addOption() {
    if (options.length >= 4) return;
    setOptions([...options, emptyOption()]);
  }

  function removeOption(idx) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!questionText.trim()) { setError('Question text is required.'); return; }
    if (options.some((o) => !o.text.trim())) { setError('Every option needs text.'); return; }
    const correctCount = options.filter((o) => o.correct).length;
    if (correctCount === 0) { setError('Mark at least one option correct.'); return; }
    if (questionType === 'SINGLE_CORRECT' && correctCount > 1) { setError('Single-select can only have one correct option.'); return; }
    if (questionType === 'MULTI_CORRECT' && correctCount < 2) { setError('Multi-select needs at least two correct options.'); return; }
    if (mode === 'existing' && !conceptGroupId) { setError('Select a concept.'); return; }
    if (mode === 'new' && !conceptName.trim()) { setError('Name the new concept.'); return; }

    setSaving(true);
    try {
      const created = await createManualQuestion({
        questionSetId: quizId,
        courseId,
        conceptGroupId: mode === 'existing' ? conceptGroupId : null,
        conceptName: mode === 'existing' ? null : conceptName.trim(),
        questionText: questionText.trim(),
        explanation,
        difficulty,
        options,
      });

      if (image) {
        await uploadQuestionImage(created.id, image);
      }

      onCreated(created);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create question.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="max-h-[75vh] overflow-y-auto">
        <h2 className="font-[var(--font-display)] font-semibold mb-4">Add a question</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Concept</span>
            {existingConcepts?.length > 0 && (
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setMode('existing')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${mode === 'existing' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                  Existing concept
                </button>
                <button type="button" onClick={() => setMode('new')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${mode === 'new' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                  New concept
                </button>
              </div>
            )}
            {mode === 'existing' ? (
              <select
                value={conceptGroupId}
                onChange={(e) => setConceptGroupId(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-sm focus:border-[var(--color-accent)] outline-none"
              >
                <option value="">Select a concept…</option>
                {existingConcepts?.map((c) => (
                  <option key={c.conceptGroupId} value={c.conceptGroupId}>{c.conceptName}</option>
                ))}
              </select>
            ) : (
              <Input placeholder="e.g. Photosynthesis light-dependent reactions" value={conceptName} onChange={(e) => setConceptName(e.target.value)} />
            )}
          </div>

          <Input label="Question text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />

          <Select label="Question type" value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="SINGLE_CORRECT">Single correct answer</option>
            <option value="MULTI_CORRECT">Multiple correct answers</option>
          </Select>

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
                    className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-xs transition-colors ${
                      opt.correct ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[#0a0f12]' : 'border-[var(--color-border)] text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <input
                    className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none transition-colors"
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => updateOptionText(idx, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(idx)} className="shrink-0 text-[var(--color-text-faint)] hover:text-[var(--color-danger)]">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 4 && (
              <button type="button" onClick={addOption} className="mt-2 text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1">
                <Plus size={12} /> Add option
              </button>
            )}
          </div>

          <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>

          <Input label="Explanation (optional)" value={explanation} onChange={(e) => setExplanation(e.target.value)} />

          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Image (optional)</span>
            <label className="flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-3 cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors">
              <Upload size={15} className="text-[var(--color-text-muted)] shrink-0" />
              <span className="text-sm text-[var(--color-text-muted)] truncate">{image ? image.name : 'Attach an image to this question'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => setImage(e.target.files[0])} />
            </label>
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Add question'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
