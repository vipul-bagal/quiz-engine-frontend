import { LayoutDashboard, BookOpen, BarChart3, Dumbbell } from 'lucide-react';

export const studentNavItems = [
  { to: '/student', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'Browse courses', icon: BookOpen },
  { to: '/student/practice', label: 'Practice', icon: Dumbbell },
  { to: '/student/results', label: 'My results', icon: BarChart3 },
];
