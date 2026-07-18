import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { instructorNavGroups } from '../../components/instructorNav';
import { Card, Spinner } from '../../components/ui';
import { getMyAnalytics } from '../../api/analytics';

export default function Courses() {
  const navigate = useNavigate();
  const [byCourse, setByCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAnalytics()
      .then((data) => setByCourse(data.byCourse))
      .finally(() => setLoading(false));
  }, []);

  const courses = byCourse ? Object.entries(byCourse).sort((a, b) => b[1] - a[1]) : [];

  return (
    <DashboardShell navGroups={instructorNavGroups}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Courses</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Every course you've generated content for.</p>

      {loading && <div className="flex justify-center py-12"><Spinner /></div>}

      {!loading && courses.length === 0 && (
        <Card><p className="text-sm text-[var(--color-text-muted)]">No courses yet — generate a quiz to create one.</p></Card>
      )}

      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {courses.map(([courseId, count]) => (
            <Card key={courseId} className="!p-5 cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors" >
              <button
                onClick={() => navigate(`/instructor/questions?course=${encodeURIComponent(courseId)}`)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/12 flex items-center justify-center shrink-0">
                    <BookOpen size={15} className="text-[var(--color-accent)]" />
                  </div>
                  <p className="font-medium text-sm truncate">{courseId}</p>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{count} question{count === 1 ? '' : 's'}</p>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] mt-3">
                  View questions <ArrowRight size={12} />
                </span>
              </button>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
