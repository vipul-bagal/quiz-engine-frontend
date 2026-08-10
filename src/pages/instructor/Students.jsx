import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Plus, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner, Button, Input, Modal, ConfirmDialog, EmptyState } from '../../components/ui';
import { getAllStudents, createStudent, setStudentActive, deleteStudent } from '../../api/users';
import { getMyStudents } from '../../api/analytics';

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);
  const [stats, setStats] = useState(null); // per-student quiz stats, keyed by email
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [error, setError] = useState('');

  function refresh() {
    setError('');
    getAllStudents()
      .then(setStudents)
      .catch(() => { setStudents([]); setError('Could not load students. Try refreshing the page.'); });
    getMyStudents().then((data) => {
      const map = {};
      data.forEach((s) => { map[s.userId] = s; });
      setStats(map);
    }).catch(() => setStats({}));
  }

  useEffect(() => { refresh(); }, []);

  async function handleToggleActive(student) {
    await setStudentActive(student.id, !student.active);
    refresh();
  }

  async function handleDelete(student) {
    setDeleteError('');
    try {
      await deleteStudent(student.id);
      setConfirmDelete(null);
      refresh();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Could not delete student.');
    }
  }

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="font-[var(--font-display)] text-2xl font-semibold">Students</h1>
        <Button onClick={() => setShowCreate(true)}><Plus size={15} /> New student</Button>
      </div>
      <p className="text-[var(--color-text-muted)] mb-6">
        Every student account in the system. Enroll them into specific courses from the Courses page.
      </p>

      {showCreate && (
        <CreateStudentModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refresh(); }} />
      )}

      {students === null && <div className="flex justify-center py-12"><Spinner /></div>}

      {error && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-danger)]/40">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </Card>
      )}

      {students && students.length === 0 && (
        <EmptyState
          icon={Users2}
          title="No student accounts yet"
          description="Create a student account, or add existing students directly from a course's roster."
          action={<Button className="!text-xs" onClick={() => setShowCreate(true)}>New student</Button>}
        />
      )}

      {students && students.length > 0 && (
        <div className="space-y-2.5">
          {students.map((s) => {
            const quizStats = stats?.[s.id];
            return (
              <Card
                key={s.id}
                variant="interactive"
                className="!p-4 flex items-center justify-between"
                onClick={() => navigate(`/instructor/students/${s.id}`)}
              >
                <div title={s.email}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.fullName}</p>
                    {s.active === false && <Badge tone="danger">deactivated</Badge>}
                  </div>
                  {quizStats && (
                    <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                      {quizStats.completedSessions}/{quizStats.totalSessions} sessions · {Math.round(quizStats.accuracy * 100)}% accuracy
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(s); }}
                    title={s.active === false ? 'Reactivate account' : 'Deactivate account'}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-warn)] hover:bg-[var(--color-surface-raised)]"
                  >
                    {s.active === false ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(s); }}
                    title="Delete account"
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)]"
                  >
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
          title={`Delete ${confirmDelete.fullName}?`}
          message={deleteError || 'This permanently deletes the account. Only possible if they have no quiz history or enrollments.'}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => { setConfirmDelete(null); setDeleteError(''); }}
        />
      )}
    </DashboardShell>
  );
}

function CreateStudentModal({ onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createStudent({ email, password, firstName, lastName });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create student.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-[var(--font-display)] font-semibold mb-4">New student account</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Input label="First name" required placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last name" required placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label="Email" type="email" required placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Temporary password" type="password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</Button>
        </div>
      </form>
    </Modal>
  );
}
