import React from 'react'
import { useNavigate } from 'react-router-dom'

import { useExpenses } from '../../../queries/finance/financeQuery'

const rowsFrom = (payload) => (Array.isArray(payload) ? payload : payload?.results || [])

export default function ExpensesDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useExpenses({ ordering: '-expense_date' })
  const rows = rowsFrom(data)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-xl font-bold text-[#172B4D]">Expenses</h1>
          <p className="text-xs text-gray-500">Trip and vehicle expense approvals</p>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading expenses...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/40">
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Expense #</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/20 cursor-pointer" onClick={() => navigate(`/tenant/dashboard/finance/expenses/${row.id}`)}>
                    <td className="px-4 py-3 text-[12px] font-semibold text-[#172B4D]">{row.expense_number}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-700">{row.expense_type}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">{row.trip_id || '-'}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">{row.vehicle_id || '-'}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-right text-gray-700">{row.amount} {row.currency}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-gray-700">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

