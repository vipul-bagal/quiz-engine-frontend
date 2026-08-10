import { LayoutDashboard, BookOpen, Upload, Shuffle, Users, BarChart3, ShieldCheck } from 'lucide-react';

export const instructorNavGroups = [
  {
    label: 'Dashboard',
    items: [{ to: '/instructor', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Content',
    items: [
      { to: '/instructor/courses', label: 'Courses', icon: BookOpen },
      { to: '/instructor/generate', label: 'Generate quiz', icon: Upload },
      { to: '/instructor/mix-quiz', label: 'Mix quiz', icon: Shuffle },
    ],
  },
  {
    label: 'Collaboration',
    items: [
      { to: '/instructor/approvals', label: 'Approvals', icon: ShieldCheck },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/instructor/students', label: 'Students', icon: Users },
      { to: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
];
