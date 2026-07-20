'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      const user = data.data?.user || data.user;
      const token = data.data?.accessToken || data.accessToken;

      // Store user and token in Zustand
      setAuth(user, token);
      
      // Redirect to dashboard (will implement next)
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative p-6">
      {/* Background gradients */}
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-[var(--color-accent)] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors">
        <Wallet className="text-[var(--color-primary)]" size={24} />
        <span className="font-heading font-semibold text-xl tracking-tight">CashTracker</span>
      </Link>

      <div className="w-full max-w-md glass rounded-3xl p-8 z-10 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenido de vuelta</h1>
          <p className="text-[var(--color-text-secondary)]">Ingresa a tu cuenta para gestionar tus finanzas</p>
        </div>

        {error && (
          <div className="bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] pl-1">Correo electrónico</label>
            <Input 
              type="email" 
              placeholder="tu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between pl-1 pr-1">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Contraseña</label>
              {/* <Link href="/recuperar" className="text-xs text-[var(--color-primary)] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link> */}
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Iniciar sesión
            {!isLoading && <ArrowRight size={18} className="ml-2" />}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-[var(--color-primary)] font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
