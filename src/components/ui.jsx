export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium px-5 py-3 text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';
  const variants = {
    primary: 'bg-[var(--color-accent)] text-[#0a0f12] hover:bg-[#5fd4cc] font-semibold shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]',
    secondary: 'bg-[var(--color-surface-raised)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-accent-dim)] hover:bg-[var(--color-surface-overlay)]',
    ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]',
    danger: 'bg-transparent border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-[#0a0f12]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/**
 * Card variants carry real hierarchy now:
 * - flat: default list/row content, quiet
 * - elevated: primary/hero content, actual shadow + hover lift
 * - interactive: elevated + pointer feedback, for clickable cards
 */
export function Card({ children, className = '', variant = 'flat', ...rest }) {
  const variants = {
    flat: 'bg-[var(--color-surface)] border border-[var(--color-border)]',
    elevated: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]',
    interactive: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)] hover:-translate-y-0.5 transition-all duration-200 ease-[var(--ease-out)] cursor-pointer',
  };
  return (
    <div className={`rounded-xl p-7 ${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
          {label}
        </span>
      )}
      <input
        className={`w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] outline-none transition-colors ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-[var(--color-danger)] mt-1.5">{error}</span>}
    </label>
  );
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
          {label}
        </span>
      )}
      <select
        className={`w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]',
    accent: 'bg-[var(--color-accent)]/12 text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20',
    warn: 'bg-[var(--color-warn)]/12 text-[var(--color-warn)] ring-1 ring-[var(--color-warn)]/20',
    danger: 'bg-[var(--color-danger)]/12 text-[var(--color-danger)] ring-1 ring-[var(--color-danger)]/20',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium font-mono ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Spinner({ size = 22 }) {
  return (
    <svg className="animate-spin" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Modal({ children, onClose, maxWidth = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center px-4 z-50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className={`w-full ${maxWidth}`} onClick={(e) => e.stopPropagation()}>
        <Card variant="elevated">{children}</Card>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} maxWidth="max-w-sm">
      <h3 className="font-[var(--font-display)] font-semibold mb-2.5 text-lg">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/**
 * Dashboard stat display — distinct from Card content rows. Gives numbers
 * real typographic weight instead of being squeezed into the same treatment
 * as a list item. Fixed min-height so these read as substantial tiles even
 * when the sub-line is short or absent.
 */
export function StatCard({ label, value, sub, icon: Icon, tone = 'default' }) {
  const toneColor = {
    default: 'var(--color-text)',
    accent: 'var(--color-accent)',
    warn: 'var(--color-warn)',
    danger: 'var(--color-danger)',
  };
  return (
    <Card variant="elevated" className="min-h-[140px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] font-medium">{label}</p>
        {Icon && <Icon size={16} className="text-[var(--color-text-faint)]" />}
      </div>
      <div>
        <p className="font-[var(--font-display)] text-[34px] leading-none font-semibold" style={{ color: toneColor[tone] }}>
          {value}
        </p>
        {sub && <p className="text-xs text-[var(--color-text-faint)] mt-2.5">{sub}</p>}
      </div>
    </Card>
  );
}

/**
 * A blank screen should feel like an invitation, not a dead end — icon,
 * a plain-spoken headline, and (optionally) one action. Generous vertical
 * space so it reads as a deliberate moment, not a cramped error strip.
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="!py-16">
      <div className="flex flex-col items-center text-center max-w-sm mx-auto">
        {Icon && (
          <div className="w-14 h-14 rounded-xl bg-[var(--color-surface-overlay)] flex items-center justify-center mb-5">
            <Icon size={24} className="text-[var(--color-text-faint)]" />
          </div>
        )}
        <p className="text-base font-medium text-[var(--color-text)] mb-1.5">{title}</p>
        {description && <p className="text-sm text-[var(--color-text-muted)] mb-5 leading-relaxed">{description}</p>}
        {action}
      </div>
    </Card>
  );
}
