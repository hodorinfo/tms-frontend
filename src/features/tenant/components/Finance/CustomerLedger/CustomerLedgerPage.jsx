import React, { useMemo, useState } from 'react'

import { useCustomerLedger } from '../../../queries/finance/financeQuery'
import { useCustomers } from '../../../queries/customers/customersQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function CustomerLedgerPage() {
  const [customerId, setCustomerId] = useState('')
  const { data: customersData } = useCustomers({ page_size: 500 })
  const customers = asList(customersData)
  const { data: ledger, isLoading } = useCustomerLedger(customerId)

  const customerLabel = useMemo(() => {
    const match = customers.find((c) => String(c.id) === String(customerId))
    return match?.legal_name || match?.company_name || match?.name || customerId
  }, [customers, customerId])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Customer Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Running balance per customer across invoices, advances, payments, and credit notes.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</label>
          <select
            className="mt-2 w-full max-w-xl border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.legal_name || c.company_name || c.name || c.id}</option>
            ))}
          </select>
        </div>

        {!customerId ? (
          <p className="text-sm text-gray-500">Select a customer to view ledger entries.</p>
        ) : isLoading ? (
          <p className="text-sm text-gray-500">Loading ledger...</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-[#172B4D]">{customerLabel}</p>
              <p className="text-sm font-bold text-[#0052CC]">Outstanding: ₹ {money(ledger?.outstanding_balance)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Reference</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-right px-4 py-3">Debit</th>
                    <th className="text-right px-4 py-3">Credit</th>
                    <th className="text-right px-4 py-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(ledger?.entries || []).map((row, idx) => (
                    <tr key={`${row.reference}-${idx}`} className="border-t border-gray-50">
                      <td className="px-4 py-3">{row.date || '-'}</td>
                      <td className="px-4 py-3">{row.reference}</td>
                      <td className="px-4 py-3">{row.type}</td>
                      <td className="px-4 py-3 text-right">{money(row.debit)}</td>
                      <td className="px-4 py-3 text-right">{money(row.credit)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{money(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
