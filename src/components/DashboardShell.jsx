import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConsistencyPulse from './pulse/ConsistencyPulse';
import { LogOut } from 'lucide-react';

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
        }`
      }
    >
      <item.icon size={17} strokeWidth={2} />
      {item.label}
    </NavLink>
  );
}

export default function DashboardShell({ navItems, navGroups, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="px-5 py-5 border-b border-[var(--color-border)] flex items-center gap-2.5">
          <ConsistencyPulse results={[true, false]} classification="GUESSED" width={32} height={20} />
          <span className="font-[var(--font-display)] font-semibold text-sm tracking-tight">
            Quiz Engine
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups
            ? navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavItem key={item.to} item={item} />
                    ))}
                  </div>
                </div>
              ))
            : (
              <div className="space-y-1">
                {navItems.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            )}
        </nav>

        <div className="px-3 py-4 border-t border-[var(--color-border)]">
          <div className="px-3 mb-3">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">{user?.email}</p>
            <p className="text-xs text-[var(--color-text-muted)] font-mono uppercase">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
