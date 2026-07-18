import { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Select, Badge, Spinner } from '../../components/ui';
import { generateQuestions } from '../../api/questions';
import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react';

export default function GenerateQuiz() {
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [courseContext, setCourseContext] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Please select a PDF file.');
      return;
    }

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
            <Input label="Course ID" required placeholder="e.g. psych-101" value={courseId} onChange={(e) => setCourseId(e.target.value)} />
            <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="mixed">Mixed (recommended)</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>

          <Input
            label="Course context"
            required
            placeholder="e.g. Intro to Psychology, week 3 — nature vs nurture"
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (<><Spinner size={16} /> Generating — this can take a minute…</>) : 'Generate questions'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[var(--font-display)] font-semibold">Generation result</h2>
            <Badge tone="accent">{result.generated}/{result.requested} saved</Badge>
          </div>
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
