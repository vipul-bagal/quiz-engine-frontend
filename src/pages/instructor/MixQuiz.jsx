import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shuffle, ListChecks, Check, Star, Archive, ArchiveRestore, Trash2, Info, Send, Lock, Globe, Users2, Settings, User } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Badge, Spinner, Modal } from '../../components/ui';
import QuestionTile from '../../components/QuestionTile';
import useGenerationLock from '../../components/useGenerationLock';
import GenerationLockScreen from '../../components/GenerationLockScreen';
import {
  getMyConcepts, createQuestionSet, getMyQuestionSets, getQuestionsInSet,
  setQuestionSetPriority, setQuestionSetArchived, deleteQuestionSet,
  publishQuestionSet, unpublishQuestionSet, updateQuestionSetVisibility,
  getQuizAccessRequests, decideQuizAccessRequest, grantQuizStudentAccess,
} from '../../api/questionSets';
import { getMyCourses } from '../../api/courses';
import { getAllStudents } from '../../api/users';

export default function MixQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forStudentId = searchParams.get('forStudentId');
  const forStudentName = searchParams.get('forStudentName');
  const [mySets, setMySets] = useState(null);
  const [selectedSourceSets, setSelectedSourceSets] = useState([]);
  const [mode, setMode] = useState('CONCEPT_SELECT');
  const [concepts, setConcepts] = useState(null);
  const [conceptQuestions, setConceptQuestions] = useState({});
  const [selectedConcepts, setSelectedConcepts] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courses, setCourses] = useState(null);
  const [assignCourseIds, setAssignCourseIds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [publishingSet, setPublishingSet] = useState(null);
  const [managingAccessSet, setManagingAccessSet] = useState(null);

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
    if (conceptQuestions[conceptGroupId]) return;
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
    if (mode === 'CONCEPT_SELECT' && selectedConcepts.length === 0) { setError('Select at least one concept.'); return; }

    setCreating(true);
    try {
      const sourceCourseIds = mode === 'RANDOM_MIX'
        ? [...new Set((concepts || []).map((c) => c.courseId))] // still real IDs, used only for the backend sourceCourseIds filter — never displayed
        : undefined;

      const payload = {
        title,
        description,
        mode,
        conceptGroupIds: mode === 'CONCEPT_SELECT' ? selectedConcepts : undefined,
        sourceCourseIds,
        totalQuestions: mode === 'RANDOM_MIX' ? totalQuestions : undefined,
        assignCourseIds,
      };
      const result = await createQuestionSet(payload);

      if (forStudentId) {
        // Skip the normal draft-then-manually-publish flow: this quiz exists
        // specifically for one student, so publish it Restricted and grant
        // them access immediately, then send the instructor back to that
        // student's page rather than leaving them in the general quiz list.
        await publishQuestionSet(result.id, { visibility: 'RESTRICTED', preApprovedStudentIds: [] });
        await grantQuizStudentAccess(result.id, Number(forStudentId));
        navigate(`/instructor/students/${forStudentId}`, { state: { quizCreated: title } });
        return;
      }

      setCreated(result);
      setTitle('');
      setDescription('');
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

  async function handleUnpublish(set) {
    if (!confirm('Unpublish this quiz? Students will immediately lose access.')) return;
    await unpublishQuestionSet(set.id);
    refreshSets();
  }

  async function handleDelete(set) {
    if (!confirm(`Delete "${set.title}"? This cannot be undone.`)) return;
    try {
      await deleteQuestionSet(set.id);
      refreshSets();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete this quiz.');
    }
  }

  const { activeJob, checked, refresh: refreshLock } = useGenerationLock();

  if (!checked) return null;
  if (activeJob) {
    return (
      <DashboardShell navGroups={instructorNavGroups}>
        <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Mix a quiz</h1>
        <GenerationLockScreen activeJob={activeJob} courses={courses} onCancelled={refreshLock} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Mix a quiz</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Pick which existing quizzes to draw from — only their concepts and questions will show up,
        so you're never scrolling through your entire question bank.
      </p>

      {forStudentId && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-accent)]/40 flex items-center gap-3">
          <User size={16} className="text-[var(--color-accent)] shrink-0" />
          <p className="text-sm">
            Building a private quiz for <span className="font-medium">{forStudentName}</span>. It will publish as
            Restricted and grant them access automatically once created — no separate publish step needed.
          </p>
        </Card>
      )}

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

          <Input label="Quiz title" placeholder="e.g. Midterm review mix" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-4" />
          <Input label="Description (optional)" placeholder="What this quiz covers" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-5" />

          {concepts === null && <div className="flex justify-center py-8"><Spinner /></div>}

          {mode === 'CONCEPT_SELECT' && concepts && (
            <div className="mb-5">
              <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                Concepts from selected quizzes ({selectedConcepts.length} selected)
              </span>
              {concepts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No concepts available yet — generate a quiz first.</p>
              ) : (
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                                {isSelected && <Check size={11} className="text-[#0a0f12]" />}
                              </div>
                              <span className="text-sm truncate">{c.conceptName}</span>
                            </div>
                            {(c.mastered > 0 || c.guessed > 0 || c.notUnderstood > 0 || c.insufficientData > 0) && (
                              <div className="flex flex-wrap gap-1 pl-6">
                                {c.mastered > 0 && <Badge tone="accent">{c.mastered} mastered</Badge>}
                                {c.guessed > 0 && <Badge tone="warn">{c.guessed} guessed</Badge>}
                                {c.notUnderstood > 0 && <Badge tone="danger">{c.notUnderstood} not understood</Badge>}
                                {c.insufficientData > 0 && <Badge>{c.insufficientData} not enough data</Badge>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge>{c.courseName}</Badge>
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
              )}
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
              Assign to course(s) — optional
            </span>
            <p className="text-xs text-[var(--color-text-faint)] mb-2.5">
              Leave none selected to make this a standalone quiz with no course — visibility (Open/Restricted) then
              controls who can see it directly, independent of any course enrollment.
            </p>
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
            {assignCourseIds.length === 0 && (
              <p className="text-xs text-[var(--color-warn)] mt-2.5">
                No course selected — this will be created as a standalone quiz.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}

          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? 'Creating…' : 'Create quiz set (saved as draft)'}
          </Button>
        </Card>
      )}

      {created && (
        <Card className="mb-6 !border-[var(--color-accent)]/40">
          <p className="text-sm text-[var(--color-accent)] font-medium mb-1">Created "{created.title}" as a draft</p>
          <p className="text-xs text-[var(--color-text-muted)]">Publish it below when you're ready for students to take it.</p>
        </Card>
      )}

      <h2 className="font-[var(--font-display)] font-semibold mb-4 text-sm">Your quizzes</h2>
      {mySets && mySets.length > 0 && (
        <div className="space-y-2">
          {mySets.map((s) => {
            const archived = s.status === 'ARCHIVED';
            const published = s.publishStatus === 'PUBLISHED';
            return (
              <Card key={s.id} variant="elevated" className="!p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{s.title}</p>
                      <Badge tone={published ? 'accent' : 'default'}>{published ? 'published' : 'draft'}</Badge>
                      {published && (
                        <Badge tone={s.visibility === 'RESTRICTED' ? 'warn' : 'default'}>
                          {s.visibility === 'RESTRICTED' ? <><Lock size={10} className="inline mr-1" />restricted</> : <><Globe size={10} className="inline mr-1" />open</>}
                        </Badge>
                      )}
                      {s.priority && <Badge tone="warn">priority</Badge>}
                      {archived && <Badge>archived</Badge>}
                    </div>
                    <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                      {s.questionCount} questions · {s.courseNames?.join(', ') || 'standalone (no course)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/instructor/quiz/${s.id}`)} title="Manage (collaborators, access, questions)" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]">
                      <Settings size={15} />
                    </button>
                    {!published && (
                      <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setPublishingSet(s)}>
                        <Send size={12} /> Publish
                      </Button>
                    )}
                    {published && s.visibility === 'RESTRICTED' && (
                      <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setManagingAccessSet(s)}>
                        <Users2 size={12} /> Access
                      </Button>
                    )}
                    {published && (
                      <button onClick={() => handleUnpublish(s)} title="Unpublish (revert to draft)" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warn)] hover:bg-[var(--color-surface-raised)]">
                        <ArchiveRestore size={15} />
                      </button>
                    )}
                    <button onClick={() => togglePriority(s)} title={s.priority ? 'Remove priority' : 'Mark as priority'} className={`p-2 rounded-lg ${s.priority ? 'text-[var(--color-warn)] bg-[var(--color-warn)]/12' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'}`}>
                      <Star size={15} fill={s.priority ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => toggleArchive(s)} title={archived ? 'Reactivate' : 'Archive'} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warn)] hover:bg-[var(--color-surface-raised)]">
                      {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                    </button>
                    <button onClick={() => handleDelete(s)} title="Delete" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {publishingSet && (
        <PublishModal
          set={publishingSet}
          onClose={() => setPublishingSet(null)}
          onPublished={() => { setPublishingSet(null); refreshSets(); }}
        />
      )}

      {managingAccessSet && (
        <AccessRequestsModal
          set={managingAccessSet}
          onClose={() => setManagingAccessSet(null)}
        />
      )}
    </DashboardShell>
  );
}

function PublishModal({ set, onClose, onPublished }) {
  const [visibility, setVisibility] = useState('OPEN');
  const [students, setStudents] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  function toggleStudent(id) {
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handlePublish() {
    setSaving(true);
    setError('');
    try {
      await publishQuestionSet(set.id, {
        visibility,
        preApprovedStudentIds: visibility === 'RESTRICTED' ? selectedStudentIds : undefined,
      });
      onPublished();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not publish quiz.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-1">Publish "{set.title}"</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Choose who can take this quiz once it's live.</p>

      {(!set.courseNames || set.courseNames.length === 0) && (
        <p className="text-xs text-[var(--color-warn)] mb-4">
          This is a standalone quiz with no course assigned — visibility below controls access directly.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-5">
        <button onClick={() => setVisibility('OPEN')} className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-left ${visibility === 'OPEN' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)]'}`}>
          <Globe size={16} className={visibility === 'OPEN' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
          <div>
            <p className="text-sm font-medium">Open</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {(!set.courseNames || set.courseNames.length === 0)
                ? 'Any logged-in student can take it — no enrollment required.'
                : 'Any enrolled student in the assigned course(s) can take it.'}
            </p>
          </div>
        </button>
        <button onClick={() => setVisibility('RESTRICTED')} className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-left ${visibility === 'RESTRICTED' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)]'}`}>
          <Lock size={16} className={visibility === 'RESTRICTED' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
          <div>
            <p className="text-sm font-medium">Restricted</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Only students you approve (below, or later) can take it.</p>
          </div>
        </button>
      </div>

      {visibility === 'RESTRICTED' && (
        <div className="mb-5">
          <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Pre-approve students (optional — you can also approve requests later)
          </span>
          {students === null ? <Spinner size={16} /> : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {students.map((s) => {
                const selected = selectedStudentIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleStudent(s.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-sm ${selected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)]'}`}>
                    <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${selected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                      {selected && <Check size={11} className="text-[#0a0f12]" />}
                    </div>
                    {s.fullName} <span className="text-[var(--color-text-faint)]">({s.email})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handlePublish} disabled={saving}>{saving ? 'Publishing…' : 'Publish quiz'}</Button>
      </div>
    </Modal>
  );
}

function AccessRequestsModal({ set, onClose }) {
  const [requests, setRequests] = useState(null);

  function refresh() {
    getQuizAccessRequests(set.id).then(setRequests).catch(() => setRequests([]));
  }

  useEffect(() => { refresh(); }, [set.id]);

  async function handleDecision(requestId, decision) {
    await decideQuizAccessRequest(set.id, requestId, decision);
    refresh();
  }

  const pending = requests?.filter((r) => r.status === 'PENDING') || [];
  const approved = requests?.filter((r) => r.status === 'APPROVED') || [];

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">Access requests — {set.title}</h3>

      {requests === null && <div className="flex justify-center py-6"><Spinner size={16} /></div>}

      {requests && pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[var(--color-warn)] mb-2">Pending</p>
          <div className="space-y-1.5">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]">
                <span className="text-sm" title={r.studentEmail}>{r.studentName}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDecision(r.id, 'approve')} className="p-1.5 rounded-md text-[var(--color-accent)] hover:bg-[var(--color-accent)]/12"><Check size={14} /></button>
                  <button onClick={() => handleDecision(r.id, 'reject')} className="p-1.5 rounded-md text-[var(--color-danger)] hover:bg-[var(--color-danger)]/12">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests && (
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Approved ({approved.length})</p>
          {approved.length === 0 ? (
            <p className="text-xs text-[var(--color-text-faint)]">No students approved yet.</p>
          ) : approved.map((r) => (
            <div key={r.id} className="px-3 py-1.5 text-sm text-[var(--color-text-muted)]" title={r.studentEmail}>{r.studentName}</div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
