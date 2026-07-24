import { useEffect, useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Select, Badge, Spinner, Modal } from '../../components/ui';
import { generateQuestions } from '../../api/questions';
import { getMyCourses, createCourse } from '../../api/courses';
import { UploadCloud, CheckCircle2, XCircle, Plus } from 'lucide-react';

export default function GenerateQuiz() {
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseContext, setCourseContext] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function refreshCourses() {
    getMyCourses().then((data) => setCourses(data.filter((c) => c.status !== 'ARCHIVED'))).catch(() => setCourses([]));
  }

  useEffect(() => { refreshCourses(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) { setError('Please select a PDF file.'); return; }
    if (!courseId) { setError('Please select a course.'); return; }

    setLoading(true);
    try {
      const data = await generateQuestions({ file, courseId, courseContext, numQuestions, difficulty });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Generation failed. Check the backend logs for details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Generate a quiz</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Upload course material as a PDF. Questions are generated grounded strictly in the source,
        then audited by a self-critique gate before being saved.
      </p>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
              Source PDF
            </span>
            <label className="flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-4 cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors">
              <UploadCloud size={20} className="text-[var(--color-text-muted)] shrink-0" />
              <span className="text-sm text-[var(--color-text-muted)] truncate">
                {file ? file.name : 'Click to choose a PDF file'}
              </span>
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">Course</span>
              <div className="flex gap-2">
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="flex-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
                >
                  <option value="">Select a course…</option>
                  {courses?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateCourse(true)}
                  className="shrink-0 px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-dim)]"
                  title="Create a new course"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="mixed">Mixed (recommended)</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>

          <Input
            label="Quiz context / topic"
            required
            placeholder="e.g. Week 3 — nature vs nurture"
            value={courseContext}
            onChange={(e) => setCourseContext(e.target.value)}
          />

          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
              Number of questions: <span className="text-[var(--color-accent)] font-mono">{numQuestions}</span>
            </span>
            <input
              type="range"
              min={4}
              max={50}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-text-faint)] mt-1">
              {numQuestions >= 10
                ? 'At 10+, dual-variant mode kicks in — each concept gets 2 question angles for consistency checking.'
                : 'Below 10, single-variant mode maximizes topic coverage.'}
            </p>
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <Button type="submit" disabled={loading || !courses?.length} className="w-full">
            {loading ? (<><Spinner size={16} /> Generating — this can take a minute…</>) : 'Generate questions'}
          </Button>
        </form>
      </Card>

      {showCreateCourse && (
        <Modal onClose={() => setShowCreateCourse(false)}>
          <InlineCreateCourse
            onClose={() => setShowCreateCourse(false)}
            onCreated={(newCourse) => {
              setShowCreateCourse(false);
              refreshCourses();
              setCourseId(newCourse.id);
            }}
          />
        </Modal>
      )}

      {result && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-display)] font-semibold">Generation result</h2>
            <Badge tone="accent">{result.generated}/{result.requested} saved</Badge>
          </div>
          <p className="text-xs text-[var(--color-text-faint)] font-mono mb-4">
            Saved as a new quiz — set ID: {result.questionSetId}
          </p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {result.questions.map((q) => (
              <div key={q.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[var(--color-surface-raised)]">
                <CheckCircle2 size={16} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{q.questionText}</p>
                  <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                    {q.conceptName} · variant {q.variantIndex} · {q.difficulty}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {result.generated < result.requested && (
            <p className="text-xs text-[var(--color-text-muted)] mt-4 flex items-center gap-1.5">
              <XCircle size={14} className="text-[var(--color-warn)]" />
              {result.requested - result.generated} question(s) were rejected by the self-critique gate and not saved.
            </p>
          )}
        </Card>
      )}
    </DashboardShell>
  );
}

function InlineCreateCourse({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Course name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const newCourse = await createCourse({ name, description });
      onCreated(newCourse);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">New course</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Course name" placeholder="e.g. Intro to Psychology" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create & select'}</Button>
        </div>
      </form>
    </>
  );
}
