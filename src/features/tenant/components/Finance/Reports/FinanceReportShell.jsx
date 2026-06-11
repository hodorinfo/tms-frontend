import React from 'react'
import { Download, RefreshCcw } from 'lucide-react'

export const money = (value) => {
  const n = Number(value || 0)
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function FinanceReportShell({
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  isLoading,
  onRefresh,
  onExport,
  filters,
  children,
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/30 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {onSearch !== undefined && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs w-64 outline-none focus:ring-2 focus:ring-blue-100"
              value={search || ''}
              onChange={(e) => onSearch(e.target.value)}
            />
          )}
          {filters}
          {onRefresh && (
            <button type="button" onClick={onRefresh} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
              <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  )
}

export function ReportTable({ columns, rows, emptyMessage = 'No records found' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, idx) => (
            <tr key={row.id || row.key || idx} className="hover:bg-blue-50/20 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-[13px] ${col.align === 'right' ? 'text-right font-black text-[#172B4D]' : ''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 text-xs">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function exportCsv(filename, headers, rows) {
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}
