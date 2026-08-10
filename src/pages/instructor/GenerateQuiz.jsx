import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Select, Modal } from '../../components/ui';
import GenerationLockGate from '../../components/GenerationLockGate';
import { generateQuestions } from '../../api/questions';
import { getMyCourses, createCourse } from '../../api/courses';
import { UploadCloud, Plus, CheckCircle2, X, FileText, Image as ImageIcon } from 'lucide-react';

const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.bmp';

function fileIcon(filename) {
  const lower = filename.toLowerCase();
  if (lower.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/)) return ImageIcon;
  return FileText;
}

export default function GenerateQuiz() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseContext, setCourseContext] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(15);
  const [variantsPerConcept, setVariantsPerConcept] = useState(2);
  const [variantsTouched, setVariantsTouched] = useState(false);
  const [difficulty, setDifficulty] = useState('mixed');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  function refreshCourses() {
    getMyCourses().then((data) => setCourses(data.filter((c) => c.status !== 'ARCHIVED'))).catch(() => setCourses([]));
  }

  useEffect(() => { refreshCourses(); }, []);

  // Smart default: follows the total-questions field until the instructor
  // manually edits variants themselves, at which point it stops auto-following.
  useEffect(() => {
    if (variantsTouched) return;
    setVariantsPerConcept(totalQuestions > 15 ? 3 : 2);
  }, [totalQuestions, variantsTouched]);

  function addFiles(newFiles) {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleTotalChange(e) {
    const raw = e.target.value;
    if (raw === '') { setTotalQuestions(''); return; }
    const n = Number(raw);
    if (!Number.isNaN(n)) setTotalQuestions(Math.min(120, Math.max(10, n)));
  }

  function handleVariantsChange(e) {
    setVariantsTouched(true);
    const raw = e.target.value;
    if (raw === '') { setVariantsPerConcept(''); return; }
    const n = Number(raw);
    if (!Number.isNaN(n)) setVariantsPerConcept(Math.min(4, Math.max(1, n)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStarted(false);

    if (files.length === 0) { setError('Please add at least one file — a module can span several documents.'); return; }
    if (!courseId) { setError('Please select a course.'); return; }

    const safeTotal = totalQuestions === '' ? 15 : totalQuestions;
    const safeVariants = variantsPerConcept === '' ? 2 : variantsPerConcept;

    setSubmitting(true);
    try {
      await generateQuestions({
        files, courseId, courseContext,
        variantsPerConcept: safeVariants, totalQuestionsRequested: safeTotal, difficulty,
      });
      setStarted(true);
      setFiles([]);
      setCourseContext('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start generation. Check the backend logs for details.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-[30px] font-semibold mb-1.5 tracking-tight">Generate a quiz</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Upload one or more files covering a whole module or several chapters — generation extracts every
        distinct concept it finds across all of them. Runs in the background, so feel free to keep working elsewhere.
      </p>

      <GenerationLockGate courses={courses}>
        {started && (
          <Card variant="elevated" className="mb-6 !border-[var(--color-accent)]/40">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[var(--color-accent)]" />
              <p className="text-sm text-[var(--color-text)]">
                Generation started — you'll see live progress at the top of this (and every) page.
              </p>
            </div>
          </Card>
        )}

        {courses && courses.length === 0 && (
          <Card variant="elevated" className="mb-6 !border-[var(--color-warn)]/40">
            <p className="text-sm text-[var(--color-warn)]">
              You need at least one course before generating a quiz.{' '}
              <button onClick={() => navigate('/instructor/courses')} className="underline">Create one first</button>.
            </p>
          </Card>
        )}

        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
                Source material — add as many files as you need
              </span>
              <label className="flex items-center gap-3 border border-dashed border-[var(--color-border)] rounded-lg px-4 py-4 cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors">
                <UploadCloud size={20} className="text-[var(--color-text-muted)] shrink-0" />
                <span className="text-sm text-[var(--color-text-muted)]">
                  Click to add PDF, Word, Excel, or image files
                </span>
                <input type="file" multiple accept={ACCEPTED} className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((f, i) => {
                    const Icon = fileIcon(f.name);
                    return (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]">
                        <Icon size={14} className="text-[var(--color-text-faint)] shrink-0" />
                        <span className="text-sm truncate flex-1">{f.name}</span>
                        <span className="text-xs text-[var(--color-text-faint)] font-mono shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
                  Total questions
                </span>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={totalQuestions}
                  onChange={handleTotalChange}
                  onBlur={() => { if (totalQuestions === '') setTotalQuestions(15); }}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
                  Variants per concept
                </span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={variantsPerConcept}
                  onChange={handleVariantsChange}
                  onBlur={() => { if (variantsPerConcept === '') setVariantsPerConcept(2); }}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-faint)] -mt-3">
              We'll generate somewhat more than {totalQuestions || 15} to give you real options to pick from — you choose
              exactly which ones make the final quiz afterward. Variants defaults to {totalQuestions > 15 ? 3 : 2} for this
              total, but you can override it.
            </p>

            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

            <Button type="submit" disabled={submitting || !courses?.length} className="w-full">
              {submitting ? 'Starting…' : 'Generate questions'}
            </Button>
          </form>
        </Card>
      </GenerationLockGate>

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
