import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJournalEntries } from '../../../queries/finance/financeQuery'
import { Calendar, Download, RefreshCw, ChevronLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

export default function AccountStatement({ account, onBack }) {
  const [dateRange, setDateRange] = useState('all') // 'all', 'this_month', 'last_month'
  // Fetching all entries. Ideally, backend should have a /accounts/:id/statement API
  const { data: jeData, isLoading } = useJournalEntries({ limit: 500 }) 
  const journals = useMemo(() => (jeData?.results || (Array.isArray(jeData) ? jeData : [])), [jeData])

  // Extract lines related to this account and calculate running balance
  const statementLines = useMemo(() => {
    if (!account || !journals) return []
    let balance = 0 // Assume 0 opening balance for now
    const lines = []
    
    // Sort journals by date ascending
    const sortedJournals = [...journals].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))

    sortedJournals.forEach(entry => {
      // Mocking lines extraction if backend doesn't provide them in list API
      const entryLines = entry.lines || [] 
      const accountLines = entryLines.filter(l => l.account_id === account.id || l.account === account.id)
      
      accountLines.forEach(line => {
        const debit = parseFloat(line.debit || 0)
        const credit = parseFloat(line.credit || 0)
        // Debit increases balance for Assets/Expenses, Credit increases for Liabilities/Equity/Revenue. 
        // For simplicity, running balance = credit - debit (or vice versa based on account type)
        // Let's just do standard: Dr is positive, Cr is negative for visual balance, or absolute with Dr/Cr tag
        balance += (debit - credit)
        
        lines.push({
          id: entry.id + '-' + line.id,
          date: entry.entry_date,
          reference: entry.reference_type || 'JE',
          memo: line.memo || entry.memo,
          debit,
          credit,
          balance,
          balanceType: balance >= 0 ? 'Dr' : 'Cr'
        })
      })
    })
    
    // Reverse to show latest first if needed, but statement is usually chronological
    return lines
  }, [account, journals])

  const totalDebit = statementLines.reduce((sum, l) => sum + l.debit, 0)
  const totalCredit = statementLines.reduce((sum, l) => sum + l.credit, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#172B4D]">{account.name}</h2>
            <p className="text-sm text-gray-500 font-medium">Account Code: {account.code} • {account.account_type}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setDateRange('all')}>All Time</button>
            <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${dateRange === 'this_month' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => setDateRange('this_month')}>This Month</button>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowDownLeft size={48} />
          </div>
          <p className="text-sm font-bold text-gray-500 mb-1">Total Debit (In)</p>
          <h3 className="text-3xl font-black text-emerald-600">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowUpRight size={48} />
          </div>
          <p className="text-sm font-bold text-gray-500 mb-1">Total Credit (Out)</p>
          <h3 className="text-3xl font-black text-rose-600">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-2xl p-6 border border-blue-800 shadow-lg text-white">
          <p className="text-sm font-medium text-blue-200 mb-1">Closing Balance</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black">₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <span className="text-sm font-bold px-2 py-0.5 rounded bg-white/20">{(totalDebit - totalCredit) >= 0 ? 'Dr' : 'Cr'}</span>
          </div>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reference / Memo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Debit (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Credit (₹)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                 <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading statement...</td></tr>
              ) : statementLines.length === 0 ? (
                 <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <Calendar className="text-gray-400" size={24} />
                       </div>
                       <h3 className="text-lg font-bold text-gray-900 mb-1">No Transactions Found</h3>
                       <p className="text-sm text-gray-500">There are no journal entries currently linked to this account.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                statementLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatDateShort(line.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{line.reference}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{line.memo || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600 text-right">
                      {line.debit > 0 ? line.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-rose-600 text-right">
                      {line.credit > 0 ? line.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      {Math.abs(line.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      <span className={`ml-1.5 text-[10px] uppercase font-black ${line.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {line.balanceType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
