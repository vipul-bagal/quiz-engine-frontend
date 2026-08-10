import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Dumbbell, RotateCcw, CheckCircle2, Clock, X } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { getStudentDetail } from '../../api/analytics';

function ConceptBadgeRow({ s }) {
  const chips = [
    { label: `${s.mastered} mastered`, tone: 'accent', show: s.mastered > 0 },
    { label: `${s.guessed} guessed`, tone: 'warn', show: s.guessed > 0 },
    { label: `${s.notUnderstood} not understood`, tone: 'danger', show: s.notUnderstood > 0 },
    { label: `${s.insufficientData} insufficient data`, tone: 'default', show: s.insufficientData > 0 },
  ].filter((c) => c.show);

  if (chips.length === 0) return <p className="text-xs text-[var(--color-text-faint)]">No concept data yet</p>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (<Badge key={c.label} tone={c.tone}>{c.label}</Badge>))}
    </div>
  );
}

function SessionCard({ s }) {
  const isPractice = s.sessionType === 'PRACTICE';
  const statusIcon = !s.completed ? Clock : CheckCircle2;
  const StatusIcon = statusIcon;

  return (
    <Card variant="elevated" className="!p-4 min-w-[260px] max-w-[260px] shrink-0 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          {isPractice ? (
            <Badge tone="warn"><Dumbbell size={10} className="inline mr-1" />practice</Badge>
          ) : (
            <Badge tone="accent">original</Badge>
          )}
          <span className="text-[var(--color-text-faint)]"><StatusIcon size={13} /></span>
        </div>
        <p className="text-sm font-medium truncate mb-1">{s.quizTitle}</p>
        <p className="text-xs text-[var(--color-text-faint)] font-mono mb-3">{s.courseName}</p>
        {s.completed ? (
          <p className="text-xs text-[var(--color-text-muted)] mb-2">
            {s.correctCount}/{s.totalAttempts} correct
          </p>
        ) : (
          <p className="text-xs text-[var(--color-warn)] mb-2 flex items-center gap-1"><RotateCcw size={11} /> In progress</p>
        )}
      </div>
      <ConceptBadgeRow s={s} />
    </Card>
  );
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(location.state?.quizCreated ? `Created "${location.state.quizCreated}" for this student.` : '');

  useEffect(() => {
    getStudentDetail(studentId)
      .then(setDetail)
      .catch((err) => setError(err.response?.data?.error || 'Could not load this student.'));
  }, [studentId]);

  function handleCreateQuizForStudent() {
    if (!detail) return;
    navigate(`/instructor/mix-quiz?forStudentId=${detail.studentId}&forStudentName=${encodeURIComponent(detail.fullName)}`);
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
    return (<DashboardShell navGroups={instructorNavGroups}><div className="flex justify-center py-24"><Spinner /></div></DashboardShell>);
  }

  const sortedSessions = [...detail.sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
        <ArrowLeft size={13} /> Back to students
      </button>

      {banner && (
        <Card variant="elevated" className="mb-6 !border-[var(--color-accent)]/40 flex items-center justify-between">
          <p className="text-sm text-[var(--color-accent)]">{banner}</p>
          <button onClick={() => setBanner('')} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"><X size={15} /></button>
        </Card>
      )}

      <div className="flex items-start justify-between gap-4 mb-8">
        <div title={detail.email}>
          <h1 className="font-[var(--font-display)] text-[30px] font-semibold tracking-tight mb-1">{detail.fullName}</h1>
          <p className="text-[var(--color-text-faint)] font-mono text-sm">{detail.email}</p>
        </div>
        <Button onClick={handleCreateQuizForStudent} className="shrink-0">
          <Plus size={15} /> Create quiz for this student
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpen size={14} className="text-[var(--color-text-muted)]" />
          <h2 className="font-[var(--font-display)] font-semibold text-sm">Enrolled courses</h2>
        </div>
        {detail.courses.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">Not enrolled in any course yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {detail.courses.map((c) => (<Badge key={c.id}>{c.name}</Badge>))}
          </div>
        )}
      </div>

      <h2 className="font-[var(--font-display)] font-semibold text-sm mb-3">
        Quiz history <span className="text-[var(--color-text-faint)] font-normal">(most recent first, includes practice)</span>
      </h2>
      {sortedSessions.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No quiz attempts yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-3 -mx-1 px-1">
          {sortedSessions.map((s) => (<SessionCard key={s.sessionId} s={s} />))}
        </div>
      )}
    </DashboardShell>
  );
}
