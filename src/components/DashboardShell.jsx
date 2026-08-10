import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConsistencyPulse from './pulse/ConsistencyPulse';
import GenerationStatusBanner from './GenerationStatusBanner';
import { LogOut } from 'lucide-react';

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-full transition-all duration-150 ${
              isActive ? 'bg-[var(--color-accent)]' : 'bg-transparent'
            }`}
          />
          <item.icon size={19} strokeWidth={2} className="shrink-0" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function initialsFor(user) {
  if (!user) return '?';
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return (first + last).toUpperCase() || (user.email?.[0]?.toUpperCase() ?? '?');
}

export default function DashboardShell({ navItems, navGroups, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="h-screen flex bg-[var(--color-bg)] overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-screen">
        <div className="px-5 py-6 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
          <ConsistencyPulse results={[true, false]} classification="GUESSED" width={36} height={22} />
          <span className="font-[var(--font-display)] font-semibold text-base tracking-tight">
            Quiz Engine
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto min-h-0">
          {navGroups
            ? navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
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

        <div className="px-3 py-5 border-t border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-3 px-2.5 mb-4" title={user?.email}>
            <div className="w-9 h-9 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/25 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[var(--color-accent)]">{initialsFor(user)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] truncate leading-tight">{user?.fullName || user?.email}</p>
              <p className="text-[11px] text-[var(--color-text-faint)] font-mono uppercase tracking-wide mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-10 py-12">
          {navGroups && <GenerationStatusBanner />}
          {children}
        </div>
      </main>
    </div>
  );
}
