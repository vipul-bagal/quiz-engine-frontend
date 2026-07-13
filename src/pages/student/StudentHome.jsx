import { LayoutDashboard, PlayCircle, BarChart3 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/take-quiz', label: 'Take a quiz', icon: PlayCircle },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];

export default function StudentHome() {
  const { user } = useAuth();

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">
        Welcome, {user?.email?.split('@')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Take a quiz to test your understanding of course material.
      </p>

      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          Head to <span className="text-[var(--color-accent)]">Take a quiz</span> to start a new
          session for one of your courses.
        </p>
      </Card>
    </DashboardShell>
  );
}
