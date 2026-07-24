import { useEffect, useState } from 'react';
import { Plus, Users, Check, X, UserPlus, ChevronDown, ChevronUp, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Select, Badge, Spinner, Modal, ConfirmDialog } from '../../components/ui';
import {
  createCourse, getMyCourses, getEnrollments,
  approveEnrollment, rejectEnrollment, enrollExistingStudent,
  setCourseArchived, deleteCourse,
} from '../../api/courses';
import { getAllStudents, createStudent } from '../../api/users';

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  function refresh() {
    setLoading(true);
    getMyCourses().then(setCourses).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleArchiveToggle(course) {
    await setCourseArchived(course.id, course.status !== 'ARCHIVED');
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

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="font-[var(--font-display)] text-2xl font-semibold">Courses</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New course
        </Button>
      </div>
      <p className="text-[var(--color-text-muted)] mb-6">
        Create courses, manage enrollment requests, and add students directly.
      </p>

      {showCreate && (
        <CreateCourseModal
          onCreated={() => { setShowCreate(false); refresh(); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!loading && courses && courses.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No courses yet — create one to get started.</p></Card>
      )}

      {!loading && courses && courses.length > 0 && (
        <div className="space-y-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              expanded={expandedCourse === c.id}
              onToggle={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
              onChanged={refresh}
              onArchiveToggle={() => handleArchiveToggle(c)}
              onDeleteClick={() => setConfirmDelete(c)}
            />
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Course name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await createCourse({ name, description });
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
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create course'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CourseCard({ course, expanded, onToggle, onChanged, onArchiveToggle, onDeleteClick }) {
  const archived = course.status === 'ARCHIVED';
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{course.name}</p>
            {archived && <Badge>archived</Badge>}
          </div>
          {course.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{course.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Badge tone="accent">{course.approvedStudentCount} enrolled</Badge>
            {course.pendingRequestCount > 0 && <Badge tone="warn">{course.pendingRequestCount} pending</Badge>}
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button onClick={onArchiveToggle} title={archived ? 'Reactivate course' : 'Archive course'} className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warn)] hover:bg-[var(--color-surface-raised)]">
            {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </button>
          <button onClick={onDeleteClick} title="Delete course" className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
            <Trash2 size={15} />
          </button>
          <button onClick={onToggle} className="p-2 text-[var(--color-text-muted)]">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && <CourseRoster courseId={course.id} onChanged={onChanged} />}
    </Card>
  );
}

function CourseRoster({ courseId, onChanged }) {
  const [enrollments, setEnrollments] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);

  function refresh() {
    getEnrollments(courseId).then(setEnrollments);
  }

  useEffect(() => { refresh(); }, [courseId]);

  async function handleApprove(enrollmentId) {
    await approveEnrollment(courseId, enrollmentId);
    refresh();
    onChanged();
  }

  async function handleReject(enrollmentId) {
    await rejectEnrollment(courseId, enrollmentId);
    refresh();
    onChanged();
  }

  const pending = enrollments?.filter((e) => e.status === 'PENDING') || [];
  const approved = enrollments?.filter((e) => e.status === 'APPROVED') || [];

  return (
    <div className="border-t border-[var(--color-border)] p-5 bg-[var(--color-bg)]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] font-medium">Roster</p>
        <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setShowAddStudent(true)}>
          <UserPlus size={13} /> Add student
        </Button>
      </div>

      {showAddStudent && (
        <AddStudentModal
          courseId={courseId}
          onClose={() => setShowAddStudent(false)}
          onAdded={() => { setShowAddStudent(false); refresh(); onChanged(); }}
        />
      )}

      {enrollments === null && <div className="flex justify-center py-6"><Spinner size={16} /></div>}

      {enrollments && pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[var(--color-warn)] mb-2">Pending requests</p>
          <div className="space-y-1.5">
            {pending.map((e) => (
              <div key={e.enrollmentId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]">
                <span className="text-sm">{e.studentEmail}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => handleApprove(e.enrollmentId)} className="p-1.5 rounded-md text-[var(--color-accent)] hover:bg-[var(--color-accent)]/12">
                    <Check size={14} />
                  </button>
                  <button onClick={() => handleReject(e.enrollmentId)} className="p-1.5 rounded-md text-[var(--color-danger)] hover:bg-[var(--color-danger)]/12">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {enrollments && (
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5"><Users size={12} /> Enrolled ({approved.length})</p>
          {approved.length === 0 ? (
            <p className="text-xs text-[var(--color-text-faint)]">No students enrolled yet.</p>
          ) : (
            <div className="space-y-1">
              {approved.map((e) => (
                <div key={e.enrollmentId} className="px-3 py-1.5 text-sm text-[var(--color-text-muted)]">{e.studentEmail}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddStudentModal({ courseId, onClose, onAdded }) {
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [students, setStudents] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  async function handleCreateThenSelect(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await createStudent({ email: newEmail, password: newPassword });
      // Refresh directory and immediately select the newly created student
      const updated = await getAllStudents();
      setStudents(updated);
      setSelectedStudentId(String(created.id));
      setMode('existing');
      setNewEmail('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create student.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEnroll() {
    if (!selectedStudentId) { setError('Select a student first.'); return; }
    setError('');
    setSaving(true);
    try {
      await enrollExistingStudent(courseId, Number(selectedStudentId));
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add student to course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">Add student to course</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setMode('existing')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${mode === 'existing' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
        >
          Select existing
        </button>
        <button
          onClick={() => setMode('new')}
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${mode === 'new' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
        >
          Create new student
        </button>
      </div>

      {mode === 'existing' && (
        <div className="space-y-4">
          {students === null ? (
            <div className="flex justify-center py-6"><Spinner size={16} /></div>
          ) : (
            <Select label="Student" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.email}</option>
              ))}
            </Select>
          )}
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={saving || !selectedStudentId}>{saving ? 'Adding…' : 'Add to course'}</Button>
          </div>
        </div>
      )}

      {mode === 'new' && (
        <form onSubmit={handleCreateThenSelect} className="space-y-4">
          <Input label="Student email" type="email" required placeholder="student@university.edu" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <Input label="Temporary password" type="password" required minLength={8} placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create student'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
