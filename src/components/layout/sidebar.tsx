'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  Settings,
  Wallet,
  LogOut,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/themeStore';
import { api } from '@/lib/api';

const navigation = [
  { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transacciones', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Presupuestos', href: '/budgets', icon: PieChart },
  { name: 'Metas de Ahorro', href: '/goals', icon: Target },
  { name: 'Reportes', href: '/reports', icon: Download },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 h-screen glass border-r border-[var(--color-element-border)] flex flex-col hidden md:flex sticky top-0 z-40">
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-element-border)]">
        <Link href="/dashboard" className="flex items-center gap-2 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors">
          <Wallet className="text-[var(--color-primary)]" size={24} />
          <span className="font-heading font-semibold text-lg tracking-tight">CashTracker</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover-scale',
                isActive
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-element-bg-hover)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <item.icon size={18} className={cn(isActive ? 'text-[var(--color-primary)]' : 'text-current')} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[var(--color-element-border)] space-y-2">
        {mounted && (
          <button
            onClick={toggleTheme}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-element-bg-hover)] hover:text-[var(--color-text-primary)] transition-all"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-all"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
