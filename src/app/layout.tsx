import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CashTracker',
  description: 'Controla tus finanzas, presupuestos y metas de ahorro con una interfaz premium y herramientas avanzadas.',
  keywords: ['finanzas', 'presupuesto', 'ahorro', 'cashtracker', 'gastos'],
};

/**
 * Inline theme script — inyectado como Client Component para evitar
 * que Next.js omita rutas del build output al detectar patrones
 * de localStorage dentro de un Server Component layout.
 */
function ThemeScript() {
  const script = `
    try {
      var t = localStorage.getItem('cashtracker-theme');
      if (t) { t = JSON.parse(t).state.theme; }
      document.documentElement.classList.add(t === 'light' ? 'light' : 'dark');
    } catch (e) {}
  `;
  // biome-ignore lint/security/noDangerouslySetInnerHtml: intencional — tema sin FOUC
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased selection:bg-accent/30 selection:text-[var(--color-text-primary)]`}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
