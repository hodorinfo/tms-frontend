import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import { settlementApi } from '../../../api/finance/financeEndpoint'

export default function DriverSettlementDetail() {
  const { driverId } = useParams()
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(false)

  const finalize = async () => {
    setLoading(true)
    try {
      const data = await settlementApi.finalizeDriver(driverId, { period_start: periodStart, period_end: periodEnd })
      setPayload(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h1 className="text-xl font-bold text-[#172B4D]">Driver Settlement</h1>
        <p className="text-xs text-gray-500">Driver: {driverId}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="border border-gray-200 rounded-lg p-2 text-sm" />
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="border border-gray-200 rounded-lg p-2 text-sm" />
        </div>
        <button type="button" onClick={finalize} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0052CC] text-white">
          {loading ? 'Finalizing...' : 'Finalize Driver Settlement'}
        </button>
        {payload && <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto">{JSON.stringify(payload, null, 2)}</pre>}
      </div>
    </div>
  )
}

