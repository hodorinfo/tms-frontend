import React from 'react'
import { Banknote, BarChart2, GitMerge, Receipt, Shield, TrendingUp, Truck, Users, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useFinanceDashboard } from '../../queries/finance/financeQuery'
import { moneyINR } from './Common/financeUtils'

const KPI_CONFIG = [
  { key: 'todays_revenue', label: "Today's Revenue", icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', to: '/tenant/dashboard/finance/billing' },
  { key: 'outstanding_receivables', label: 'Outstanding Receivables', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50', to: '/tenant/dashboard/finance/billing' },
  { key: 'driver_advances_outstanding', label: 'Driver Advances Outstanding', icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50', to: '/tenant/dashboard/finance/drivers' },
  { key: 'monthly_trip_profit', label: 'Monthly Trip P&L', icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50', to: '/tenant/dashboard/finance/trips' },
  { key: 'tds_due_current_quarter', label: 'TDS Due (Quarter)', icon: Shield, color: 'text-teal-600', bg: 'bg-teal-50', to: '/tenant/dashboard/finance/tds' },
  { key: 'overdue_invoices_count', label: 'Overdue Invoices', icon: GitMerge, color: 'text-red-600', bg: 'bg-red-50', to: '/tenant/dashboard/finance/billing', isCount: true },
  { key: 'unreconciled_payments_count', label: 'Unreconciled Payments', icon: Banknote, color: 'text-orange-600', bg: 'bg-orange-50', to: '/tenant/dashboard/finance/billing', isCount: true },
]

const SHORTCUTS = [
  { title: 'Trips & LR Finance', desc: 'Trip revenue, expenses, invoices, settlement', to: '/tenant/dashboard/finance/trips', icon: GitMerge },
  { title: 'Customer Billing', desc: 'Invoices, payments, reconciliations per customer', to: '/tenant/dashboard/finance/billing', icon: Receipt },
  { title: 'Driver Finance', desc: 'Payroll and advances per driver', to: '/tenant/dashboard/finance/drivers', icon: Users },
  { title: 'Vehicle Costs', desc: 'Fuel and maintenance by vehicle', to: '/tenant/dashboard/finance/vehicle-costs', icon: Truck },
  { title: 'TDS Management', desc: 'Compliance entries and returns', to: '/tenant/dashboard/finance/tds', icon: Shield },
  { title: 'Ledger', desc: 'Chart of accounts and journals', to: '/tenant/dashboard/finance/ledger', icon: BarChart2 },
  { title: 'Reports', desc: 'AR, profitability, payroll registers', to: '/tenant/dashboard/finance/reports', icon: BarChart2 },
  { title: 'Finance Periods', desc: 'Open and close accounting periods', to: '/tenant/dashboard/finance/periods', icon: BarChart2 },
]

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useFinanceDashboard()

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Finance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Entity-first finance: start from trips, customers, drivers, or vehicles.</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        ) : (
          <>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">This month</p>
              <div className="flex flex-wrap gap-6 text-sm font-bold text-[#172B4D]">
                <span>Revenue: <span className="text-green-600">{moneyINR(data?.todays_revenue)}</span></span>
                <span>Receivables: <span className="text-blue-600">{moneyINR(data?.outstanding_receivables)}</span></span>
                <span>Trip P&L: <span className="text-indigo-600">{moneyINR(data?.monthly_trip_profit)}</span></span>
                <span>Advances due: <span className="text-purple-600">{moneyINR(data?.driver_advances_outstanding)}</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {KPI_CONFIG.map(({ key, label, icon: Icon, color, bg, to, isCount }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => navigate(to)}
                  className="text-left bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-[#0052CC] hover:bg-[#EBF3FF]/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                      <p className={`text-2xl font-black mt-2 ${color}`}>
                        {isCount ? (data?.[key] ?? 0) : moneyINR(data?.[key])}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${bg}`}>
                      <Icon size={18} className={color} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Quick access</h2>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {SHORTCUTS.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => navigate(item.to)}
                    className="text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-[#0052CC] hover:bg-[#EBF3FF]/40 transition-all"
                  >
                    <p className="text-sm font-bold text-[#172B4D]">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
