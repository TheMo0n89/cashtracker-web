'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Target, 
  PieChart as PieChartIcon, 
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function BudgetsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: budgets, isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets', year, month],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/budgets?year=${year}&month=${month}`);
      return data.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories?type=expense');
      return data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newBudget: { categoryId: string; year: number; month: number; amount: number }) => {
      await api.post('/budgets', newBudget);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (budget: { id: string; amount: number }) => {
      await api.put(`/budgets/${budget.id}`, { amount: budget.amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setCategoryId('');
    setAmount('');
  };

  const openEditModal = (budget: any) => {
    setEditingId(budget.id);
    setCategoryId(budget.categoryId);
    setAmount(budget.budgetAmount);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este límite de presupuesto?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        amount: parseFloat(amount),
      });
    } else {
      if (!categoryId) return;
      mutation.mutate({
        categoryId,
        year,
        month,
        amount: parseFloat(amount),
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Establece límites mensuales para no excederte en tus gastos.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
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

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Stats/Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="text-[var(--color-accent)]" size={20} />
            <h3 className="text-lg font-semibold">Tus límites del mes</h3>
          </div>
          
          <div className="space-y-6">
            {loadingBudgets ? (
              <div className="flex flex-col space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-full h-16 bg-[var(--color-element-bg)] animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : budgets && budgets.length > 0 ? (
              budgets.map((budget: any) => (
                <div key={budget.id} className="bg-[var(--color-element-bg)] border border-[var(--color-element-border)] p-4 rounded-xl space-y-3 hover:bg-[var(--color-element-bg-hover)] transition-colors group">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-[var(--color-element-bg-hover)] text-xl">
                        {budget.categoryIcon || '🏷️'}
                      </div>
                      <span className="font-semibold text-lg truncate" title={budget.categoryName}>{budget.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-lg">{formatCurrency(budget.spent)}</span>
                        <span className="text-[var(--color-text-secondary)] text-sm ml-1">
                          / {formatCurrency(budget.budgetAmount)}
                        </span>
                      </div>
                      <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(budget)}
                          aria-label="Editar presupuesto"
                          title="Editar"
                          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(budget.id)}
                          aria-label="Eliminar presupuesto"
                          title="Eliminar"
                          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-[var(--color-element-bg)] rounded-full overflow-hidden border border-[var(--color-element-border)]">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: budget.percentage > 90 ? 'var(--color-danger)' : budget.percentage > 75 ? 'var(--color-warning)' : 'var(--color-primary)'
                      }}
                    ></div>
                  </div>
                  {budget.percentage >= 100 && (
                    <div className="flex items-center gap-2 text-[var(--color-danger)] text-sm font-medium mt-1">
                      <AlertCircle size={14} /> Has excedido tu límite para esta categoría.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-60 border-2 border-dashed border-[var(--color-element-border)] rounded-2xl">
                <Target size={40} className="text-[var(--color-text-muted)] mb-3" />
                <p className="text-base font-medium">Aún no has configurado presupuestos este mes.</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Asigna un límite a tus categorías de gasto para llevar un mejor control.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips / Info */}
        <div className="glass rounded-2xl p-6 h-fit bg-gradient-to-br from-white/5 to-[var(--color-primary)]/10 border-[var(--color-primary)]/20">
          <h3 className="font-semibold text-lg mb-4 text-[var(--color-text-primary)]">¿Por qué presupuestar?</h3>
          <ul className="space-y-4 text-sm text-[var(--color-text-secondary)]">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">1</div>
              <p>Evita sorpresas a fin de mes limitando tus gastos en "comida rápida" o "entretenimiento".</p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">2</div>
              <p>El color de la barra cambiará a amarillo y luego a rojo a medida que te acerques a tu límite.</p>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">3</div>
              <p>Usa montos mayores a 0 para que el sistema acepte el presupuesto y calcule el progreso correctamente.</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[var(--color-element-border)]">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!editingId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Categoría de Gasto
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-field appearance-none bg-[var(--color-surface)]"
                    required
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Monto Límite
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field pl-8"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {mutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
