'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Target, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Contribution Form State
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/goals');
      return data.data;
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: { name: string; targetAmount: number; deadline?: string }) => {
      await api.post('/savings-goals', newGoal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      closeModal();
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (goal: { id: string; name: string; targetAmount: number; deadline?: string | null }) => {
      await api.put(`/savings-goals/${goal.id}`, { name: goal.name, targetAmount: goal.targetAmount, deadline: goal.deadline });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      closeModal();
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/savings-goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
    setTargetAmount('');
    setDeadline('');
  };

  const openEditModal = (goal: any) => {
    setEditingId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta meta de ahorro?')) {
      deleteGoalMutation.mutate(id);
    }
  };

  const contributeMutation = useMutation({
    mutationFn: async (contribution: { savingsGoalId: string; amount: number; note?: string }) => {
      await api.post(`/savings-goals/${contribution.savingsGoalId}/contributions`, {
        amount: contribution.amount,
        note: contribution.note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsContributionModalOpen(false);
      setContributionAmount('');
      setContributionNote('');
      setSelectedGoal(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    
    if (editingId) {
      updateGoalMutation.mutate({
        id: editingId,
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline ? deadline : null,
      });
    } else {
      createGoalMutation.mutate({
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline || undefined,
      });
    }
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionAmount) return;
    contributeMutation.mutate({
      savingsGoalId: selectedGoal.id,
      amount: parseFloat(contributionAmount),
      note: contributionNote,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas de Ahorro</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Convierte tus sueños en objetivos financieros medibles.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Nueva Meta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-48 bg-[var(--color-element-bg)] animate-pulse rounded-2xl"></div>
          ))
        ) : goals && goals.length > 0 ? (
          goals.map((goal: any) => {
            const isCompleted = goal.percentage >= 100;
            return (
              <div 
                key={goal.id} 
                className={`glass rounded-2xl p-6 relative overflow-hidden group border ${
                  isCompleted ? 'border-[var(--color-primary)]/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-[var(--color-element-border)]'
                }`}
              >
                {isCompleted && (
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                )}
                
                <div className="flex justify-between items-start mb-4 relative z-10 gap-4">
                  <h4 className="font-bold text-xl pr-4 truncate flex-1 min-w-0" title={goal.name}>{goal.name}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="text-[var(--color-primary)] flex-shrink-0" size={24} />
                    ) : (
                      <span className="text-sm font-bold px-3 py-1 rounded-full bg-[var(--color-element-bg-hover)]">{goal.percentage}%</span>
                    )}
                    <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-2">
                      <button onClick={() => openEditModal(goal)} aria-label="Editar meta" title="Editar" className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(goal.id)} aria-label="Eliminar meta" title="Eliminar" className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-3xl font-bold tracking-tight mb-6">
                  {formatCurrency(goal.currentAmount)}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="h-3 w-full bg-[var(--color-element-bg)] rounded-full overflow-hidden border border-[var(--color-element-border)]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isCompleted ? 'bg-gradient-to-r from-[var(--color-primary)] to-indigo-400' : 'bg-[var(--color-primary)]'
                      }`}
                      style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-text-secondary)] font-medium">
                    <span>Objetivo: {formatCurrency(goal.targetAmount)}</span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {!isCompleted && (
                  <button 
                    onClick={() => {
                      setSelectedGoal(goal);
                      setIsContributionModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-element-bg)] hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-medium transition-colors"
                  >
                    <Coins size={16} /> Aportar fondos
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60 border-2 border-dashed border-[var(--color-element-border)] rounded-2xl glass">
            <Target size={56} className="text-[var(--color-text-muted)] mb-4" />
            <p className="text-xl font-bold text-[var(--color-text-primary)]">No tienes ninguna meta activa</p>
            <p className="text-base text-[var(--color-text-secondary)] mt-2 max-w-md">
              Ahorrar es más fácil cuando sabes para qué lo haces. Crea tu primera meta y empieza a ver tu progreso.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-6 py-2 rounded-xl bg-[var(--color-element-bg-hover)] hover:bg-white/20 transition-colors font-medium text-[var(--color-text-primary)]"
            >
              Crear Meta de Ahorro
            </button>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[var(--color-element-border)]">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Nombre de la meta
                </label>
                <input
                  type="text"
                  placeholder="Ej. Coche Nuevo, Viaje a Japón..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Monto Objetivo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="input-field pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input-field"
                />
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
                  disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createGoalMutation.isPending || updateGoalMutation.isPending ? 'Guardando...' : 'Guardar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {isContributionModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[var(--color-primary)]/20">
            <h2 className="text-xl font-bold mb-1">Aportar Fondos</h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              Estás contribuyendo a: <span className="font-semibold text-[var(--color-text-primary)]">{selectedGoal.name}</span>
            </p>
            
            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Cantidad a aportar
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
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="input-field pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Nota (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Bono navideño"
                  value={contributionNote}
                  onChange={(e) => setContributionNote(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsContributionModalOpen(false);
                    setSelectedGoal(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contributeMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {contributeMutation.isPending ? 'Procesando...' : 'Añadir Fondo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
