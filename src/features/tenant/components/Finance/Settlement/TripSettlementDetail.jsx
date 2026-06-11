import React from 'react'
import { useParams } from 'react-router-dom'

import { useFinalizeTripSettlement, useTripSettlement } from '../../../queries/finance/financeQuery'

export default function TripSettlementDetail() {
  const { tripId } = useParams()
  const { data, isLoading } = useTripSettlement(tripId)
  const finalizeMutation = useFinalizeTripSettlement()

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading settlement...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h1 className="text-xl font-bold text-[#172B4D]">Trip Settlement</h1>
        <p className="text-xs text-gray-500">Trip: {tripId}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <p><span className="text-gray-500">Revenue:</span> {data?.revenue_total || '-'}</p>
          <p><span className="text-gray-500">Expenses:</span> {data?.expense_total || '-'}</p>
          <p><span className="text-gray-500">Advance:</span> {data?.advance_total || '-'}</p>
          <p><span className="text-gray-500">TDS:</span> {data?.tds_total || '-'}</p>
          <p><span className="text-gray-500">Owner Pay:</span> {data?.owner_payment_total || '-'}</p>
          <p><span className="text-gray-500">Net Profit:</span> {data?.net_profit || '-'}</p>
        </div>
        <button
          type="button"
          onClick={() => finalizeMutation.mutate(tripId)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0052CC] text-white hover:opacity-90"
        >
          Finalize Settlement
        </button>
      </div>
    </div>
  )
}

