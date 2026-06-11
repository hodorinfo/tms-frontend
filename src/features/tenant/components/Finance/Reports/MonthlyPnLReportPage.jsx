import React, { useMemo, useState } from 'react'

import { useMonthlyPnLReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { money } from './FinanceReportShell'

const now = new Date()

export default function MonthlyPnLReportPage() {
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const { data, isLoading, refetch } = useMonthlyPnLReport({ year, month })

  const cards = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Revenue', value: data.revenue, color: 'text-indigo-600' },
      { label: 'Operating Expenses', value: data.expenses, color: 'text-red-600' },
      { label: 'Payroll', value: data.payroll, color: 'text-amber-600' },
      { label: 'Owner Payments', value: data.owner_payments, color: 'text-orange-600' },
      { label: 'Net Profit', value: data.net_profit, color: Number(data.net_profit) >= 0 ? 'text-green-600' : 'text-red-700' },
    ]
  }, [data])

  return (
    <FinanceReportShell
      isLoading={isLoading}
      onRefresh={refetch}
      filters={(
        <>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{new Date(2000, i, 1).toLocaleString('en-GB', { month: 'long' })}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-24 font-semibold" />
        </>
      )}
    >
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading P&L...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {cards.map((card) => (
            <div key={card.label} className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
              <p className={`text-2xl font-black mt-2 ${card.color}`}>₹ {money(card.value)}</p>
            </div>
          ))}
        </div>
      )}
    </FinanceReportShell>
  )
}
