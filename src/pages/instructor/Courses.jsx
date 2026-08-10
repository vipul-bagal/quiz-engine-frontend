import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, Trash2, Globe, Lock, KeyRound, BookOpen } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Badge, Spinner, Modal, ConfirmDialog, EmptyState } from '../../components/ui';
import {
  createCourse, getMyCourses, setCourseArchived, deleteCourse, browseAllCourses,
  updateCourseVisibility, requestCourseEditAccess,
} from '../../api/courses';

export default function Courses() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('mine'); // 'mine' | 'browse'
  const [courses, setCourses] = useState(null);
  const [browseCourses, setBrowseCourses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [error, setError] = useState('');

  function refresh() {
    setLoading(true);
    setError('');
    getMyCourses()
      .then(setCourses)
      .catch(() => { setCourses([]); setError('Could not load your courses. Try refreshing the page.'); })
      .finally(() => setLoading(false));
    browseAllCourses().then(setBrowseCourses).catch(() => setBrowseCourses([]));
  }

  useEffect(() => { refresh(); }, []);

  async function handleArchiveToggle(e, course) {
    e.stopPropagation();
    await setCourseArchived(course.id, course.status !== 'ARCHIVED');
    refresh();
  }

  async function handleVisibilityToggle(e, course) {
    e.stopPropagation();
    await updateCourseVisibility(course.id, course.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC');
    refresh();
  }

  async function handleDelete(course) {
    setDeleteError('');
    try {
      await deleteCourse(course.id);
      setConfirmDelete(null);
      refresh();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Could not delete course.');
    }
  }

  async function handleRequestAccess(e, courseId) {
    e.stopPropagation();
    try {
      await requestCourseEditAccess(courseId);
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not send request.');
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="font-[var(--font-display)] text-[30px] font-semibold tracking-tight">Courses</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New course
        </Button>
      </div>
      <p className="text-[var(--color-text-muted)] mb-6">Click a course to manage its quizzes, roster, and editors.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('mine')} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${tab === 'mine' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
          My courses
        </button>
        <button onClick={() => setTab('browse')} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${tab === 'browse' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
          Browse all
        </button>
      </div>

      {showCreate && (
        <CreateCourseModal
          onCreated={() => { setShowCreate(false); refresh(); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {error && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      )}

      {tab === 'mine' && !loading && courses && courses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create a course to start enrolling students and assigning quizzes."
          action={<Button className="!text-xs" onClick={() => setShowCreate(true)}>Create a course</Button>}
        />
      )}

      {tab === 'mine' && !loading && courses && courses.length > 0 && (
        <div className="space-y-3">
          {courses.map((c) => {
            const archived = c.status === 'ARCHIVED';
            const isPublic = c.visibility === 'PUBLIC';
            return (
              <Card key={c.id} variant="interactive" className="!p-5 flex items-center justify-between" onClick={() => navigate(`/instructor/courses/${c.id}`)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{c.name}</p>
                    {archived && <Badge>archived</Badge>}
                  </div>
                  {c.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{c.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge tone="accent">{c.approvedStudentCount} enrolled</Badge>
                    {c.pendingRequestCount > 0 && <Badge tone="warn">{c.pendingRequestCount} pending</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={(e) => handleVisibilityToggle(e, c)}
                    title={isPublic ? 'Make private' : 'Make public'}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-dim)]"
                  >
                    {isPublic ? <Globe size={13} className="text-[var(--color-accent)]" /> : <Lock size={13} />}
                    {isPublic ? 'Public' : 'Private'}
                  </button>
                  <button onClick={(e) => handleArchiveToggle(e, c)} title={archived ? 'Reactivate course' : 'Archive course'} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warn)] hover:bg-[var(--color-surface-raised)]">
                    {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c); }} title="Delete course" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'browse' && !loading && browseCourses && (
        <div className="space-y-2.5">
          {browseCourses.map((c) => (
            <Card
              key={c.id}
              variant="interactive"
              className="!p-4 flex items-center justify-between"
              onClick={() => (c.myEditAccessStatus === 'OWNER' || c.myEditAccessStatus === 'APPROVED') && navigate(`/instructor/courses/${c.id}`)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.visibility !== 'PUBLIC' ? <Lock size={11} className="text-[var(--color-text-faint)]" /> : <Globe size={11} className="text-[var(--color-accent)]" />}
                </div>
                <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5" title={c.creatorEmail}>by {c.creatorName}</p>
              </div>
              <div className="shrink-0">
                {c.myEditAccessStatus === 'OWNER' && <Badge tone="accent">You own this</Badge>}
                {c.myEditAccessStatus === 'APPROVED' && <Badge tone="accent">Editor access</Badge>}
                {c.myEditAccessStatus === 'PENDING' && <Badge tone="warn">Request pending</Badge>}
                {c.myEditAccessStatus === 'REJECTED' && <Badge tone="danger">Request declined</Badge>}
                {c.myEditAccessStatus === 'NONE' && (
                  <Button variant="secondary" className="!py-1.5 !text-xs" onClick={(e) => handleRequestAccess(e, c.id)}>
                    <KeyRound size={12} /> Request edit access
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          message={deleteError || 'This permanently deletes the course. Only possible if it has no enrollments, quizzes, or questions attached.'}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => { setConfirmDelete(null); setDeleteError(''); }}
        />
      )}
    </DashboardShell>
  );
}

function CreateCourseModal({ onCreated, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Course name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await createCourse({ name, description, visibility });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">New course</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Course name" placeholder="e.g. Intro to Psychology" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Description (optional)" placeholder="Short description for students" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Visibility</span>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setVisibility('PRIVATE')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${visibility === 'PRIVATE' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
              <Lock size={13} /> Private
            </button>
            <button type="button" onClick={() => setVisibility('PUBLIC')} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${visibility === 'PUBLIC' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
              <Globe size={13} /> Public
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-faint)] mt-1.5">
            {visibility === 'PUBLIC' ? 'Students who request to join are enrolled instantly.' : 'Students must request to join, and you approve each one.'}
          </p>
        </div>
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create course'}</Button>
        </div>
      </form>
    </Modal>
  );
}
