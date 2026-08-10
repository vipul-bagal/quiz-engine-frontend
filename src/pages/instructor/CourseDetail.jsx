import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, X, UserPlus, ShieldCheck, Users, Circle, Pencil,
} from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Spinner, Modal, Input, Select } from '../../components/ui';
import {
  getMyCourses, getEnrollments, approveEnrollment, rejectEnrollment, removeEnrollment,
  enrollExistingStudent, getCourseQuizzes, getCourseCollaborators, addCourseCollaborator, removeCourseCollaborator,
  editCourse,
} from '../../api/courses';
import { getAllStudents, createStudent, getAllInstructors } from '../../api/users';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [quizzes, setQuizzes] = useState(null);
  const [enrollments, setEnrollments] = useState(null);
  const [collaborators, setCollaborators] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [error, setError] = useState('');

  function refreshAll() {
    setError('');
    getMyCourses()
      .then((list) => setCourse(list.find((c) => c.id === courseId) || null))
      .catch(() => setError('Could not load this course. Try refreshing the page.'));
    getCourseQuizzes(courseId).then(setQuizzes).catch(() => setQuizzes([]));
    getEnrollments(courseId).then(setEnrollments).catch(() => setEnrollments([]));
    getCourseCollaborators(courseId).then(setCollaborators).catch(() => setCollaborators([]));
  }

  useEffect(() => { refreshAll(); }, [courseId]);

  async function handleApprove(enrollmentId) {
    await approveEnrollment(courseId, enrollmentId);
    refreshAll();
  }
  async function handleReject(enrollmentId) {
    await rejectEnrollment(courseId, enrollmentId);
    refreshAll();
  }
  async function handleRemoveStudent(enrollmentId) {
    if (!confirm('Remove this student from the course?')) return;
    await removeEnrollment(courseId, enrollmentId);
    refreshAll();
  }
  async function handleRemoveCollaborator(collaboratorId) {
    if (!confirm('Remove this editor from the course?')) return;
    await removeCourseCollaborator(courseId, collaboratorId);
    refreshAll();
  }

  const pending = enrollments?.filter((e) => e.status === 'PENDING') || [];
  const approved = enrollments?.filter((e) => e.status === 'APPROVED') || [];

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <button onClick={() => navigate('/instructor/courses')} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={13} /> Back to courses
      </button>

      {error && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      )}

      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h1 className="font-[var(--font-display)] text-[30px] font-semibold tracking-tight">
          {course?.name || 'Course'}
        </h1>
        <button
          onClick={() => setShowEdit(true)}
          className="shrink-0 mt-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] inline-flex items-center gap-1.5"
        >
          <Pencil size={13} /> Edit
        </button>
      </div>
      {course?.description && <p className="text-[var(--color-text-muted)] mb-6">{course.description}</p>}

      {/* Quiz row — every quiz regardless of status */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[var(--font-display)] font-semibold text-sm">Quizzes in this course</h2>
        <span className="text-xs text-[var(--color-text-faint)] font-mono">{quizzes?.length ?? '…'} total</span>
      </div>

      {quizzes === null && <div className="flex justify-center py-8"><Spinner /></div>}

      {quizzes && quizzes.length === 0 && (
        <Card className="mb-8"><p className="text-sm text-[var(--color-text-muted)]">No quizzes assigned to this course yet.</p></Card>
      )}

      {quizzes && quizzes.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-3 mb-8 -mx-1 px-1">
          {quizzes.map((q) => (
            <Card
              key={q.id}
              variant="interactive"
              className="!p-5 min-w-[260px] max-w-[260px] min-h-[160px] flex flex-col justify-between shrink-0"
              onClick={() => navigate(`/instructor/quiz/${q.id}`)}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Circle size={7} className={q.publishStatus === 'PUBLISHED' ? 'text-[var(--color-accent)] fill-current' : 'text-[var(--color-text-faint)] fill-current'} />
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] font-medium">
                  {q.status === 'ARCHIVED' ? 'Discarded' : q.publishStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm font-medium truncate leading-snug">{q.title}</p>
              <p className="text-xs text-[var(--color-text-faint)] font-mono mt-1.5">{q.questionCount} questions</p>
            </Card>
          ))}
        </div>
      )}

      {/* Roster */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[var(--font-display)] font-semibold text-sm flex items-center gap-1.5"><Users size={14} /> Students</h2>
        <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setShowAddStudent(true)}>
          <UserPlus size={12} /> Add student
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-[var(--color-warn)] mb-2">Pending requests</p>
          <div className="space-y-1.5">
            {pending.map((e) => (
              <Card key={e.enrollmentId} className="!p-3.5 flex items-center justify-between">
                <span className="text-sm" title={e.studentEmail}>{e.studentName}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => handleApprove(e.enrollmentId)} className="p-1.5 rounded-md text-[var(--color-accent)] hover:bg-[var(--color-accent)]/12"><Check size={14} /></button>
                  <button onClick={() => handleReject(e.enrollmentId)} className="p-1.5 rounded-md text-[var(--color-danger)] hover:bg-[var(--color-danger)]/12"><X size={14} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {approved.length === 0 ? (
        <Card className="mb-8"><p className="text-sm text-[var(--color-text-muted)]">No students enrolled yet.</p></Card>
      ) : (
        <div className="space-y-1.5 mb-8">
          {approved.map((e) => (
            <Card key={e.enrollmentId} className="!p-3.5 flex items-center justify-between">
              <span className="text-sm" title={e.studentEmail}>{e.studentName}</span>
              <button onClick={() => handleRemoveStudent(e.enrollmentId)} className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
                <X size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Collaborators */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[var(--font-display)] font-semibold text-sm flex items-center gap-1.5"><ShieldCheck size={14} /> Collaborators</h2>
        <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setShowAddCollaborator(true)}>
          <UserPlus size={12} /> Add editor
        </Button>
      </div>

      {collaborators === null && <div className="flex justify-center py-6"><Spinner size={16} /></div>}
      {collaborators && collaborators.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No collaborators yet — you're the only editor.</p></Card>
      )}
      {collaborators && collaborators.length > 0 && (
        <div className="space-y-1.5">
          {collaborators.map((c) => (
            <Card key={c.id} className="!p-3.5 flex items-center justify-between">
              <span className="text-sm" title={c.instructorEmail}>{c.instructorName}</span>
              <button onClick={() => handleRemoveCollaborator(c.id)} className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]">
                <X size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showAddStudent && (
        <AddStudentModal courseId={courseId} onClose={() => setShowAddStudent(false)} onAdded={() => { setShowAddStudent(false); refreshAll(); }} />
      )}
      {showAddCollaborator && (
        <AddCourseCollaboratorModal courseId={courseId} onClose={() => setShowAddCollaborator(false)} onAdded={() => { setShowAddCollaborator(false); refreshAll(); }} />
      )}
      {showEdit && (
        <EditCourseModal course={course} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refreshAll(); }} />
      )}
    </DashboardShell>
  );
}

function EditCourseModal({ course, onClose, onSaved }) {
  const [name, setName] = useState(course?.name || '');
  const [description, setDescription] = useState(course?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Course name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await editCourse(course.id, { name: name.trim(), description });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">Edit course</h3>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Course name" required value={name} onChange={(e) => setName(e.target.value)} />
        <label className="block">
          <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] outline-none transition-colors resize-none"
            placeholder="What's this course about?"
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

function AddStudentModal({ courseId, onClose, onAdded }) {
  const [mode, setMode] = useState('existing');
  const [students, setStudents] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getAllStudents().then(setStudents).catch(() => setStudents([])); }, []);

  async function handleCreateThenSelect(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await createStudent({ email: newEmail, password: newPassword, firstName: newFirstName, lastName: newLastName });
      const updated = await getAllStudents();
      setStudents(updated);
      setSelectedStudentId(String(created.id));
      setMode('existing');
      setNewFirstName('');
      setNewLastName('');
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
        <button onClick={() => setMode('existing')} className={`px-3 py-2 rounded-lg text-xs font-medium border ${mode === 'existing' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>Select existing</button>
        <button onClick={() => setMode('new')} className={`px-3 py-2 rounded-lg text-xs font-medium border ${mode === 'new' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>Create new student</button>
      </div>

      {mode === 'existing' && (
        <div className="space-y-4">
          {students === null ? <div className="flex justify-center py-6"><Spinner size={16} /></div> : (
            <Select label="Student" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">Select a student…</option>
              {students.map((s) => (<option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>))}
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
          <div className="grid grid-cols-2 gap-2">
            <Input label="First name" required placeholder="Jane" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
            <Input label="Last name" required placeholder="Doe" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
          </div>
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

function AddCourseCollaboratorModal({ courseId, onClose, onAdded }) {
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
      await addCourseCollaborator(courseId, Number(selectedId));
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add collaborator.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">Add a course editor</h3>
      {instructors === null ? <div className="flex justify-center py-6"><Spinner size={16} /></div> : (
        <Select label="Instructor" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mb-4">
          <option value="">Select an instructor…</option>
          {instructors.map((i) => (<option key={i.id} value={i.id}>{i.fullName} ({i.email})</option>))}
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
