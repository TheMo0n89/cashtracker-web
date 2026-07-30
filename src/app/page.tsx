'use client';

// La landing page se renderiza en el cliente para garantizar que Next.js
// la incluya siempre en el output del build. Sin 'use client', Next.js
// omite silenciosamente la ruta "/" cuando detecta providers client-side
// (ThemeProvider, Providers) en el árbol del layout — causando 404 en Vercel.

import Link from 'next/link';
import { ArrowRight, Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-accent)] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[var(--color-element-border)] mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">CashTracker</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Inteligencia financiera a tu <br className="hidden md:block" />
          <span className="text-gradient">alcance.</span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          Controla tus gastos, planifica tus presupuestos y alcanza tus metas de ahorro con una interfaz diseñada para la excelencia.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-4 rounded-xl font-medium transition-all hover-scale active-scale"
          >
            Comenzar ahora
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl px-6 z-10 w-full">
        {/* Feature Cards */}
        {[
          {
            title: 'Seguimiento en tiempo real',
            description: 'Sincronización instantánea de tus movimientos financieros.',
            icon: <Wallet className="text-[var(--color-primary)]" size={24} />,
          },
          {
            title: 'Presupuestos Inteligentes',
            description: 'Establece límites y recibe alertas cuando estés cerca de cruzarlos.',
            icon: <TrendingUp className="text-[var(--color-accent)]" size={24} />,
          },
          {
            title: 'Seguridad Bancaria',
            description: 'Tus datos están protegidos con encriptación de nivel militar.',
            icon: <ShieldCheck className="text-[var(--color-primary)]" size={24} />,
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="glass p-6 rounded-2xl flex flex-col gap-4 animate-slide-up hover-scale"
            style={{ animationDelay: `${0.5 + i * 0.1}s` }}
          >
            <div className="w-12 h-12 rounded-lg bg-[var(--color-element-bg)] flex items-center justify-center border border-[var(--color-element-border)]">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold">{feature.title}</h3>
            <p className="text-[var(--color-text-secondary)]">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
