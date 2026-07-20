'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User,
  Tags,
  Plus,
  Trash2,
  AlertCircle,
  Edit2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  GripVertical
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/components/ui/toast';
import { getApiErrorMessage } from '@/lib/api-error';

type CategoryType = 'income' | 'expense';

type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  categoryGroupId?: string | null;
};

type CategoryGroup = {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
};

type CreateCategoryPayload = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  categoryGroupId: string | null;
};

type UpdateCategoryPayload = Omit<CreateCategoryPayload, 'type'>;

type CreateCategoryGroupPayload = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

type UpdateCategoryGroupPayload = Omit<CreateCategoryGroupPayload, 'type'>;

type DeletionImpact = {
  canDelete: boolean;
  activeTransactions: number;
};

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'classification' | 'profile'>('classification');
  
  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Accordion State
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);

  // Category Form
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [catIcon, setCatIcon] = useState('🏷️');
  const [catGroupId, setCatGroupId] = useState('');

  // Group Form
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<CategoryType>('expense');
  const [groupIcon, setGroupIcon] = useState('📁');

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data;
    },
  });

  const { data: groups = [], isLoading: loadingGroups } = useQuery<CategoryGroup[]>({
    queryKey: ['category-groups'],
    queryFn: async () => {
      const { data } = await api.get('/category-groups');
      return data.data;
    },
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  // --- MUTATIONS ---
  const createCategoryMutation = useMutation({
    mutationFn: async (newCategory: CreateCategoryPayload) =>
      await api.post('/categories', newCategory),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); closeCategoryModal(); },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => await api.put(`/categories/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      toast.success('Categoría actualizada');
      closeCategoryModal();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría eliminada');
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (newGroup: CreateCategoryGroupPayload) =>
      await api.post('/category-groups', newGroup),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['category-groups'] }); closeGroupModal(); },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryGroupPayload;
    }) => await api.put(`/category-groups/${id}`, payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['category-groups'] }); 
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      closeGroupModal(); 
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/category-groups/${id}`),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['category-groups'] }); 
      queryClient.invalidateQueries({ queryKey: ['categories'] }); 
      toast.success('Grupo eliminado', 'Las categorías quedaron sin grupo.');
    },
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (payload: {
      type: CategoryType;
      categoryGroupId: string | null;
      orderedCategoryIds: string[];
    }) => await api.patch('/categories/reorder', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      toast.success('Categoría movida');
    },
  });

  const moveCategoryMutation = useMutation({
    mutationFn: async ({
      category,
      categoryGroupId,
    }: {
      category: Category;
      categoryGroupId: string | null;
    }) =>
      await api.put(`/categories/${category.id}`, {
        name: category.name,
        icon: category.icon || '🏷️',
        color: category.color || (category.type === 'expense' ? '#ef4444' : '#10b981'),
        categoryGroupId,
      } satisfies UpdateCategoryPayload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      toast.success('Categoría movida');
    },
  });

  // --- HANDLERS ---
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategoryId(null);
    setCatName('');
    setCatIcon('🏷️');
    setCatGroupId('');
  };

  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroupId(null);
    setGroupName('');
    setGroupIcon('📁');
  };

  const openNewCategoryModal = (type: CategoryType, groupId: string = '') => {
    setEditingCategoryId(null);
    setCatName('');
    setCatType(type);
    setCatIcon('🏷️');
    setCatGroupId(groupId);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon || '🏷️');
    setCatGroupId(cat.categoryGroupId || '');
    setIsCategoryModalOpen(true);
  };

  const openNewGroupModal = (type: CategoryType) => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupType(type);
    setGroupIcon('📁');
    setIsGroupModalOpen(true);
  };

  const openEditGroup = (grp: CategoryGroup) => {
    setEditingGroupId(grp.id);
    setGroupName(grp.name);
    setGroupType(grp.type);
    setGroupIcon(grp.icon || '📁');
    setIsGroupModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    let impact: DeletionImpact;

    try {
      const { data } = await api.get<{ data: DeletionImpact }>(
        `/categories/${id}/deletion-impact`,
      );
      impact = data.data;
    } catch (error) {
      toast.error('No se pudo verificar la categoría', getApiErrorMessage(error));
      return;
    }

    if (!impact.canDelete) {
      toast.error(
        'No se puede eliminar la categoría',
        `Tiene ${impact.activeTransactions} transaccion(es) activa(s). Elimina o reasigna esas transacciones primero.`,
      );
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este grupo? (Las subcategorías quedarán sueltas).')) {
      deleteGroupMutation.mutate(id);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    const payload: CreateCategoryPayload = {
      name: catName,
      type: catType,
      icon: catIcon,
      color: catType === 'expense' ? '#ef4444' : '#10b981',
      categoryGroupId: catGroupId || null,
    };
    if (editingCategoryId) {
      const updatePayload: UpdateCategoryPayload = {
        name: payload.name,
        icon: payload.icon,
        color: payload.color,
        categoryGroupId: payload.categoryGroupId,
      };
      updateCategoryMutation.mutate({
        id: editingCategoryId,
        payload: updatePayload,
      });
    } else createCategoryMutation.mutate(payload);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;
    const payload: CreateCategoryGroupPayload = {
      name: groupName,
      type: groupType,
      icon: groupIcon,
      color: groupType === 'expense' ? '#ef4444' : '#10b981',
    };
    if (editingGroupId) {
      const updatePayload: UpdateCategoryGroupPayload = {
        name: payload.name,
        icon: payload.icon,
        color: payload.color,
      };
      updateGroupMutation.mutate({
        id: editingGroupId,
        payload: updatePayload,
      });
    } else createGroupMutation.mutate(payload);
  };

  const handleCategoryDrop = (
    type: CategoryType,
    categoryGroupId: string | null,
    targetCategoryId: string,
    list: Category[],
  ) => {
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDraggedCategoryId(null);
      return;
    }

    const currentIds = list.map((category) => category.id);
    const fromIndex = currentIds.indexOf(draggedCategoryId);
    const toIndex = currentIds.indexOf(targetCategoryId);

    if (fromIndex < 0) {
      handleCategoryGroupDrop(type, categoryGroupId);
      return;
    }

    if (toIndex < 0) {
      setDraggedCategoryId(null);
      return;
    }

    const nextIds = [...currentIds];
    const [moved] = nextIds.splice(fromIndex, 1);
    nextIds.splice(toIndex, 0, moved);

    reorderCategoriesMutation.mutate({
      type,
      categoryGroupId,
      orderedCategoryIds: nextIds,
    });
    setDraggedCategoryId(null);
  };

  const handleCategoryGroupDrop = (
    type: CategoryType,
    categoryGroupId: string | null,
  ) => {
    if (!draggedCategoryId) return;

    const category = categories.find((item) => item.id === draggedCategoryId);
    if (!category) {
      setDraggedCategoryId(null);
      return;
    }

    if (category.type !== type) {
      toast.error(
        'No se puede mover la categoría',
        'El grupo destino no coincide con el tipo de la categoría.',
      );
      setDraggedCategoryId(null);
      return;
    }

    if ((category.categoryGroupId || null) === categoryGroupId) {
      setDraggedCategoryId(null);
      return;
    }

    moveCategoryMutation.mutate({ category, categoryGroupId });
    setDraggedCategoryId(null);
  };

  // --- RENDER HELPERS ---
  const renderGroupTree = (type: CategoryType) => {
    const typeGroups = groups.filter((g) => g.type === type);
    const orphanCategories = categories.filter((c) => c.type === type && !c.categoryGroupId);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${type === 'expense' ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)]'}`}>
            {type === 'expense' ? 'Gastos' : 'Ingresos'}
          </h3>
          <button 
            onClick={() => openNewGroupModal(type)}
            className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Plus size={16} /> Añadir Grupo
          </button>
        </div>

        {typeGroups.map((grp) => {
          const isExpanded = expandedGroups.includes(grp.id);
          const grpCategories = categories.filter((c) => c.categoryGroupId === grp.id);

          return (
            <div
              key={grp.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleCategoryGroupDrop(type, grp.id)}
              className="border border-[var(--color-element-border)] rounded-xl overflow-hidden bg-[var(--color-element-bg)]"
            >
              {/* Group Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-element-bg)] transition-colors group gap-4"
                onClick={() => toggleGroup(grp.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-[var(--color-text-secondary)] shrink-0">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div className="w-8 h-8 rounded bg-[var(--color-element-bg)] flex items-center justify-center text-lg shrink-0">
                    {grp.icon}
                  </div>
                  <span className="font-semibold text-[var(--color-text-primary)] truncate" title={grp.name}>{grp.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-element-bg)] px-2 py-0.5 rounded-full shrink-0">
                    {grpCategories.length} items
                  </span>
                </div>
                <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEditGroup(grp)} aria-label="Editar grupo" title="Editar" className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteGroup(grp.id)} aria-label="Eliminar grupo" title="Eliminar" className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Group Body (Categories) */}
              {isExpanded && (
                <div className="p-4 pt-0 pl-14 border-t border-[var(--color-element-border)] space-y-2">
                  {grpCategories.length > 0 ? (
                    grpCategories.map((cat) => (
                      <div
                        key={cat.id}
                        draggable
                        onDragStart={() => setDraggedCategoryId(cat.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleCategoryDrop(type, grp.id, cat.id, grpCategories);
                        }}
                        className="flex items-center justify-between p-3 bg-[var(--color-element-bg)] rounded-lg group/cat hover:bg-[var(--color-element-bg-hover)] transition-colors gap-4 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <GripVertical size={16} className="text-[var(--color-text-muted)] shrink-0" />
                          <span className="text-xl shrink-0">{cat.icon}</span>
                          <span className="font-medium text-[var(--color-text-primary)] truncate" title={cat.name}>{cat.name}</span>
                        </div>
                        <div className="flex items-center opacity-100 md:opacity-0 md:group-hover/cat:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEditCategory(cat)} aria-label="Editar categoria" title="Editar" className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} aria-label="Eliminar categoria" title="Eliminar" className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)] italic py-2">No hay categorías en este grupo.</p>
                  )}
                  <button 
                    onClick={() => openNewCategoryModal(type, grp.id)}
                    className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mt-2 px-3 py-2"
                  >
                    <Plus size={14} /> Añadir Categoría
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Orphan Categories */}
        {(orphanCategories.length > 0 || draggedCategoryId) && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleCategoryGroupDrop(type, null)}
            className="border border-[var(--color-element-border)] rounded-xl overflow-hidden bg-[var(--color-element-bg)] mt-6"
          >
            <div className="p-4 bg-[var(--color-element-bg)] border-b border-[var(--color-element-border)] flex items-center gap-2 text-[var(--color-text-secondary)] font-medium text-sm">
              <FolderOpen size={16} /> Categorías Sin Grupo
            </div>
            <div className="p-4 space-y-2">
              {orphanCategories.map((cat) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDraggedCategoryId(cat.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleCategoryDrop(type, null, cat.id, orphanCategories);
                  }}
                  className="flex items-center justify-between p-3 bg-[var(--color-element-bg)] rounded-lg group/cat hover:bg-[var(--color-element-bg-hover)] transition-colors gap-4 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical size={16} className="text-[var(--color-text-muted)] shrink-0" />
                    <span className="text-xl shrink-0">{cat.icon}</span>
                    <span className="font-medium text-[var(--color-text-primary)] truncate" title={cat.name}>{cat.name}</span>
                  </div>
                  <div className="flex items-center opacity-100 md:opacity-0 md:group-hover/cat:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEditCategory(cat)} aria-label="Editar categoria" title="Editar" className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} aria-label="Eliminar categoria" title="Eliminar" className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => openNewCategoryModal(type, '')}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mt-2 px-3 py-2"
              >
                <Plus size={14} /> Añadir Categoría Libre
              </button>
            </div>
          </div>
        )}
        
        {orphanCategories.length === 0 && typeGroups.length === 0 && (
          <div className="text-center py-8">
            <button onClick={() => openNewGroupModal(type)} className="btn-secondary mx-auto">
              Crear tu primer grupo
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Personaliza tu experiencia y clasifica tus movimientos.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <button
            onClick={() => setActiveTab('classification')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'classification' 
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' 
                : 'hover:bg-[var(--color-element-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Tags size={18} /> Clasificación
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'profile' 
                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' 
                : 'hover:bg-[var(--color-element-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <User size={18} /> Mi Perfil
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'classification' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-8">Grupos y Categorías</h2>
              
              {loadingCategories || loadingGroups ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-[var(--color-element-bg)] rounded-xl w-full"></div>
                  <div className="h-16 bg-[var(--color-element-bg)] rounded-xl w-full"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* Gastos Column */}
                  <div>
                    {renderGroupTree('expense')}
                  </div>
                  {/* Ingresos Column */}
                  <div>
                    {renderGroupTree('income')}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Información Personal</h2>
              
              <div className="space-y-6 max-w-lg">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{user?.name}</h3>
                    <p className="text-[var(--color-text-secondary)]">{user?.email}</p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl flex gap-3 text-sm">
                  <AlertCircle size={20} className="shrink-0" />
                  <p>Por motivos de seguridad, la actualización de perfil y contraseña se encuentra deshabilitada en esta versión de demostración.</p>
                </div>

                <div className="space-y-2 opacity-50 pointer-events-none">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Nombre completo</label>
                  <input type="text" value={user?.name || ''} className="input-field" readOnly />
                </div>

                <div className="space-y-2 opacity-50 pointer-events-none">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Zona Horaria</label>
                  <input type="text" value={user?.timezone || 'America/Lima'} className="input-field" readOnly />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[var(--color-element-border)]">
            <h2 className="text-xl font-bold mb-4">{editingCategoryId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Grupo Padre
                </label>
                <select
                  value={catGroupId}
                  onChange={(e) => setCatGroupId(e.target.value)}
                  className="input-field appearance-none bg-[var(--color-surface)]"
                >
                  <option value="">-- Ninguno (Categoría Libre) --</option>
                  {groups?.filter((g) => g.type === catType).map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.icon} {grp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="w-20 space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Ícono</label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="input-field text-center text-xl"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Nombre</label>
                  <input
                    type="text"
                    placeholder="Ej. Salario, Netflix..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeCategoryModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} className="btn-primary flex-1">
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[var(--color-element-border)]">
            <h2 className="text-xl font-bold mb-4">{editingGroupId ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              
              <div className="flex gap-4">
                <div className="w-20 space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Ícono</label>
                  <input
                    type="text"
                    value={groupIcon}
                    onChange={(e) => setGroupIcon(e.target.value)}
                    className="input-field text-center text-xl"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">Nombre del Grupo</label>
                  <input
                    type="text"
                    placeholder="Ej. Transporte, Hogar..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeGroupModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={createGroupMutation.isPending || updateGroupMutation.isPending} className="btn-primary flex-1">
                  {createGroupMutation.isPending || updateGroupMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
