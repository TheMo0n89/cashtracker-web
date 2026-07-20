'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      
      const user = data.data?.user || data.user;
      const token = data.data?.accessToken || data.accessToken;
      
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la cuenta. Verifica tus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative p-6">
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[20%] left-[20%] w-[30%] h-[30%] bg-[var(--color-accent)] rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors">
        <Wallet className="text-[var(--color-primary)]" size={24} />
        <span className="font-heading font-semibold text-xl tracking-tight">CashTracker</span>
      </Link>

      <div className="w-full max-w-md glass rounded-3xl p-8 z-10 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Comienza ahora</h1>
          <p className="text-[var(--color-text-secondary)]">Crea tu cuenta y toma el control de tu dinero</p>
        </div>

        {error && (
          <div className="bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 text-[var(--color-danger)] p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] pl-1">Nombre completo</label>
            <Input 
              type="text" 
              placeholder="Juan Pérez" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
            <label className="text-sm font-medium text-[var(--color-text-secondary)] pl-1">Contraseña</label>
            <Input 
              type="password" 
              placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 símbolo" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-[var(--color-text-muted)] pl-1 mt-1">
              Debe contener al menos una mayúscula, número y símbolo.
            </p>
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Crear cuenta
            {!isLoading && <ArrowRight size={18} className="ml-2" />}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
