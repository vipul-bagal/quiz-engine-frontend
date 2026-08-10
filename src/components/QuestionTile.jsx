import { useEffect, useState } from 'react';
import { Pencil, Trash2, X, CheckCircle2, ImageIcon, Upload, ImageOff } from 'lucide-react';
import { Button, Card, Input, Select, Badge, Modal, Spinner } from './ui';
import { updateQuestion, uploadQuestionImage, deleteQuestionImage } from '../api/questions';
import { getQuestionImageUrl } from '../api/materials';

const difficultyTone = { easy: 'accent', medium: 'warn', hard: 'danger' };

export default function QuestionTile({ question, onUpdated, onDeleted, selectable, selected, onToggleSelect }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const options = JSON.parse(question.optionsJson);

  useEffect(() => {
    if (question.imageStorageKey) {
      getQuestionImageUrl(question.id).then(setImageUrl).catch(() => setImageUrl(null));
    } else {
      setImageUrl(null);
    }
  }, [question.id, question.imageStorageKey]);

  const isManual = question.source === 'MANUAL';

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Card variant="interactive" className="!p-4 !cursor-default">
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
              {imageUrl && (
                <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[var(--color-border)]" />
              )}
              <button className="text-left min-w-0 cursor-pointer" onClick={() => setEditing(true)}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge tone={difficultyTone[question.difficulty] || 'default'}>{question.difficulty}</Badge>
                  <Badge>{question.questionType === 'MULTI_CORRECT' ? 'multi-select' : 'single-select'}</Badge>
                  {question.imageStorageKey && <Badge tone="accent"><ImageIcon size={10} className="inline mr-1" />picture</Badge>}
                  {isManual && <Badge tone="warn">manual</Badge>}
                  <span className="text-xs text-[var(--color-text-faint)] font-mono">
                    {question.conceptName} · variant {question.variantIndex}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">{question.questionText}</p>
              </button>
            </div>
            {(onUpdated || onDeleted) && (
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors">
                  <Pencil size={14} />
                </button>
                {onDeleted && isManual && (
                  <button onClick={() => onDeleted(question.id)} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)] transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div
            className="grid transition-all duration-200 ease-[var(--ease-out)]"
            style={{ gridTemplateRows: hovered ? '1fr' : '0fr', opacity: hovered ? 1 : 0 }}
          >
            <div className="overflow-hidden">
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
            </div>
          </div>
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
  const [questionType, setQuestionType] = useState(question.questionType);
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [options, setOptions] = useState(() => JSON.parse(question.optionsJson));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(Boolean(question.imageStorageKey));
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (question.imageStorageKey) {
      getQuestionImageUrl(question.id).then(setImageUrl).catch(() => setImageUrl(null)).finally(() => setImageLoading(false));
    } else {
      setImageLoading(false);
    }
  }, [question.id, question.imageStorageKey]);

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

  function handleTypeChange(newType) {
    setQuestionType(newType);
    // Switching to single-correct: keep only the first currently-correct
    // option, so the resulting state is always valid for the new type.
    if (newType === 'SINGLE_CORRECT') {
      let kept = false;
      setOptions(options.map((o) => {
        if (o.correct && !kept) { kept = true; return o; }
        return { ...o, correct: false };
      }));
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      await uploadQuestionImage(question.id, file);
      const url = await getQuestionImageUrl(question.id);
      setImageUrl(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleImageRemove() {
    setUploadingImage(true);
    setError('');
    try {
      await deleteQuestionImage(question.id);
      setImageUrl(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    setError('');
    const correctCount = options.filter((o) => o.correct).length;
    if (correctCount === 0) {
      setError('At least one option must be marked correct.');
      return;
    }
    if (questionType === 'SINGLE_CORRECT' && correctCount > 1) {
      setError('Single-select questions can only have one correct option.');
      return;
    }
    if (questionType === 'MULTI_CORRECT' && correctCount < 2) {
      setError('Multi-select questions need at least two correct options.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateQuestion(question.id, {
        questionText, questionType, options, explanation, difficulty,
      });
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[var(--font-display)] font-semibold">Edit question</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Image</span>
            {imageLoading ? (
              <div className="flex justify-center py-4"><Spinner size={16} /></div>
            ) : imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="" className="w-full max-h-48 object-contain rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]" />
                <div className="flex gap-2 mt-2">
                  <label className="flex-1">
                    <span className="block w-full text-center text-xs py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-dim)] cursor-pointer transition-colors">
                      {uploadingImage ? 'Uploading…' : 'Replace image'}
                    </span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    disabled={uploadingImage}
                    className="px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/40 transition-colors"
                  >
                    <ImageOff size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-3.5 cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors">
                <Upload size={16} className="text-[var(--color-text-muted)] shrink-0" />
                <span className="text-sm text-[var(--color-text-muted)]">{uploadingImage ? 'Uploading…' : 'Add an image to this question'}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            )}
          </div>

          <Input label="Question text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />

          <Select label="Question type" value={questionType} onChange={(e) => handleTypeChange(e.target.value)}>
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
      </div>
    </Modal>
  );
}
