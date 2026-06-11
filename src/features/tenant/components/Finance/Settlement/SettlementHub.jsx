import React from 'react'
import { Link } from 'react-router-dom'

export default function SettlementHub() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h1 className="text-xl font-bold text-[#172B4D]">Settlement</h1>
        <p className="text-sm text-gray-500">
          Settlement is now available from entity drilldowns. Open a trip or driver from the modules below.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/tenant/dashboard/finance/trips"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0052CC] text-white hover:opacity-90"
          >
            Trips & LR Finance
          </Link>
          <Link
            to="/tenant/dashboard/finance/drivers"
            className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Driver Finance
          </Link>
        </div>
      </div>
    </div>
  )
}
