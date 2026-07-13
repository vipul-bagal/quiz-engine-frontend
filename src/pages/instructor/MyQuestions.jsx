import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Upload, FileText, BarChart3, Pencil, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Button, Card, Input, Select, Badge, Spinner } from '../../components/ui';
import { getMyQuestions, getQuestionsByCourse, updateQuestion, deleteQuestion } from '../../api/questions';

const navItems = [
  { to: '/instructor', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/instructor/generate', label: 'Generate quiz', icon: Upload },
  { to: '/instructor/questions', label: 'My questions', icon: FileText },
  { to: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
];

const difficultyTone = { easy: 'accent', medium: 'warn', hard: 'danger' };

export default function MyQuestions() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [courseFilter, setCourseFilter] = useState('');
  const [filteredList, setFilteredList] = useState(null); // non-null when a course filter is active
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const data = await getMyQuestions({ page: pageNum, size: 10 });
      setPageData(data);
    } catch (err) {
      setError('Could not load questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!courseFilter) loadPage(page);
  }, [page, courseFilter, loadPage]);

  async function handleCourseFilter(e) {
    e.preventDefault();
    if (!courseFilter.trim()) {
      setFilteredList(null);
      loadPage(0);
      return;
    }
    setLoading(true);
    try {
      const data = await getQuestionsByCourse(courseFilter.trim());
      setFilteredList(data);
    } catch (err) {
      setError('Could not load questions for that course.');
    } finally {
      setLoading(false);
    }
  }

  function clearFilter() {
    setCourseFilter('');
    setFilteredList(null);
    setPage(0);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await deleteQuestion(id);
      if (filteredList) {
        setFilteredList(filteredList.filter((q) => q.id !== id));
      } else {
        loadPage(page);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete question.');
    }
  }

  const questions = filteredList ?? pageData?.content ?? [];

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">My questions</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Review, edit, or remove questions you've generated.
      </p>

      <form onSubmit={handleCourseFilter} className="flex items-end gap-3 mb-6">
        <div className="flex-1 max-w-xs">
          <Input
            label="Filter by course ID"
            placeholder="e.g. psych-101"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
        {filteredList && (
          <Button type="button" variant="ghost" onClick={clearFilter}>
            <X size={14} /> Clear
          </Button>
        )}
      </form>

      {loading && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {!loading && questions.length === 0 && (
        <Card>
          <p className="text-sm text-[var(--color-text-muted)]">
            No questions found{filteredList ? ' for that course' : ''}. Generate a quiz to get started.
          </p>
        </Card>
      )}

      {!loading && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id} className="!p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge tone={difficultyTone[q.difficulty] || 'default'}>{q.difficulty}</Badge>
                    <Badge>{q.questionType === 'MULTI_CORRECT' ? 'multi-select' : 'single-select'}</Badge>
                    <span className="text-xs text-[var(--color-text-faint)] font-mono">
                      {q.conceptName} · variant {q.variantIndex}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text)]">{q.questionText}</p>
                  <p className="text-xs text-[var(--color-text-faint)] font-mono mt-1">course: {q.courseId}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!filteredList && pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="secondary" disabled={pageData.first} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={15} />
          </Button>
          <span className="text-sm text-[var(--color-text-muted)] font-mono">
            {pageData.number + 1} / {pageData.totalPages}
          </span>
          <Button variant="secondary" disabled={pageData.last} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={15} />
          </Button>
        </div>
      )}

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={(updated) => {
            setEditingQuestion(null);
            if (filteredList) {
              setFilteredList(filteredList.map((q) => (q.id === updated.id ? updated : q)));
            } else {
              loadPage(page);
            }
          }}
        />
      )}
    </DashboardShell>
  );
}

function EditQuestionModal({ question, onClose, onSaved }) {
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
    setOptions(
      options.map((o, i) => {
        if (i !== idx) return isMulti ? o : { ...o, correct: false };
        return { ...o, correct: !o.correct };
      })
    );
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
        questionText,
        questionType: question.questionType,
        options,
        explanation,
        difficulty,
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
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X size={18} />
          </button>
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
                      opt.correct
                        ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[#0a0f12]'
                        : 'border-[var(--color-border)] text-transparent'
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
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
