'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Filter, 
  Calendar,
  Edit2,
  Trash2,
  FileText,
  X,
  Search,
  RotateCcw
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ALL_CATEGORY_GROUPS = 'all';
const UNGROUPED_CATEGORY_GROUP = '__ungrouped__';

const getTodayInputDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateInputValue = (date: string) => date.slice(0, 10);

const formatTransactionDate = (date: string) => {
  const [year, month, day] = toDateInputValue(date).split('-');
  return `${day}/${month}/${year}`;
};

// Helper to fetch paginated transactions
const fetchTransactions = async (page: number, perPage: number, filters: any = {}) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
    ...filters
  });
  const { data } = await api.get(`/transactions?${queryParams.toString()}`);
  return data;
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>(now.getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(now.getFullYear());
  const [categoryGroupFilter, setCategoryGroupFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    categoryGroupId: ALL_CATEGORY_GROUPS,
    categoryId: '',
    date: getTodayInputDate(),
    paymentPlace: '',
    invoiceNumber: '',
    invoiceFilePath: '',
  });
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceViewer, setInvoiceViewer] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
    message: string | null;
  }>({ isOpen: false, url: null, title: '', message: null });

  const filters: Record<string, string> = {};

  if (typeFilter !== 'all') {
    filters.type = typeFilter;
  }

  if (monthFilter !== 'all') {
    filters.dateFrom = `${yearFilter}-${String(monthFilter).padStart(2, '0')}-01`;
    filters.dateTo = `${yearFilter}-${String(monthFilter).padStart(2, '0')}-${String(new Date(yearFilter, monthFilter, 0).getDate()).padStart(2, '0')}`;
  }

  if (categoryGroupFilter !== 'all') {
    filters.categoryGroupId = categoryGroupFilter;
  }

  if (categoryFilter !== 'all') {
    filters.categoryId = categoryFilter;
  }

  if (searchFilter.trim()) {
    filters.search = searchFilter.trim();
  }

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, perPage, filters],
    queryFn: () => fetchTransactions(page, perPage, filters),
  });

  // Fetch categories for the form dropdown
  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data || data || [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: categoryGroupsData, refetch: refetchCategoryGroups } = useQuery({
    queryKey: ['category-groups'],
    queryFn: async () => {
      const { data } = await api.get('/category-groups');
      return data.data || data || [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const transactions = data?.data || [];
  const meta = data?.meta || { total: 0, lastPage: 1 };
  const categories = categoriesData || [];
  const allCategoryGroups = categoryGroupsData || [];
  const groupsById = new Map(
    allCategoryGroups.map((group: any) => [group.id, group]),
  );
  const categoriesById = new Map(
    categories.map((category: any) => [category.id, category]),
  );

  useEffect(() => {
    if (!isModalOpen || !formData.categoryId) return;

    const selectedCategory = categoriesById.get(formData.categoryId) as any;
    if (!selectedCategory) return;

    const nextGroupId =
      selectedCategory.categoryGroupId || UNGROUPED_CATEGORY_GROUP;

    if (formData.categoryGroupId !== nextGroupId) {
      setFormData((current) => ({
        ...current,
        categoryGroupId: nextGroupId,
      }));
    }
  }, [categoriesData, formData.categoryGroupId, formData.categoryId, isModalOpen]);
  const categoriesForType = categories.filter((category: any) =>
    typeFilter === 'all' ? true : category.type === typeFilter,
  );
  const categoryGroups = allCategoryGroups
    .filter((group: any) => (typeFilter === 'all' ? true : group.type === typeFilter))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  const categoriesForFilter = categoriesForType.filter((category: any) =>
    categoryGroupFilter === 'all'
      ? true
      : (category.categoryGroupId || category.categoryGroup?.id) === categoryGroupFilter,
  );

  const getCategoryWithGroup = (transaction: any) => {
    const category =
      (transaction.categoryId ? categoriesById.get(transaction.categoryId) : null) ||
      transaction.category ||
      null;
    const categoryGroup =
      category?.categoryGroup ||
      (category?.categoryGroupId ? groupsById.get(category.categoryGroupId) : null) ||
      null;

    return { category, categoryGroup };
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setMonthFilter(now.getMonth() + 1);
    setYearFilter(now.getFullYear());
    setCategoryGroupFilter('all');
    setCategoryFilter('all');
    setSearchFilter('');
    setPage(1);
  };

  const updateTypeFilter = (value: 'all' | 'income' | 'expense') => {
    setTypeFilter(value);
    setCategoryGroupFilter('all');
    setCategoryFilter('all');
    setPage(1);
  };

  const updateCategoryGroupFilter = (value: string) => {
    setCategoryGroupFilter(value);
    setCategoryFilter('all');
    setPage(1);
  };

  // MUTATIONS
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/transactions', payload);
      const transaction = data.data || data;
      if (invoiceFile) {
        await uploadInvoice(transaction.id, invoiceFile);
      }
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put(`/transactions/${editingId}`, payload);
      const transaction = data.data || data;
      if (editingId && invoiceFile) {
        await uploadInvoice(editingId, invoiceFile);
      }
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['distribution'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}/invoice`);
    },
    onSuccess: () => {
      setFormData((current) => ({ ...current, invoiceFilePath: '' }));
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const uploadInvoice = async (transactionId: string, file: File) => {
    const body = new FormData();
    body.append('file', file);
    await api.post(`/transactions/${transactionId}/invoice`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  // HANDLERS
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      categoryGroupId: ALL_CATEGORY_GROUPS,
      categoryId: '',
      date: getTodayInputDate(),
      paymentPlace: '',
      invoiceNumber: '',
      invoiceFilePath: '',
    });
    setInvoiceFile(null);
  };

  const openCreateModal = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const openEditModal = async (t: any) => {
    const [freshCategoriesResult] = await Promise.all([
      refetchCategories(),
      refetchCategoryGroups(),
    ]);
    const freshCategories = freshCategoriesResult.data || categories;
    const freshCategory = freshCategories.find(
      (category: any) => category.id === t.categoryId,
    );
    const category = freshCategory || (categoriesById.get(t.categoryId) as any);
    const categoryGroupId =
      category?.categoryGroupId ||
      t.category?.categoryGroupId ||
      UNGROUPED_CATEGORY_GROUP;

    setEditingId(t.id);
    setFormData({
      description: t.description || '',
      amount: t.amount.toString(),
      type: t.type,
      categoryGroupId,
      categoryId: t.categoryId,
      date: toDateInputValue(t.date),
      paymentPlace: t.paymentPlace || '',
      invoiceNumber: t.invoiceNumber || '',
      invoiceFilePath: t.invoiceFilePath || '',
    });
    setInvoiceFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.categoryId || !formData.date) return;

    const payload = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      categoryId: formData.categoryId,
      date: formData.date,
      paymentPlace: formData.paymentPlace || undefined,
      invoiceNumber: formData.invoiceNumber || undefined,
    };

    if (editingId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const compatibleGroups = allCategoryGroups.filter(
    (group: any) => group.type === formData.type,
  );

  // Group categories by their parent group for the select dropdown
  const filteredCategories = categoriesData?.filter((c: any) => c.type === formData.type) || [];
  const modalCategories = filteredCategories.filter((cat: any) => {
    if (formData.categoryGroupId === ALL_CATEGORY_GROUPS) return true;
    const groupId = cat.categoryGroupId || UNGROUPED_CATEGORY_GROUP;
    return groupId === formData.categoryGroupId;
  });
  const groupedCategories = modalCategories.reduce((acc: Record<string, any[]>, cat: any) => {
    const groupName = cat.categoryGroup?.name || 'Otras Categorías';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const openInvoice = async (transaction: any) => {
    const title = transaction.invoiceNumber
      ? `Factura ${transaction.invoiceNumber}`
      : 'Factura';

    if (!transaction.invoiceFilePath) {
      setInvoiceViewer({
        isOpen: true,
        url: null,
        title,
        message: 'Esta transaccion tiene numero de factura, pero no tiene PDF adjunto.',
      });
      return;
    }

    try {
      const { data } = await api.get(`/transactions/${transaction.id}/invoice`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      setInvoiceViewer({ isOpen: true, url, title, message: null });
    } catch {
      setInvoiceViewer({
        isOpen: true,
        url: null,
        title,
        message: 'No se pudo abrir el PDF de esta factura.',
      });
    }
  };

  const closeInvoiceViewer = () => {
    if (invoiceViewer.url) {
      URL.revokeObjectURL(invoiceViewer.url);
    }
    setInvoiceViewer({ isOpen: false, url: null, title: '', message: null });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Historial completo de tus ingresos y gastos.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={openCreateModal}>
            <Plus size={18} className="mr-2" /> Nueva Transacción
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="glass rounded-2xl border border-[var(--color-element-border)] p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Filter size={18} />
            <h3 className="font-semibold text-[var(--color-text-primary)]">Filtros</h3>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-element-bg-hover)] hover:text-[var(--color-text-primary)]"
          >
            <RotateCcw size={15} />
            Limpiar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[var(--color-element-border)] pb-4">
          <button
            onClick={() => updateTypeFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-[var(--color-element-bg-hover)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Todas
          </button>
          <button
            onClick={() => updateTypeFilter('income')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${typeFilter === 'income' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Ingresos
          </button>
          <button
            onClick={() => updateTypeFilter('expense')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${typeFilter === 'expense' ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Gastos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Mes</label>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setPage(1);
              }}
              className="input-field"
            >
              <option value="all">Todos los meses</option>
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(0, index).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Año</label>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(Number(e.target.value));
                setPage(1);
              }}
              className="input-field"
              disabled={monthFilter === 'all'}
            >
              {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Grupo</label>
            <select
              value={categoryGroupFilter}
              onChange={(e) => updateCategoryGroupFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos los grupos</option>
              {categoryGroups.map((group: any) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="all">Todas las categorías</option>
              {categoriesForFilter.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Concepto, factura, lugar..."
                className="input-field pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-2xl overflow-hidden border border-[var(--color-element-border)] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-text-secondary)] uppercase bg-[var(--color-element-bg)] border-b border-[var(--color-element-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Grupo / Categoria</th>
                <th className="px-6 py-4 font-medium">Descripcion</th>
                <th className="px-6 py-4 font-medium">Ubicacion de Pago / Factura</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    Cargando transacciones...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((t: any) => {
                  const { category, categoryGroup } = getCategoryWithGroup(t);

                  return (
                  <tr key={t.id} className="border-b border-[var(--color-element-border)] hover:bg-[var(--color-element-bg)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                          {categoryGroup?.name || 'Sin grupo'}
                        </div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--color-element-bg)] border border-[var(--color-element-border)]">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category?.color || '#a1a1aa' }}
                          ></div>
                          <span className="text-xs font-medium">{category?.name || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--color-text-primary)]">{t.description || 'Sin descripcion'}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">ID: {t.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {t.paymentPlace || 'Sin lugar'}
                        </div>
                        {t.invoiceNumber ? (
                          <button
                            type="button"
                            onClick={() => openInvoice(t)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                          >
                            <FileText size={13} />
                            {t.invoiceNumber}
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Sin factura</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-[var(--color-text-secondary)]">
                        <Calendar size={14} className="mr-2 opacity-70" />
                        {formatTransactionDate(t.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-semibold flex items-center justify-end gap-1 ${t.type === 'income' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(t)}
                          aria-label="Editar transaccion"
                          title="Editar"
                          className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-element-bg-hover)] transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          aria-label="Eliminar transaccion"
                          title="Eliminar"
                          className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] rounded-md hover:bg-[var(--color-danger-light)] transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                    No hay transacciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-element-border)] bg-[var(--color-element-bg)]">
          <span className="text-sm text-[var(--color-text-secondary)]">
            Mostrando página <span className="font-medium text-[var(--color-text-primary)]">{page}</span> de <span className="font-medium text-[var(--color-text-primary)]">{meta.lastPage}</span>
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
              disabled={page === meta.lastPage || isLoading || transactions.length === 0}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border border-[var(--color-element-border)]">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Transacción' : 'Nueva Transacción'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  disabled={Boolean(editingId)}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: 'expense',
                      categoryGroupId: ALL_CATEGORY_GROUPS,
                      categoryId: '',
                    })
                  }
                  className={`py-2 rounded-xl text-sm font-medium transition-colors border disabled:cursor-not-allowed disabled:opacity-70 ${
                    formData.type === 'expense' 
                      ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)] border-[var(--color-danger)]/20' 
                      : 'bg-[var(--color-element-bg)] border-transparent text-[var(--color-text-secondary)]'
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  disabled={Boolean(editingId)}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: 'income',
                      categoryGroupId: ALL_CATEGORY_GROUPS,
                      categoryId: '',
                    })
                  }
                  className={`py-2 rounded-xl text-sm font-medium transition-colors border disabled:cursor-not-allowed disabled:opacity-70 ${
                    formData.type === 'income' 
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20' 
                      : 'bg-[var(--color-element-bg)] border-transparent text-[var(--color-text-secondary)]'
                  }`}
                >
                  Ingreso
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-field text-xl font-bold font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Grupo
                </label>
                <select
                  value={formData.categoryGroupId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryGroupId: e.target.value,
                      categoryId: '',
                    })
                  }
                  className="input-field appearance-none bg-[var(--color-surface)]"
                >
                  <option value={ALL_CATEGORY_GROUPS}>Todos los grupos</option>
                  {compatibleGroups.map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.icon} {group.name}
                    </option>
                  ))}
                  <option value={UNGROUPED_CATEGORY_GROUP}>Sin grupo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Categoría
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input-field appearance-none bg-[var(--color-surface)]"
                  required
                >
                  <option value="">-- Seleccionar Categoría --</option>
                  {Object.entries(groupedCategories).map(([groupName, categories]) => (
                    <optgroup key={groupName} label={groupName} className="bg-[var(--color-surface)] font-bold text-[var(--color-primary-hover)]">
                      {(categories as any[]).map((cat: any) => (
                        <option key={cat.id} value={cat.id} className="text-[var(--color-text-primary)] font-normal">
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-field bg-[var(--color-surface)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Almuerzo, Uber..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Lugar de pago
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Supermercado, Yape..."
                    value={formData.paymentPlace}
                    onChange={(e) => setFormData({ ...formData, paymentPlace: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Numero de factura
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. F001-12345"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  PDF de factura
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                  className="input-field"
                />
                {invoiceFile && (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Archivo seleccionado: {invoiceFile.name}
                  </p>
                )}
                {editingId && formData.invoiceFilePath && !invoiceFile && (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--color-element-border)] bg-[var(--color-element-bg)] px-3 py-2 text-sm">
                    <span className="text-[var(--color-text-secondary)]">Hay un PDF adjunto.</span>
                    <button
                      type="button"
                      onClick={() => deleteInvoiceMutation.mutate(editingId)}
                      className="text-[var(--color-danger)] hover:underline"
                    >
                      Quitar PDF
                    </button>
                  </div>
                )}
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceViewer.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-4xl h-[85vh] rounded-2xl border border-[var(--color-element-border)] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-element-border)]">
              <div className="flex items-center gap-2 font-semibold">
                <FileText size={18} className="text-[var(--color-primary)]" />
                {invoiceViewer.title}
              </div>
              <button
                type="button"
                onClick={closeInvoiceViewer}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-element-bg-hover)]"
                aria-label="Cerrar visor"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 bg-[var(--color-background)]">
              {invoiceViewer.url ? (
                <iframe
                  src={invoiceViewer.url}
                  title={invoiceViewer.title}
                  className="w-full h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-[var(--color-text-secondary)]">
                  {invoiceViewer.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


