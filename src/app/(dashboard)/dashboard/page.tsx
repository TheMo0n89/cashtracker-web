'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  Target,
  PieChart as PieChartIcon,
  TrendingUp
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// Fetchers
const fetchSummary = async (year: number, month: number) => {
  const { data } = await api.get(`/dashboard/summary?year=${year}&month=${month}`);
  return data.data; // interceptor unwrap
};

const fetchBudgets = async (year: number, month: number) => {
  const { data } = await api.get(`/dashboard/budgets?year=${year}&month=${month}`);
  return data.data;
};

const fetchGoals = async () => {
  const { data } = await api.get('/dashboard/goals');
  return data.data;
};

const fetchDistribution = async (year: number, month: number) => {
  const { data } = await api.get(`/dashboard/distribution?year=${year}&month=${month}`);
  return data.data || data;
};

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['summary', year, month],
    queryFn: () => fetchSummary(year, month),
  });

  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets', year, month],
    queryFn: () => fetchBudgets(year, month),
  });

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => fetchGoals(),
  });

  const { data: distribution, isLoading: loadingDistribution } = useQuery({
    queryKey: ['distribution', year, month],
    queryFn: () => fetchDistribution(year, month),
  });

  const hasExpenses = distribution && distribution.length > 0;
  const chartData = hasExpenses
    ? distribution
    : [{ name: 'Sin gastos', value: 1, color: 'var(--color-element-border)' }];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumen Financiero</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Panorama detallado de tus movimientos.
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-[var(--color-surface)] border border-[var(--color-element-border)] p-1 rounded-xl glass shadow-lg">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer p-2 rounded-lg hover:bg-[var(--color-element-bg)]"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1} className="bg-[var(--color-surface)]">
                {new Date(0, i).toLocaleString('es', { month: 'long' })}
              </option>
            ))}
          </select>
          <div className="w-px bg-[var(--color-element-bg-hover)] mx-1"></div>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer p-2 rounded-lg hover:bg-[var(--color-element-bg)]"
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y} className="bg-[var(--color-surface)]">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)] rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-[var(--color-text-secondary)]">Ingresos del Mes</div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {loadingSummary ? '...' : formatCurrency(summary?.totalIncome || 0)}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-danger)] rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-[var(--color-text-secondary)]">Gastos del Mes</div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-danger-light)] text-[var(--color-danger)] flex items-center justify-center">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {loadingSummary ? '...' : formatCurrency(summary?.totalExpense || 0)}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden group border border-[var(--color-accent)]/20 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-accent)] rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-[var(--color-text-secondary)]">Balance Disponible</div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {loadingSummary ? '...' : formatCurrency(summary?.balance || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="glass rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="text-[var(--color-primary)]" size={20} />
            <h3 className="text-lg font-semibold">Distribución de Gastos</h3>
          </div>
          <div className="relative flex-1 w-full min-h-[300px]">
            {loadingDistribution ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50">
                <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Sincronizando...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={hasExpenses ? 5 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {hasExpenses && (
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(Number(value) || 0)}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-surface-border)',
                        borderRadius: '12px',
                        color: 'var(--color-text-primary)',
                        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
                      }}
                      labelStyle={{ color: 'var(--color-text-primary)' }}
                      itemStyle={{ color: 'var(--color-text-primary)' }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            )}
            {!hasExpenses && !loadingDistribution && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
                <p className="text-[var(--color-text-muted)] text-sm font-medium">Aún no hay gastos registrados.</p>
              </div>
            )}
          </div>
        </div>

        {/* Budgets Progress */}
        <div className="glass rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[var(--color-accent)]" size={20} />
              <h3 className="text-lg font-semibold">Presupuestos</h3>
            </div>
          </div>
          
          <div className="space-y-5 flex-1 overflow-y-auto">
            {loadingBudgets ? (
              <div className="flex flex-col space-y-4 pt-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-full h-12 bg-[var(--color-element-bg)] animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : budgets && budgets.length > 0 ? (
              budgets.map((budget: any) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[var(--color-text-secondary)]">{budget.categoryName}</span>
                    <span className="font-semibold">{formatCurrency(budget.spent)} / {formatCurrency(budget.budgetAmount)}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-element-bg)] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: budget.percentage > 90 ? 'var(--color-danger)' : budget.percentage > 75 ? 'var(--color-warning)' : 'var(--color-primary)'
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60 pt-10">
                <PieChartIcon size={32} className="text-[var(--color-text-muted)]" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Organiza tu dinero creando tu<br/>primer presupuesto mensual.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-[var(--color-primary)]" size={20} />
          <h3 className="text-lg font-semibold">Metas de Ahorro</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingGoals ? (
            Array.from({length: 3}).map((_, i) => (
              <div key={i} className="h-32 bg-[var(--color-element-bg)] animate-pulse rounded-xl"></div>
            ))
          ) : goals && goals.length > 0 ? (
            goals.map((goal: any) => (
              <div key={goal.id} className="bg-[var(--color-element-bg)] border border-[var(--color-element-border)] rounded-xl p-5 hover:bg-[var(--color-element-bg-hover)] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{goal.name}</h4>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--color-element-bg-hover)]">{goal.percentage}%</span>
                </div>
                <div className="text-2xl font-bold text-[var(--color-primary)] mb-4">
                  {formatCurrency(goal.currentAmount)}
                </div>
                <div className="h-2 w-full bg-[var(--color-background)] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out bg-[var(--color-primary)]" 
                    style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-2">
                  <span>Objetivo: {formatCurrency(goal.targetAmount)}</span>
                  {goal.deadline && <span>Hasta {new Date(goal.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-60 border-2 border-dashed border-[var(--color-element-border)] rounded-2xl">
              <Target size={40} className="text-[var(--color-text-muted)] mb-3" />
              <p className="text-base font-medium">Aún no tienes metas de ahorro.</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Establece un objetivo para el coche nuevo o las vacaciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
