import { useEffect, useState } from 'react';
import { Shuffle, ListChecks, Check, Star, Archive, ArchiveRestore, Trash2, Info } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Badge, Spinner, Modal, ConfirmDialog } from '../../components/ui';
import QuestionTile from '../../components/QuestionTile';
import {
  getMyConcepts, createQuestionSet, getMyQuestionSets, getQuestionsInSet,
  setQuestionSetPriority, setQuestionSetArchived, deleteQuestionSet,
} from '../../api/questionSets';
import { getMyCourses } from '../../api/courses';

export default function MixQuiz() {
  const [mySets, setMySets] = useState(null);
  const [selectedSourceSets, setSelectedSourceSets] = useState([]); // quizzes chosen as the pool to mix from
  const [mode, setMode] = useState('CONCEPT_SELECT');
  const [concepts, setConcepts] = useState(null);
  const [conceptQuestions, setConceptQuestions] = useState({}); // conceptGroupId -> [questions]
  const [selectedConcepts, setSelectedConcepts] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [title, setTitle] = useState('');
  const [courses, setCourses] = useState(null);
  const [assignCourseIds, setAssignCourseIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  function refreshSets() {
    getMyQuestionSets({ page: 0, size: 50 }).then((data) => setMySets(data.content)).catch(() => setMySets([]));
  }

  useEffect(() => {
    refreshSets();
    getMyCourses().then((data) => setCourses(data.filter((c) => c.status !== 'ARCHIVED'))).catch(() => setCourses([]));
  }, []);

  function toggleSourceSet(setId) {
    setSelectedConcepts([]);
    setConcepts(null);
    setSelectedSourceSets((prev) => (prev.includes(setId) ? prev.filter((s) => s !== setId) : [...prev, setId]));
  }

  async function loadConceptsForSelection() {
    if (selectedSourceSets.length === 0) return;
    const data = await getMyConcepts(selectedSourceSets);
    setConcepts(data);
  }

  useEffect(() => {
    if (selectedSourceSets.length > 0) loadConceptsForSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSourceSets]);

  async function toggleConceptExpand(conceptGroupId) {
    if (conceptQuestions[conceptGroupId]) return; // already loaded
    // Load questions for all selected source sets, then filter to this concept client-side
    const allQuestions = (
      await Promise.all(selectedSourceSets.map((id) => getQuestionsInSet(id)))
    ).flat();
    const forConcept = allQuestions.filter((q) => q.conceptGroupId === conceptGroupId);
    setConceptQuestions((prev) => ({ ...prev, [conceptGroupId]: forConcept }));
  }

  function toggleConceptSelect(id) {
    setSelectedConcepts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleAssignCourse(courseId) {
    setAssignCourseIds((prev) => (prev.includes(courseId) ? prev.filter((c) => c !== courseId) : [...prev, courseId]));
  }

  async function handleCreate() {
    setError('');
    if (!title.trim()) { setError('Give this quiz a title.'); return; }
    if (assignCourseIds.length === 0) { setError('Select at least one course to assign this quiz to.'); return; }
    if (mode === 'CONCEPT_SELECT' && selectedConcepts.length === 0) { setError('Select at least one concept.'); return; }

    setCreating(true);
    try {
      const sourceCourseIds = mode === 'RANDOM_MIX'
        ? [...new Set((concepts || []).map((c) => c.courseId))]
        : undefined;

      const payload = {
        title,
        mode,
        conceptGroupIds: mode === 'CONCEPT_SELECT' ? selectedConcepts : undefined,
        sourceCourseIds,
        totalQuestions: mode === 'RANDOM_MIX' ? totalQuestions : undefined,
        assignCourseIds,
      };
      const result = await createQuestionSet(payload);
      setCreated(result);
      setTitle('');
      setSelectedConcepts([]);
      setAssignCourseIds([]);
      setSelectedSourceSets([]);
      setConcepts(null);
      refreshSets();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create quiz set.');
    } finally {
      setCreating(false);
    }
  }

  async function togglePriority(set) {
    await setQuestionSetPriority(set.id, !set.priority);
    refreshSets();
  }

  async function toggleArchive(set) {
    await setQuestionSetArchived(set.id, set.status !== 'ARCHIVED');
    refreshSets();
  }

  async function handleDelete(set) {
    setDeleteError('');
    try {
      await deleteQuestionSet(set.id);
      setConfirmDelete(null);
      refreshSets();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Could not delete this quiz.');
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Mix a quiz</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Pick which existing quizzes to draw from — only their concepts and questions will show up,
        so you're never scrolling through your entire question bank.
      </p>

      {/* Step 1 — pick source quizzes */}
      <Card className="mb-6">
        <h2 className="font-[var(--font-display)] font-semibold mb-1 text-sm">1. Select quizzes to mix from</h2>
        <p className="text-xs text-[var(--color-text-faint)] mb-4">Choose one or more existing quizzes as the source pool.</p>

        {mySets === null && <div className="flex justify-center py-8"><Spinner /></div>}
        {mySets && mySets.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No quizzes yet — generate one first.</p>}

        {mySets && mySets.length > 0 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {mySets.map((s) => {
              const isSelected = selectedSourceSets.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSourceSet(s.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                    isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-accent-dim)]'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                      {isSelected && <Check size={11} className="text-[#0a0f12]" />}
                    </div>
                    <span className="text-sm truncate">{s.title}</span>
                  </div>
                  <span className="text-xs text-[var(--color-text-faint)] font-mono shrink-0">{s.questionCount}q</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Step 2 — pick assembly mode + concepts, only once quizzes are selected */}
      {selectedSourceSets.length > 0 && (
        <Card className="mb-6">
          <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">2. Build the new quiz</h2>

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
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Choose exactly which concepts to include.</p>
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
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Shuffle the selected quizzes and sample N questions.</p>
              </div>
            </button>
          </div>

          <Input label="Quiz title" placeholder="e.g. Midterm review mix" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-5" />

          {concepts === null && <div className="flex justify-center py-8"><Spinner /></div>}

          {mode === 'CONCEPT_SELECT' && concepts && (
            <div className="mb-5">
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                Concepts from selected quizzes ({selectedConcepts.length} selected)
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {concepts.map((c) => {
                  const isSelected = selectedConcepts.includes(c.conceptGroupId);
                  const isExpanded = !!conceptQuestions[c.conceptGroupId];
                  return (
                    <div key={c.conceptGroupId} className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                      <button
                        onClick={() => { toggleConceptSelect(c.conceptGroupId); toggleConceptExpand(c.conceptGroupId); }}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-[var(--color-accent)]/8' : 'hover:bg-[var(--color-surface-raised)]'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                            {isSelected && <Check size={11} className="text-[#0a0f12]" />}
                          </div>
                          <span className="text-sm truncate">{c.conceptName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge>{c.courseId}</Badge>
                          <span className="text-xs text-[var(--color-text-faint)] font-mono">{c.questionCount}q</span>
                        </div>
                      </button>
                      {isExpanded && conceptQuestions[c.conceptGroupId].length > 0 && (
                        <div className="p-3 space-y-2 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
                          {conceptQuestions[c.conceptGroupId].map((q) => (
                            <QuestionTile key={q.id} question={q} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'RANDOM_MIX' && concepts && (
            <div className="mb-5">
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wide">
                Total questions: <span className="text-[var(--color-accent)] font-mono">{totalQuestions}</span>
              </span>
              <input
                type="range"
                min={5}
                max={Math.max(concepts.reduce((sum, c) => sum + c.questionCount, 0), 5)}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <p className="text-xs text-[var(--color-text-faint)] mt-1 flex items-center gap-1.5">
                <Info size={12} /> Sampled from the {concepts.reduce((sum, c) => sum + c.questionCount, 0)} questions across your selected quizzes.
              </p>
            </div>
          )}

          <div className="mb-5">
            <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
              Assign to course(s) — this quiz can be shared across multiple
            </span>
            <div className="flex flex-wrap gap-2">
              {courses?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleAssignCourse(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    assignCourseIds.includes(c.id)
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}

          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? 'Creating…' : 'Create quiz set'}
          </Button>
        </Card>
      )}

      {created && (
        <Card className="mb-6 !border-[var(--color-accent)]/40">
          <p className="text-sm text-[var(--color-accent)] font-medium mb-1">Created "{created.title}"</p>
          <p className="text-xs text-[var(--color-text-muted)]">{created.questionCount} questions</p>
        </Card>
      )}

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Your quizzes</h2>
      {mySets && mySets.length > 0 && (
        <div className="space-y-2">
          {mySets.map((s) => {
            const archived = s.status === 'ARCHIVED';
            return (
              <Card key={s.id} className="!p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.title}</p>
                    {s.priority && <Badge tone="warn">priority</Badge>}
                    {archived && <Badge>archived</Badge>}
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                    {s.questionCount} questions · {s.assemblyMode === 'CONCEPT_SELECT' ? 'concept select' : s.assemblyMode === 'RANDOM_MIX' ? 'random mix' : 'generated'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePriority(s)} title={s.priority ? 'Remove priority' : 'Mark as priority'} className={`p-2 rounded-lg ${s.priority ? 'text-[var(--color-warn)] bg-[var(--color-warn)]/12' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'}`}>
                    <Star size={15} fill={s.priority ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => toggleArchive(s)} title={archived ? 'Reactivate' : 'Archive'} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warn)] hover:bg-[var(--color-surface-raised)]">
                    {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                  <button onClick={() => setConfirmDelete(s)} title="Delete" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.title}"?`}
          message={deleteError || 'This permanently deletes the quiz. Only possible if no student has attempted it — archive it instead to preserve results.'}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => { setConfirmDelete(null); setDeleteError(''); }}
        />
      )}
    </DashboardShell>
  );
}
