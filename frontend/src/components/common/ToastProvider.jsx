import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastContext } from './ToastContext';

const variantConfig = {
  success: { Icon: CheckCircle2, label: 'Success' },
  error: { Icon: XCircle, label: 'Error' },
  info: { Icon: Info, label: 'Information' },
  warning: { Icon: AlertTriangle, label: 'Warning' },
};

function ToastCard({ toast, onDismiss }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const remainingTime = useRef(toast.duration);
  const variant = variantConfig[toast.variant] ? toast.variant : 'info';
  const { Icon } = variantConfig[variant];
  const isPaused = isHovered || isFocused;

  useToastTimer({
    id: toast.id,
    duration: toast.duration,
    isPaused,
    remainingTime,
    onDismiss,
  });

  const handleAction = () => {
    toast.action.onClick();
    onDismiss(toast.id);
  };

  return (
    <article
      className={`toast-card toast-card--${variant}${isPaused ? ' is-paused' : ''}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
    >
      <span className="toast-icon-wrap" aria-hidden="true">
        <Icon size={19} strokeWidth={2.2} />
      </span>

      <div className="toast-content">
        <p className="toast-title">{toast.title || variantConfig[variant].label}</p>
        {toast.message && <p className="toast-message">{toast.message}</p>}
        {toast.action?.label && toast.action?.onClick && (
          <button type="button" className="toast-action" onClick={handleAction}>
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={17} />
      </button>

      {toast.duration > 0 && (
        <span
          className="toast-progress"
          aria-hidden="true"
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
    </article>
  );
}

function useToastTimer({ id, duration, isPaused, remainingTime, onDismiss }) {
  // Keep a hovered or keyboard-focused toast open, then resume its remaining time.
  useEffect(() => {
    if (!duration || isPaused) return undefined;

    const startedAt = Date.now();
    const timeoutId = window.setTimeout(() => onDismiss(id), remainingTime.current);

    return () => {
      window.clearTimeout(timeoutId);
      remainingTime.current = Math.max(0, remainingTime.current - (Date.now() - startedAt));
    };
  }, [duration, id, isPaused, onDismiss, remainingTime]);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ variant = 'info', title, message, action, duration } = {}) => {
    const safeVariant = variantConfig[variant] ? variant : 'info';
    const toastId = `toast-${nextId.current++}`;
    const resolvedDuration = duration ?? (safeVariant === 'error' ? 0 : 3000);

    setToasts((current) => [
      ...current.slice(-3),
      {
        id: toastId,
        variant: safeVariant,
        title: title || variantConfig[safeVariant].label,
        message,
        action,
        duration: Math.max(0, resolvedDuration),
      },
    ]);

    return toastId;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="toast-viewport" aria-label="Notifications">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

