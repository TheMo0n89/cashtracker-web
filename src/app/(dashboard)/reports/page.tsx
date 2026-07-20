'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type MovementType = 'all' | 'income' | 'expense';

type ReportTransaction = {
  id: string;
  categoryId?: string | null;
  type: 'income' | 'expense';
  amount: string | number;
  date: string;
  description?: string | null;
  invoiceNumber?: string | null;
  category?: {
    name?: string | null;
    categoryGroup?: {
      name?: string | null;
    } | null;
  } | null;
};

type ReportCategory = {
  id: string;
  name?: string | null;
  categoryGroup?: {
    name?: string | null;
  } | null;
};

type ExpenseGroup = {
  name: string;
  transactions: ReportTransaction[];
  total: number;
};

const MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

async function fetchTransactionsForReport(
  startDate: string,
  endDate: string,
  type: MovementType,
) {
  const perPage = 100;
  let page = 1;
  let lastPage = 1;
  const transactions: ReportTransaction[] = [];

  do {
    const params = new URLSearchParams({
      dateFrom: startDate,
      dateTo: endDate,
      page: String(page),
      perPage: String(perPage),
    });

    if (type !== 'all') {
      params.set('type', type);
    }

    const { data } = await api.get(`/transactions?${params.toString()}`);
    transactions.push(...(data.data || []));
    lastPage = data.meta?.lastPage || 1;
    page += 1;
  } while (page <= lastPage);

  return transactions;
}

async function fetchCategoriesForReport() {
  const { data } = await api.get('/categories?type=expense');
  return (data.data || data || []) as ReportCategory[];
}

function hydrateTransactionCategoryGroups(
  transactions: ReportTransaction[],
  categories: ReportCategory[],
) {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return transactions.map((transaction) => {
    const categoryFromCatalog = transaction.categoryId
      ? categoriesById.get(transaction.categoryId)
      : undefined;

    if (!categoryFromCatalog) return transaction;

    return {
      ...transaction,
      category: {
        ...transaction.category,
        name: transaction.category?.name || categoryFromCatalog.name,
        categoryGroup:
          transaction.category?.categoryGroup ||
          categoryFromCatalog.categoryGroup ||
          null,
      },
    };
  });
}

function parseAmount(amount: string | number) {
  return typeof amount === 'string' ? Number(amount) : amount;
}

function formatPen(amount: number) {
  return `S/.${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDateForPdf(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function getPeriodLabel(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
) {
  if (startYear === endYear && startMonth === endMonth) {
    return `${MONTHS[startMonth - 1]} - ${startYear}`;
  }

  return `${MONTHS[startMonth - 1]} ${startYear} A ${MONTHS[endMonth - 1]} ${endYear}`;
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function groupExpensesByCategoryGroup(transactions: ReportTransaction[]) {
  const groups = new Map<string, ExpenseGroup>();

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((transaction) => {
      const groupName =
        transaction.category?.categoryGroup?.name ||
        'SIN GRUPO';
      const current = groups.get(groupName) || {
        name: groupName,
        transactions: [],
        total: 0,
      };

      current.transactions.push(transaction);
      current.total += parseAmount(transaction.amount);
      groups.set(groupName, current);
    });

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function buildExpenseReportPdf(
  transactions: ReportTransaction[],
  startDate: string,
  endDate: string,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
) {
  const groups = groupExpensesByCategoryGroup(transactions);
  const totalExpense = groups.reduce((sum, group) => sum + group.total, 0);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const navy: [number, number, number] = [8, 61, 101];

  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await imageToDataUrl('/logo-andes.png');
  } catch {
    logoDataUrl = null;
  }

  const drawHeader = () => {
    doc.setFillColor(...navy);
    doc.rect(margin, 6, pageWidth - margin * 2, 33, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CONTROL  DE  GASTOS', margin + 8, 20);

    doc.setFontSize(18);
    doc.text(`---------------${getPeriodLabel(startYear, startMonth, endYear, endMonth)}---------------`, pageWidth / 2, 32, {
      align: 'center',
    });

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', pageWidth - 78, 8, 60, 28);
    }

    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);

    doc.setFillColor(...navy);
    doc.rect(margin, 45, 40, 7, 'FD');
    doc.rect(margin + 44, 45, pageWidth - margin * 2 - 44, 7, 'FD');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('TOTAL GASTADO', margin + 20, 50, { align: 'center' });
    doc.text('PERIODO', pageWidth / 2 + 20, 50, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.rect(margin, 52, 40, 12);
    doc.rect(margin + 44, 52, pageWidth - margin * 2 - 44, 12);
    doc.text(formatPen(totalExpense), margin + 38, 60, { align: 'right' });
    doc.text(`DE:  ${formatDateForPdf(startDate)}`, margin + 68, 60);
    doc.text(`AL:  ${formatDateForPdf(endDate)}`, pageWidth - 110, 60);
  };

  drawHeader();

  const body: any[] = [];
  groups.forEach((group) => {
    group.transactions.forEach((transaction, index) => {
      const row: any[] = [
        index === 0
          ? {
              content: group.name.toUpperCase(),
              rowSpan: group.transactions.length,
              styles: {
                fontStyle: 'bold',
                valign: 'middle',
                halign: 'center',
                fillColor: [236, 242, 247],
              },
            }
          : undefined,
        formatDateForPdf(transaction.date),
        transaction.invoiceNumber || '-',
        transaction.description || 'Sin descripcion',
        {
          content: formatPen(parseAmount(transaction.amount)),
          styles: { halign: 'right' },
        },
        index === 0
          ? {
              content: formatPen(group.total),
              rowSpan: group.transactions.length,
              styles: {
                fontStyle: 'bold',
                valign: 'middle',
                halign: 'right',
                fillColor: [236, 242, 247],
              },
            }
          : undefined,
      ].filter((cell) => cell !== undefined);

      body.push(row);
    });
  });

  autoTable(doc, {
    startY: 70,
    head: [['TIPO DE GASTO', 'FECHA', 'FACTURA', 'CONCEPTO', 'MONTO', 'TOTAL']],
    body,
    theme: 'grid',
    margin: { left: margin, right: margin, top: 70, bottom: 14 },
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    bodyStyles: {
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      valign: 'middle',
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 34, halign: 'center' },
      3: { cellWidth: 120 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader();
      }

      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(`Pagina ${data.pageNumber}`, pageWidth - margin, pageHeight - 6, {
        align: 'right',
      });
    },
  });

  return doc;
}

export default function ReportsPage() {
  const now = new Date();
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [endYear, setEndYear] = useState(now.getFullYear());
  const [endMonth, setEndMonth] = useState(now.getMonth() + 1);
  const [type, setType] = useState<MovementType>('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['report_summary', startYear, startMonth, endYear, endMonth, type],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/report-summary?startYear=${startYear}&startMonth=${startMonth}&endYear=${endYear}&endMonth=${endMonth}&type=${type}`);
      return data.data || data;
    },
  });

  const getReportDates = () => {
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    const endDate = new Date(endYear, endMonth, 0).toISOString().slice(0, 10);
    return { startDate, endDate };
  };

  const createExpenseReportDoc = async () => {
    const { startDate, endDate } = getReportDates();
    const [transactions, categories] = await Promise.all([
      fetchTransactionsForReport(startDate, endDate, 'expense'),
      fetchCategoriesForReport(),
    ]);
    const hydratedTransactions = hydrateTransactionCategoryGroups(
      transactions,
      categories,
    );

    if (hydratedTransactions.length === 0) {
      alert('No hay gastos en este periodo para exportar.');
      return null;
    }

    return buildExpenseReportPdf(
      hydratedTransactions,
      startDate,
      endDate,
      startYear,
      startMonth,
      endYear,
      endMonth,
    );
  };

  const handlePreviewPDF = async () => {
    try {
      const doc = await createExpenseReportDoc();
      if (!doc) return;

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(doc.output('blob'));
      setPreviewUrl(url);
    } catch (e) {
      console.error(e);
      alert('Error al previsualizar el PDF. Verifica tu conexion.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = await createExpenseReportDoc();
      if (!doc) return;

      const filePeriod =
        startYear === endYear && startMonth === endMonth
          ? `${startYear}-${String(startMonth).padStart(2, '0')}`
          : `${startYear}-${String(startMonth).padStart(2, '0')}_${endYear}-${String(endMonth).padStart(2, '0')}`;

      doc.save(`control_gastos_${filePeriod}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al generar el PDF. Verifica tu conexion.');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const { startDate, endDate } = getReportDates();
      const transactions = await fetchTransactionsForReport(startDate, endDate, type);
      
      if (transactions.length === 0) {
        alert('No hay transacciones en este periodo para exportar.');
        return;
      }
      
      const headers = ['ID', 'Fecha', 'Tipo', 'Monto', 'Categoria', 'Descripcion'];
      const rows = transactions.map((t: ReportTransaction) => [
        t.id,
        formatDateForPdf(t.date),
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.amount,
        t.category?.name || 'General',
        `"${(t.description || '').replace(/"/g, '""')}"`,
      ]);
      
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_cashtracker_${startYear}-${startMonth}_${endYear}-${endMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Error al generar el CSV. Verifica tu conexion.');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const previewFrameSrc = previewUrl
    ? `${previewUrl}#page=1&zoom=page-width&view=FitH&toolbar=1&navpanes=0&scrollbar=1`
    : '';

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Exportacion</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Analiza tus finanzas y exporta tus datos para uso externo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Filtros */}
        <div className="glass rounded-2xl p-6 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-6 text-[var(--color-primary)]">
            <Filter size={20} />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filtros del Reporte</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                <Calendar size={14} /> Desde
              </label>
              <div className="flex gap-2">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                  className="input-field flex-1"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      {new Date(0, i).toLocaleString('es', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="input-field w-24"
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                <Calendar size={14} /> Hasta
              </label>
              <div className="flex gap-2">
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                  className="input-field flex-1"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      {new Date(0, i).toLocaleString('es', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="input-field w-24"
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Tipo de Movimientos</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MovementType)}
                className="input-field"
              >
                <option value="all">Todos los movimientos</option>
                <option value="income">Solo Ingresos</option>
                <option value="expense">Solo Gastos</option>
              </select>
              <p className="text-xs text-[var(--color-text-muted)]">
                El PDF de Control de Gastos exporta solo gastos agrupados por grupo de categoria.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen & Exportacion */}
        <div className="glass rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold mb-6">Previsualizacion del Periodo</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[var(--color-element-bg)] border border-[var(--color-element-border)] p-4 rounded-xl">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Total Ingresos</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">
                {isLoading ? '...' : formatCurrency(type === 'expense' ? 0 : summary?.totalIncome || 0)}
              </p>
            </div>
            <div className="bg-[var(--color-element-bg)] border border-[var(--color-element-border)] p-4 rounded-xl">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Total Gastos</p>
              <p className="text-2xl font-bold text-[var(--color-danger)]">
                {isLoading ? '...' : formatCurrency(type === 'income' ? 0 : summary?.totalExpense || 0)}
              </p>
            </div>
            <div className="bg-[var(--color-element-bg)] border border-[var(--color-element-border)] p-4 rounded-xl">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Balance Neto</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {isLoading ? '...' : formatCurrency(type === 'all' ? summary?.balance || 0 : type === 'income' ? summary?.totalIncome || 0 : -(summary?.totalExpense || 0))}
              </p>
            </div>
          </div>

          <div className="flex-1 bg-[var(--color-element-bg)] rounded-xl border border-[var(--color-element-border)] flex flex-col items-center justify-center p-8 text-center mb-8">
            <FileText size={48} className="text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">
              El PDF generara un Control de Gastos con banner institucional, periodo, total gastado y movimientos agrupados por grupo de categoria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handlePreviewPDF}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-[var(--color-element-border)] hover:bg-[var(--color-element-bg)] text-[var(--color-text-primary)] font-medium transition-colors disabled:opacity-50"
            >
              <Eye size={20} />
              Previsualizar PDF
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Download size={20} />
              Descargar PDF
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-[var(--color-element-border)] hover:bg-[var(--color-element-bg)] text-[var(--color-text-primary)] font-medium transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet size={20} />
              Exportar CSV
            </button>
          </div>
        </div>

      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-sm p-3 sm:p-5">
          <div
            className="glass mx-auto flex w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-[var(--color-element-border)] shadow-2xl"
            style={{ height: 'calc(100dvh - 40px)' }}
          >
            <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-[var(--color-element-border)]">
              <h3 className="font-semibold">Previsualizacion del Control de Gastos</h3>
              <button
                type="button"
                onClick={closePreview}
                className="p-2 rounded-lg hover:bg-[var(--color-element-bg-hover)] text-[var(--color-text-secondary)]"
                aria-label="Cerrar previsualizacion"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-neutral-900 p-2 sm:p-4">
              <iframe
                src={previewFrameSrc}
                title="Previsualizacion PDF"
                className="h-full min-h-0 w-full rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
