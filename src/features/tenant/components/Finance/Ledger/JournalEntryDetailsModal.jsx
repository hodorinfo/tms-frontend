import React from 'react'
import { X, FileText } from 'lucide-react'
import { useJournalEntryDetail } from '../../../queries/finance/financeQuery'
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

export default function JournalEntryDetailsModal({ journalId, onClose }) {
  const { data: entry, isLoading } = useJournalEntryDetail(journalId)

  if (!journalId) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Journal Entry Details</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Reference: {entry?.reference_type || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium text-sm">Loading entry details...</p>
            </div>
          ) : !entry ? (
            <div className="py-20 text-center text-gray-500 font-medium">Entry not found.</div>
          ) : (
            <div className="space-y-6">
              {/* Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {entry.entry_date ? formatDate(entry.entry_date) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trip ID</p>
                  <p className="text-sm font-bold text-gray-900">{entry.trip_id || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Memo</p>
                  <p className="text-sm font-bold text-gray-900">{entry.memo || '-'}</p>
                </div>
              </div>

              {/* Lines Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Account</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Memo</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right w-32">Debit (₹)</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right w-32">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entry.lines && entry.lines.length > 0 ? (
                      entry.lines.map((line) => {
                        const dr = parseFloat(line.debit || 0)
                        const cr = parseFloat(line.credit || 0)
                        return (
                          <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-bold text-blue-700">{line.account_name || `Account #${line.account}`}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{line.memo || '-'}</td>
                            <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">
                              {dr > 0 ? dr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-rose-600 text-right">
                              {cr > 0 ? cr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-400 italic">
                          No line items found for this entry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
