import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Upload, Shuffle, Users2 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getMyAnalytics, getConceptStruggles, getMyStudents } from '../../api/analytics';

export default function InstructorHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [struggles, setStruggles] = useState(null);
  const [students, setStudents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyAnalytics().catch(() => null),
      getConceptStruggles().catch(() => []),
      getMyStudents().catch(() => []),
    ]).then(([a, c, s]) => {
      setStats(a);
      setStruggles(c);
      setStudents(s);
      setLoading(false);
    });
  }, []);

  const hasContent = stats && stats.totalQuestions > 0;
  const hasStudentData = students && students.length > 0;
  const topStruggles = (struggles || []).filter((c) => c.studentsAnswered > 0).slice(0, 5);
  const completedSessions = students ? students.reduce((sum, s) => sum + s.completedSessions, 0) : 0;

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">
        Welcome, {user?.email?.split('@')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Here's what your students are struggling with — and what's ready to review.
      </p>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!loading && !hasContent && (
        <Card>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            You haven't generated any questions yet. Upload a PDF to create your first quiz.
          </p>
          <Link to="/instructor/generate" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline">
            Generate a quiz <ArrowRight size={14} />
          </Link>
        </Card>
      )}

      {!loading && hasContent && (
        <>
          {/* Headline feature: class-wide concept struggles */}
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-[var(--color-warn)]" />
            <h2 className="font-[var(--font-display)] font-semibold text-sm">Concepts needing attention</h2>
          </div>

          {!hasStudentData && (
            <Card className="mb-8">
              <p className="text-sm text-[var(--color-text-muted)]">
                No student activity yet. Once students start taking quizzes, this section will surface
                which concepts they're guessing on or not understanding, ranked by how many students struggled.
              </p>
            </Card>
          )}

          {hasStudentData && topStruggles.length === 0 && (
            <Card className="mb-8">
              <p className="text-sm text-[var(--color-accent)]">
                Nice — no concepts are showing a meaningful struggle rate right now.
              </p>
            </Card>
          )}

          {hasStudentData && topStruggles.length > 0 && (
            <div className="space-y-2.5 mb-8">
              {topStruggles.map((c) => (
                <Card key={c.conceptGroupId} className="!p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.conceptName}</p>
                      <p className="text-xs text-[var(--color-text-faint)] font-mono mt-0.5">
                        course: {c.courseId} · {c.studentsAnswered} student{c.studentsAnswered === 1 ? '' : 's'} answered
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.guessed > 0 && <Badge tone="warn">{c.guessed} guessed</Badge>}
                      {c.notUnderstood > 0 && <Badge tone="danger">{c.notUnderstood} not understood</Badge>}
                      {c.mastered > 0 && <Badge tone="accent">{c.mastered} mastered</Badge>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Class snapshot + quick actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Users2 size={15} className="text-[var(--color-text-muted)]" />
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Class activity</p>
              </div>
              <p className="font-[var(--font-display)] text-2xl font-semibold">
                {students ? students.length : 0} <span className="text-sm text-[var(--color-text-muted)] font-body font-normal">students</span>
              </p>
              <p className="text-xs text-[var(--color-text-faint)] mt-1">{completedSessions} quizzes completed</p>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-3">Quick actions</p>
              <div className="flex gap-2">
                <Link to="/instructor/generate">
                  <Button variant="secondary" className="!py-2 !text-xs">
                    <Upload size={13} /> Generate
                  </Button>
                </Link>
                <Link to="/instructor/mix-quiz">
                  <Button variant="secondary" className="!py-2 !text-xs">
                    <Shuffle size={13} /> Mix quiz
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Content health, demoted */}
          <div className="flex items-center gap-6 text-xs text-[var(--color-text-faint)] font-mono border-t border-[var(--color-border)] pt-4">
            <span>{stats.totalQuestions} questions</span>
            <span>{stats.totalConcepts} concepts</span>
            <span>{Object.keys(stats.byCourse).length} courses</span>
            <span>{Math.round(stats.yieldRate * 100)}% critique yield</span>
            <Link to="/instructor/analytics" className="text-[var(--color-accent)] hover:underline ml-auto">
              Full analytics →
            </Link>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
