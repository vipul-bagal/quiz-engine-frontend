import { useEffect, useState } from 'react';
import { Shuffle, ListChecks, Check, Star } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Badge, Spinner } from '../../components/ui';
import { getMyConcepts, createQuestionSet, getMyQuestionSets, setQuestionSetPriority } from '../../api/questionSets';
import { getMyCourses } from '../../api/courses';

export default function MixQuiz() {
  const [mode, setMode] = useState('CONCEPT_SELECT');
  const [concepts, setConcepts] = useState(null);
  const [courseNames, setCourseNames] = useState({});
  const [selectedConcepts, setSelectedConcepts] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [mySets, setMySets] = useState(null);

  useEffect(() => {
    getMyConcepts().then(setConcepts).catch(() => setConcepts([]));
    getMyCourses().then((data) => {
      const map = {};
      data.forEach((c) => { map[c.id] = c.name; });
      setCourseNames(map);
    }).catch(() => setCourseNames({}));
    refreshSets();
  }, []);

  function refreshSets() {
    getMyQuestionSets({ page: 0, size: 10 }).then((data) => setMySets(data.content)).catch(() => setMySets([]));
  }

  async function togglePriority(set) {
    await setQuestionSetPriority(set.id, !set.priority);
    refreshSets();
  }

  const courses = concepts ? [...new Set(concepts.map((c) => c.courseId))] : [];

  function toggleConcept(id) {
    setSelectedConcepts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleCourse(courseId) {
    setSelectedCourses((prev) => (prev.includes(courseId) ? prev.filter((c) => c !== courseId) : [...prev, courseId]));
  }

  async function handleCreate() {
    setError('');
    if (!title.trim()) {
      setError('Give this quiz a title.');
      return;
    }
    if (mode === 'CONCEPT_SELECT' && selectedConcepts.length === 0) {
      setError('Select at least one concept.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title,
        mode,
        conceptGroupIds: mode === 'CONCEPT_SELECT' ? selectedConcepts : undefined,
        courseIds: mode === 'RANDOM_MIX' && selectedCourses.length > 0 ? selectedCourses : undefined,
        totalQuestions: mode === 'RANDOM_MIX' ? totalQuestions : undefined,
      };
      const result = await createQuestionSet(payload);
      setCreated(result);
      setTitle('');
      setSelectedConcepts([]);
      setSelectedCourses([]);
      refreshSets();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create quiz set.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Mix a quiz</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Combine questions from across your existing content into a new curated or randomized set —
        no new generation needed, this just reshuffles what you already have.
      </p>

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setMode('CONCEPT_SELECT')}
            className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
              mode === 'CONCEPT_SELECT' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
            }`}
          >
            <ListChecks size={18} className={mode === 'CONCEPT_SELECT' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
            <div>
              <p className="text-sm font-medium">Pick concepts</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Choose exactly which concepts to include — all their questions come along.</p>
            </div>
          </button>
          <button
            onClick={() => setMode('RANDOM_MIX')}
            className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
              mode === 'RANDOM_MIX' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
            }`}
          >
            <Shuffle size={18} className={mode === 'RANDOM_MIX' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
            <div>
              <p className="text-sm font-medium">Random mix</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Shuffle a pool of courses and sample N questions from it.</p>
            </div>
          </button>
        </div>

        <Input label="Quiz set title" placeholder="e.g. Midterm review mix" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-5" />

        {concepts === null && <div className="flex justify-center py-8"><Spinner /></div>}

        {mode === 'CONCEPT_SELECT' && concepts && (
          <div>
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
              Select concepts ({selectedConcepts.length} selected)
            </span>
            {concepts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No concepts available yet — generate a quiz first.</p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {concepts.map((c) => {
                  const isSelected = selectedConcepts.includes(c.conceptGroupId);
                  return (
                    <button
                      key={c.conceptGroupId}
                      onClick={() => toggleConcept(c.conceptGroupId)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                        isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                          {isSelected && <Check size={11} className="text-[#0a0f12]" />}
                        </div>
                        <span className="text-sm truncate">{c.conceptName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge>{courseNames[c.courseId] || c.courseId}</Badge>
                        <span className="text-xs text-[var(--color-text-faint)] font-mono">{c.questionCount}q</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {mode === 'RANDOM_MIX' && concepts && (
          <div className="space-y-5">
            <div>
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                Courses to draw from (leave empty for all)
              </span>
              <div className="flex flex-wrap gap-2">
                {courses.map((courseId) => (
                  <button
                    key={courseId}
                    onClick={() => toggleCourse(courseId)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                      selectedCourses.includes(courseId)
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)]'
                    }`}
                  >
                    {courseNames[courseId] || courseId}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
                Total questions: <span className="text-[var(--color-accent)] font-mono">{totalQuestions}</span>
              </span>
              <input
                type="range"
                min={5}
                max={100}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <p className="text-xs text-[var(--color-text-faint)] mt-1">
                Shuffled and sampled from the pool — if the pool has fewer questions than requested, all of them are used.
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--color-danger)] mt-4">{error}</p>}

        <Button onClick={handleCreate} disabled={creating} className="w-full mt-6">
          {creating ? 'Creating…' : 'Create quiz set'}
        </Button>
      </Card>

      {created && (
        <Card className="mb-6 !border-[var(--color-accent)]/40">
          <p className="text-sm text-[var(--color-accent)] font-medium mb-1">Created "{created.title}"</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {created.questionCount} questions · set ID: <span className="font-mono">{created.id}</span>
          </p>
        </Card>
      )}

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Your quiz sets</h2>
      {mySets === null && <div className="flex justify-center py-8"><Spinner /></div>}
      {mySets && mySets.length === 0 && <Card><p className="text-sm text-[var(--color-text-muted)]">No quiz sets created yet.</p></Card>}
      {mySets && mySets.length > 0 && (
        <div className="space-y-2">
          {mySets.map((s) => (
            <Card key={s.id} className="!p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{s.title}</p>
                  {s.priority && <Badge tone="warn">priority</Badge>}
                </div>
                <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                  {s.questionCount} questions · {s.assemblyMode === 'CONCEPT_SELECT' ? 'concept select' : s.assemblyMode === 'RANDOM_MIX' ? 'random mix' : 'generated'}
                </p>
              </div>
              <button
                onClick={() => togglePriority(s)}
                className={`p-2 rounded-lg transition-colors ${s.priority ? 'text-[var(--color-warn)] bg-[var(--color-warn)]/12' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'}`}
                title={s.priority ? 'Remove priority' : 'Mark as priority — students see this first'}
              >
                <Star size={15} fill={s.priority ? 'currentColor' : 'none'} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
