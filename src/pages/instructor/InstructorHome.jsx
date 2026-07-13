import { LayoutDashboard, Upload, FileText, BarChart3 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/instructor', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/instructor/generate', label: 'Generate quiz', icon: Upload },
  { to: '/instructor/questions', label: 'My questions', icon: FileText },
  { to: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function InstructorHome() {
  const { user } = useAuth();

  return (
    <DashboardShell navItems={navItems}>
      <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">
        Welcome, {user?.email?.split('@')[0]}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Upload course material and generate assessments grounded in your content.
      </p>

      <Card>
        <p className="text-sm text-[var(--color-text-muted)]">
          This overview will summarize your recent generation activity. Head to{' '}
          <span className="text-[var(--color-accent)]">Generate quiz</span> to upload a PDF and
          create your first set of questions.
        </p>
      </Card>
    </DashboardShell>
  );
}
