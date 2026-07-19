import { useEffect, useState } from 'react';
import { Plus, Users, Check, X, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Button, Card, Input, Badge, Spinner } from '../../components/ui';
import {
  createCourse, getMyCourses, getEnrollments,
  approveEnrollment, rejectEnrollment, addStudentToCourse,
} from '../../api/courses';

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);

  function refresh() {
    setLoading(true);
    getMyCourses().then(setCourses).finally(() => setLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="font-[var(--font-display)] text-2xl font-semibold">Courses</h1>
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus size={15} /> New course
        </Button>
      </div>
      <p className="text-[var(--color-text-muted)] mb-6">
        Create courses, manage enrollment requests, and add students directly.
      </p>

      {showCreate && (
        <CreateCourseForm
          onCreated={() => { setShowCreate(false); refresh(); }}
          onCancel={() => setShowCreate(false)}
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
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function CreateCourseForm({ onCreated, onCancel }) {
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
    <Card className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Course name" placeholder="e.g. Intro to Psychology" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Description (optional)" placeholder="Short description for students" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create course'}</Button>
        </div>
      </form>
    </Card>
  );
}

function CourseCard({ course, expanded, onToggle, onChanged }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left">
        <div className="min-w-0">
          <p className="font-medium text-sm">{course.name}</p>
          {course.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{course.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Badge tone="accent">{course.approvedStudentCount} enrolled</Badge>
            {course.pendingRequestCount > 0 && <Badge tone="warn">{course.pendingRequestCount} pending</Badge>}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[var(--color-text-muted)] shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)] shrink-0" />}
      </button>

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
        <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => setShowAddStudent((v) => !v)}>
          <UserPlus size={13} /> Add student
        </Button>
      </div>

      {showAddStudent && (
        <AddStudentForm
          courseId={courseId}
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

function AddStudentForm({ courseId, onAdded }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await addStudentToCourse(courseId, { email, password });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add student.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-4 p-3 rounded-lg bg-[var(--color-surface-raised)]">
      <div className="flex items-end gap-2">
        <div className="flex-1"><Input label="Student email" placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="flex-1"><Input label="Password (if new)" type="password" placeholder="Only needed for new accounts" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" disabled={saving} className="!py-2.5">{saving ? '...' : 'Add'}</Button>
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </form>
  );
}
