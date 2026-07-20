'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth';
import { Search } from 'lucide-react';

export function Header() {
  const user = useAuthStore((state) => state.user);

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 glass border-b border-[var(--color-element-border)] flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            className="w-full bg-[var(--color-background)] border border-[var(--color-element-border)] rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-element-border)]">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-[var(--color-text-primary)] leading-none">{user?.name || 'Usuario'}</span>
            <span className="text-xs text-[var(--color-text-muted)] mt-1">{user?.email}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
            {user?.name ? getInitials(user.name) : 'US'}
          </div>
        </div>
      </div>
    </header>
  );
}
