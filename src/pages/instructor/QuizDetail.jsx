import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, ArchiveRestore, Archive, Star, Globe, Lock, Users2,
  UserPlus, X, Check, ListChecks, FileText, RefreshCw, ShieldCheck, Pencil, Paperclip, Plus, Image as ImageIcon,
} from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Badge, Spinner, Modal, Select, StatCard, Input } from '../../components/ui';
import QuestionTile from '../../components/QuestionTile';
import MaterialsManager from '../../components/MaterialsManager';
import CreateManualQuestionModal from '../../components/CreateManualQuestionModal';
import {
  getQuizDetail, publishQuestionSet, unpublishQuestionSet, updateQuestionSetVisibility,
  setQuestionSetPriority, setQuestionSetArchived, addQuizCollaborator, removeQuizCollaborator,
  grantQuizStudentAccess, revokeQuizStudentAccess, getQuestionsForManagement, getConceptsForManagement,
  toggleQuestionInclusion, toggleConceptInclusion, resetStudentQuizProgress, getMyQuestionSets, editQuestionSet,
} from '../../api/questionSets';
import { deleteQuestion } from '../../api/questions';
import { getAllInstructors, getAllStudents } from '../../api/users';

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState(null); // null | 'concepts' | 'questions'
  const [showPublish, setShowPublish] = useState(false);
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [showManageAccess, setShowManageAccess] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [grantBanner, setGrantBanner] = useState('');

  function refresh() {
    setError('');    getQuizDetail(id)
      .then(setDetail)
      .catch((err) => setError(err.response?.data?.error || 'Could not load this quiz.'));
  }

  useEffect(() => { refresh(); }, [id]);

  useEffect(() => {
    if (!grantBanner) return;
    const timer = setTimeout(() => setGrantBanner(''), 6000);
    return () => clearTimeout(timer);
  }, [grantBanner]);

  async function handleUnpublish() {
    if (!confirm('Unpublish this quiz? Students will immediately lose access, though their existing history stays intact.')) return;
    await unpublishQuestionSet(id);
    refresh();
  }

  async function handleDiscard() {
    const archiving = detail.status !== 'ARCHIVED';
    if (archiving && !confirm('Discard this quiz? It becomes inactive and invisible to students, but nothing is deleted.')) return;
    await setQuestionSetArchived(id, archiving);
    refresh();
  }

  async function handlePriorityToggle() {
    await setQuestionSetPriority(id, !detail.priority);
    refresh();
  }

  async function handleVisibilityToggle() {
    await updateQuestionSetVisibility(id, detail.visibility === 'RESTRICTED' ? 'OPEN' : 'RESTRICTED');
    refresh();
  }

  if (error) {
    return (
      <DashboardShell navGroups={instructorNavGroups}>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
          <ArrowLeft size={13} /> Back
        </button>
        <Card variant="elevated" className="!border-[var(--color-danger)]/40"><p className="text-sm text-[var(--color-danger)]">{error}</p></Card>
      </DashboardShell>
    );
  }

  if (!detail) {
    return (
      <DashboardShell navGroups={instructorNavGroups}>
        <div className="flex justify-center py-20"><Spinner /></div>
      </DashboardShell>
    );
  }

  const isOwner = detail.myEditAccessStatus === 'OWNER';
  const published = detail.publishStatus === 'PUBLISHED';
  const archived = detail.status === 'ARCHIVED';

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={13} /> Back
      </button>

      {grantBanner && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-accent)]/40 !py-3.5 flex items-center justify-between">
          <p className="text-sm text-[var(--color-accent)]">{grantBanner}</p>
          <button onClick={() => setGrantBanner('')} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
            <X size={15} />
          </button>
        </Card>
      )}

      <div className="flex items-start justify-between gap-4 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="font-[var(--font-display)] text-[30px] font-semibold tracking-tight truncate">{detail.title}</h1>
          <button
            onClick={() => setShowEdit(true)}
            className="shrink-0 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1.5"
          >
            <Pencil size={13} /> Edit
          </button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge tone={published ? 'accent' : 'default'}>{published ? 'published' : 'draft'}</Badge>
          {published && (
            <Badge tone={detail.visibility === 'RESTRICTED' ? 'warn' : 'default'}>
              {detail.visibility === 'RESTRICTED' ? 'restricted' : 'open'}
            </Badge>
          )}
          {detail.assignedCourses.length === 0 && <Badge tone="warn">Standalone</Badge>}
          {detail.priority && <Badge tone="warn">priority</Badge>}
          {archived && <Badge tone="danger">discarded</Badge>}
        </div>
      </div>
      {detail.description && <p className="text-[var(--color-text-muted)] mb-2">{detail.description}</p>}
      <p className="text-xs text-[var(--color-text-faint)] font-mono mb-6" title={detail.creatorEmail}>
        by {detail.creatorName} · {detail.assignedCourses.map((c) => c.name).join(', ') || 'standalone — no course, visible per its Open/Restricted setting'}
      </p>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {!published && (
          <Button onClick={() => setShowPublish(true)}><Send size={14} /> Publish</Button>
        )}
        {published && (
          <Button variant="secondary" onClick={handleUnpublish}><ArchiveRestore size={14} /> Unpublish</Button>
        )}
        {published && (
          <Button variant="secondary" onClick={handleVisibilityToggle}>
            {detail.visibility === 'RESTRICTED' ? <Globe size={14} /> : <Lock size={14} />}
            {detail.visibility === 'RESTRICTED' ? 'Make open' : 'Make restricted'}
          </Button>
        )}
        <Button variant="secondary" onClick={handlePriorityToggle}>
          <Star size={14} fill={detail.priority ? 'currentColor' : 'none'} />
          {detail.priority ? 'Remove priority' : 'Mark priority'}
        </Button>
        {isOwner && (
          <Button variant={archived ? 'secondary' : 'danger'} onClick={handleDiscard}>
            {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {archived ? 'Reactivate' : 'Discard'}
          </Button>
        )}
      </div>

      {/* Concepts / Questions / Materials tiles */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button onClick={() => setView(view === 'concepts' ? null : 'concepts')} className="text-left">
          <StatCard label="Concepts" icon={ListChecks} value="View" sub="click to choose which to include" />
        </button>
        <button onClick={() => setView(view === 'questions' ? null : 'questions')} className="text-left">
          <StatCard label="Questions" icon={FileText} value={`${detail.includedQuestionCount}/${detail.totalQuestionCount}`} sub="click to choose which to include" />
        </button>
        <button onClick={() => setView(view === 'materials' ? null : 'materials')} className="text-left">
          <StatCard label="Materials" icon={Paperclip} value="Manage" sub="source docs, pictures, and post-quiz files" />
        </button>
      </div>

      {view === 'concepts' && <ConceptInclusionView quizId={id} onChanged={refresh} />}
      {view === 'questions' && <QuestionInclusionView quizId={id} courseId={detail.assignedCourses[0]?.id} onChanged={refresh} />}
      {view === 'materials' && <MaterialsManager quizId={id} />}

      {/* Collaborators */}
      <div className="flex items-center justify-between mb-3 mt-8">
        <h2 className="font-[var(--font-display)] font-semibold text-sm flex items-center gap-1.5">
          <ShieldCheck size={14} /> Collaborators
        </h2>
        {isOwner && (
          <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setShowAddCollaborator(true)}>
            <UserPlus size={12} /> Add editor
          </Button>
        )}
      </div>
      {detail.collaborators.length === 0 ? (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No collaborators yet — {detail.creatorName} is the only editor.</p></Card>
      ) : (
        <div className="space-y-2 mb-8">
          {detail.collaborators.map((c) => (
            <Card key={c.id} className="!p-3.5 flex items-center justify-between">
              <span className="text-sm" title={c.instructorEmail}>{c.instructorName}</span>
              {isOwner && (
                <button
                  onClick={async () => { await removeQuizCollaborator(id, c.id); refresh(); }}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]"
                >
                  <X size={14} />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Student access */}
      <div className="flex items-center justify-between mb-3 mt-8">
        <h2 className="font-[var(--font-display)] font-semibold text-sm flex items-center gap-1.5">
          <Users2 size={14} /> Student access
        </h2>
        <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setShowManageAccess(true)}>
          <UserPlus size={12} /> Manage students
        </Button>
      </div>
      {detail.approvedStudents.length === 0 ? (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No students explicitly granted access yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {detail.approvedStudents.map((s) => (
            <Card key={s.id} className="!p-3.5 flex items-center justify-between">
              <span className="text-sm" title={s.studentEmail}>{s.studentName}</span>
              <button
                onClick={async () => { await revokeQuizStudentAccess(id, s.id); refresh(); }}
                className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]"
              >
                <X size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showPublish && (
        <PublishModal quizId={id} isStandalone={detail.assignedCourses.length === 0} onClose={() => setShowPublish(false)} onPublished={() => { setShowPublish(false); refresh(); }} />
      )}
      {showAddCollaborator && (
        <AddCollaboratorModal quizId={id} onClose={() => setShowAddCollaborator(false)} onAdded={() => { setShowAddCollaborator(false); refresh(); }} />
      )}
      {showManageAccess && (
        <ManageAccessModal
          quizId={id}
          currentQuizTitle={detail.title}
          onClose={() => setShowManageAccess(false)}
          onGranted={(msg) => { setShowManageAccess(false); setGrantBanner(msg); refresh(); }}
        />
      )}
      {showEdit && (
        <EditQuizModal quiz={detail} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refresh(); }} />
      )}
    </DashboardShell>
  );
}

function EditQuizModal({ quiz, onClose, onSaved }) {
  const [title, setTitle] = useState(quiz.title || '');
  const [description, setDescription] = useState(quiz.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) { setError('Quiz title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await editQuestionSet(quiz.id, { title: title.trim(), description });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">Edit quiz</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Quiz title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="block">
          <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] outline-none transition-colors resize-none"
            placeholder="What's this quiz about?"
          />
        </label>
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ConceptInclusionView({ quizId, onChanged }) {
  const [concepts, setConcepts] = useState(null);

  function refresh() {
    getConceptsForManagement(quizId).then(setConcepts).catch(() => setConcepts([]));
  }

  useEffect(() => { refresh(); }, [quizId]);

  async function toggle(conceptGroupId, included) {
    await toggleConceptInclusion(quizId, conceptGroupId, included);
    refresh();
    onChanged();
  }

  if (!concepts) return <div className="flex justify-center py-8 mb-8"><Spinner /></div>;

  return (
    <Card variant="elevated" className="mb-8">
      <h3 className="font-[var(--font-display)] font-semibold mb-1 text-sm">Concept inclusion</h3>
      <p className="text-xs text-[var(--color-text-faint)] mb-4">Toggling a concept includes/excludes all its question variants. New sessions only draw from included questions.</p>
      <div className="space-y-1.5">
        {concepts.map((c) => {
          const allIncluded = c.includedQuestions === c.totalQuestions;
          const noneIncluded = c.includedQuestions === 0;
          return (
            <button
              key={c.conceptGroupId}
              onClick={() => toggle(c.conceptGroupId, !allIncluded)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent-dim)] text-left transition-colors"
            >
              <div className="min-w-0 flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${allIncluded ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : noneIncluded ? 'border-[var(--color-border)]' : 'border-[var(--color-warn)] bg-[var(--color-warn)]/30'}`}>
                  {allIncluded && <Check size={11} className="text-[#0a0f12]" />}
                </div>
                <span className="text-sm truncate">{c.conceptName}</span>
              </div>
              <span className="text-xs text-[var(--color-text-faint)] font-mono shrink-0">{c.includedQuestions}/{c.totalQuestions} included</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function QuestionInclusionView({ quizId, courseId, onChanged }) {
  const [items, setItems] = useState(null);
  const [concepts, setConcepts] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pictureExpanded, setPictureExpanded] = useState(true);

  const pictureItems = items?.filter((item) => item.question.imageStorageKey) || [];
  const textItems = items?.filter((item) => !item.question.imageStorageKey) || [];

  function refresh() {
    getQuestionsForManagement(quizId).then(setItems).catch(() => setItems([]));
    getConceptsForManagement(quizId).then(setConcepts).catch(() => setConcepts([]));
  }

  useEffect(() => { refresh(); }, [quizId]);

  async function toggle(itemId, included) {
    await toggleQuestionInclusion(quizId, itemId, included);
    refresh();
    onChanged();
  }

  async function handleDelete(questionId) {
    if (!confirm('Delete this question? This only works for questions you added manually.')) return;
    await deleteQuestion(questionId);
    refresh();
    onChanged();
  }

  if (!items) return <div className="flex justify-center py-8 mb-8"><Spinner /></div>;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-[var(--font-display)] font-semibold text-sm">Question inclusion</h3>
        <button onClick={() => setShowCreate(true)} className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1">
          <Plus size={12} /> Add question
        </button>
      </div>
      <p className="text-xs text-[var(--color-text-faint)] mb-4">Check the box to include a question — new sessions only draw from checked questions.</p>

      {pictureItems.length > 0 && (
        <div className="mb-4">
          <button onClick={() => setPictureExpanded((e) => !e)} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] mb-2">
            <ImageIcon size={12} /> Picture-based questions ({pictureItems.length}) {pictureExpanded ? '▾' : '▸'}
          </button>
          {pictureExpanded && (
            <div className="space-y-2">
              {pictureItems.map((item) => (
                <QuestionTile
                  key={item.itemId}
                  question={item.question}
                  selectable
                  selected={item.included}
                  onToggleSelect={() => toggle(item.itemId, !item.included)}
                  onUpdated={refresh}
                  onDeleted={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {textItems.map((item) => (
          <QuestionTile
            key={item.itemId}
            question={item.question}
            selectable
            selected={item.included}
            onToggleSelect={() => toggle(item.itemId, !item.included)}
            onUpdated={refresh}
            onDeleted={handleDelete}
          />
        ))}
      </div>

      {showCreate && (
        <CreateManualQuestionModal
          quizId={quizId}
          courseId={courseId}
          existingConcepts={concepts}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refresh(); onChanged(); }}
        />
      )}
    </div>
  );
}

function PublishModal({ quizId, isStandalone, onClose, onPublished }) {
  const [visibility, setVisibility] = useState('OPEN');
  const [students, setStudents] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getAllStudents().then(setStudents).catch(() => setStudents([])); }, []);

  function toggleStudent(sid) {
    setSelectedStudentIds((prev) => (prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid]));
  }

  async function handlePublish() {
    setSaving(true);
    setError('');
    try {
      await publishQuestionSet(quizId, { visibility, preApprovedStudentIds: visibility === 'RESTRICTED' ? selectedStudentIds : undefined });
      onPublished();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not publish quiz.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-1">Publish this quiz</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Choose who can take it once it's live.</p>

      {isStandalone && (
        <p className="text-xs text-[var(--color-warn)] mb-4">
          This is a standalone quiz with no course assigned — visibility below controls access directly.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-5">
        <button onClick={() => setVisibility('OPEN')} className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-left ${visibility === 'OPEN' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)]'}`}>
          <Globe size={16} className={visibility === 'OPEN' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
          <div><p className="text-sm font-medium">Open</p><p className="text-xs text-[var(--color-text-muted)] mt-0.5">{isStandalone ? 'Any logged-in student can take it — no enrollment required.' : 'Any enrolled student can take it.'}</p></div>
        </button>
        <button onClick={() => setVisibility('RESTRICTED')} className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-left ${visibility === 'RESTRICTED' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)]'}`}>
          <Lock size={16} className={visibility === 'RESTRICTED' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
          <div><p className="text-sm font-medium">Restricted</p><p className="text-xs text-[var(--color-text-muted)] mt-0.5">Only approved students can take it.</p></div>
        </button>
      </div>

      {visibility === 'RESTRICTED' && (
        <div className="mb-5">
          <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Pre-approve students (optional)</span>
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
        <Button onClick={handlePublish} disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</Button>
      </div>
    </Modal>
  );
}

function AddCollaboratorModal({ quizId, onClose, onAdded }) {
  const [instructors, setInstructors] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getAllInstructors().then(setInstructors).catch(() => setInstructors([])); }, []);

  async function handleAdd() {
    if (!selectedId) { setError('Select an instructor.'); return; }
    setSaving(true);
    setError('');
    try {
      await addQuizCollaborator(quizId, Number(selectedId));
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add collaborator.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">Add an editor</h3>
      {instructors === null ? <div className="flex justify-center py-6"><Spinner size={16} /></div> : (
        <Select label="Instructor" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mb-4">
          <option value="">Select an instructor…</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.fullName} ({i.email})</option>
          ))}
        </Select>
      )}
      {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding…' : 'Add editor'}</Button>
      </div>
    </Modal>
  );
}

function ManageAccessModal({ quizId, currentQuizTitle, onClose, onGranted }) {
  const [students, setStudents] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [otherQuizzes, setOtherQuizzes] = useState(null);
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getAllStudents().then(setStudents).catch(() => setStudents([]));
    getMyQuestionSets({ page: 0, size: 100 }).then((data) => {
      setOtherQuizzes(data.content.filter((s) => s.id !== quizId && s.visibility === 'RESTRICTED' && s.publishStatus === 'PUBLISHED'));
    }).catch(() => setOtherQuizzes([]));
  }, [quizId]);

  function toggleQuiz(quizIdToToggle) {
    setSelectedQuizIds((prev) => (prev.includes(quizIdToToggle) ? prev.filter((q) => q !== quizIdToToggle) : [...prev, quizIdToToggle]));
  }

  async function handleGrant() {
    if (!selectedId) { setError('Select a student.'); return; }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await grantQuizStudentAccess(quizId, Number(selectedId));
      for (const otherId of selectedQuizIds) {
        await grantQuizStudentAccess(otherId, Number(selectedId));
      }
      const student = students.find((s) => String(s.id) === selectedId);
      const quizCount = 1 + selectedQuizIds.length;
      onGranted(`Access granted to ${student?.fullName} for ${quizCount === 1 ? currentQuizTitle : `${quizCount} quizzes`}.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not grant access.');
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!selectedId) { setError('Select a student.'); return; }
    setResetting(true);
    setError('');
    setMessage('');
    try {
      await resetStudentQuizProgress(quizId, Number(selectedId));
      setMessage('Progress reset — this quiz is now fresh for that student.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset progress.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-1">Manage a student</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Grant access to this restricted quiz (and optionally others), or reset a student's progress so it appears fresh to them again.</p>
      {students === null ? <div className="flex justify-center py-6"><Spinner size={16} /></div> : (
        <Select label="Student" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mb-4">
          <option value="">Select a student…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>
          ))}
        </Select>
      )}

      {otherQuizzes && otherQuizzes.length > 0 && (
        <div className="mb-4">
          <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
            Also grant access to (optional) — always includes "{currentQuizTitle}"
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {otherQuizzes.map((q) => {
              const selected = selectedQuizIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => toggleQuiz(q.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-sm ${selected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/8' : 'border-[var(--color-border)]'}`}
                >
                  <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${selected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                    {selected && <Check size={11} className="text-[#0a0f12]" />}
                  </div>
                  {q.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {message && <p className="text-sm text-[var(--color-accent)] mb-4">{message}</p>}
      {error && <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button variant="secondary" onClick={handleReset} disabled={resetting}>
          <RefreshCw size={13} /> {resetting ? 'Resetting…' : 'Reset progress'}
        </Button>
        <Button onClick={handleGrant} disabled={saving}>{saving ? 'Granting…' : 'Grant access'}</Button>
      </div>
    </Modal>
  );
}
