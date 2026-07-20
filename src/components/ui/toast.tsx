'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastInput = Omit<Toast, 'id'>;

let nextId = 1;
let currentToasts: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function emit() {
  listeners.forEach((listener) => listener(currentToasts));
}

function removeToast(id: number) {
  currentToasts = currentToasts.filter((toast) => toast.id !== id);
  emit();
}

export function showToast(input: ToastInput) {
  const id = nextId++;
  currentToasts = [{ id, ...input }, ...currentToasts].slice(0, 4);
  emit();

  window.setTimeout(() => removeToast(id), input.type === 'error' ? 7000 : 4500);
}

export const toast = {
  success: (title: string, message?: string) =>
    showToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    showToast({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    showToast({ type: 'info', title, message }),
};

function subscribe(listener: (toasts: Toast[]) => void) {
  listeners.add(listener);
  listener(currentToasts);
  return () => {
    listeners.delete(listener);
  };
}

const styles: Record<ToastType, string> = {
  success: 'border-[var(--color-primary)]/30 bg-[var(--color-surface)]',
  error: 'border-[var(--color-danger)]/35 bg-[var(--color-surface)]',
  info: 'border-[var(--color-element-border)] bg-[var(--color-surface)]',
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-[var(--color-primary)]" />,
  error: <AlertCircle size={18} className="text-[var(--color-danger)]" />,
  info: <Info size={18} className="text-[var(--color-text-secondary)]" />,
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`glass rounded-xl border p-4 shadow-xl ${styles[item.type]}`}
          role={item.type === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{icons[item.type]}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                {item.title}
              </div>
              {item.message && (
                <div className="mt-1 text-sm leading-5 text-[var(--color-text-secondary)]">
                  {item.message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-element-bg-hover)] hover:text-[var(--color-text-primary)]"
              aria-label="Cerrar notificacion"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
