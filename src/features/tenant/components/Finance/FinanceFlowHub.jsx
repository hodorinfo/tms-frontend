import React from 'react'
import { Link } from 'react-router-dom'

const PRIMARY_MODULES = [
  { key: 'trips', title: 'Trips & LR Finance', desc: 'Trip list with LR, expenses, invoices, and settlement drilldown', to: '/tenant/dashboard/finance/trips', status: 'live' },
  { key: 'billing', title: 'Customer Billing', desc: 'Per-customer invoices, payments, reconciliations, and ledger', to: '/tenant/dashboard/finance/billing', status: 'live' },
  { key: 'drivers', title: 'Driver Finance', desc: 'Payroll entries, advances, and driver settlement', to: '/tenant/dashboard/finance/drivers', status: 'live' },
  { key: 'vehicles', title: 'Vehicle Costs', desc: 'Operating expenses grouped by vehicle', to: '/tenant/dashboard/finance/vehicle-costs', status: 'live' },
]

const COMPLIANCE_MODULES = [
  { key: 'tds', title: 'TDS Management', desc: 'TDS entries, certificates, and quarterly returns', to: '/tenant/dashboard/finance/tds', status: 'live' },
  { key: 'ledger', title: 'Ledger', desc: 'Chart of accounts and journal entries', to: '/tenant/dashboard/finance/ledger', status: 'live' },
  { key: 'periods', title: 'Finance Periods', desc: 'Open/close accounting periods', to: '/tenant/dashboard/finance/periods', status: 'live' },
  { key: 'reports', title: 'Reports', desc: 'AR, profitability, payroll, and TDS registers', to: '/tenant/dashboard/finance/reports', status: 'live' },
]

const statusStyle = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
}

const statusLabel = {
  live: 'Live',
  'in-progress': 'In progress',
}

function ModuleGrid({ items }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((step) => (
        <Link key={step.key} to={step.to} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#0052CC] transition-colors">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-[#172B4D]">{step.title}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[step.status] || statusStyle.live}`}>
              {statusLabel[step.status] || statusLabel.live}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{step.desc}</p>
        </Link>
      ))}
    </div>
  )
}

export default function FinanceFlowHub() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h1 className="text-2xl font-bold text-[#172B4D]">Finance Modules</h1>
          <p className="text-sm text-gray-500 mt-1">Entity-first navigation: trips, customers, drivers, and vehicles.</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Operations</h2>
          <ModuleGrid items={PRIMARY_MODULES} />
        </div>
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Compliance & analytics</h2>
          <ModuleGrid items={COMPLIANCE_MODULES} />
        </div>
      </div>
    </div>
  )
}
