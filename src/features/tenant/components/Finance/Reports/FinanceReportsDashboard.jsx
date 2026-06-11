import React, { useMemo, useState } from 'react'
import {
  BarChart3, PieChart, TrendingUp, ShieldAlert, LayoutDashboard,
  Wallet, Users, FileText, GitMerge, Banknote, Truck,
} from 'lucide-react'

import {
  useARAgingReport,
  useAdvanceOutstandingReport,
  useCashFlowReport,
  useMonthlyPnLReport,
  useOwnerPayablesReport,
  useTDSRegisterReport,
  useTripProfitabilityReport,
} from '../../../queries/finance/financeQuery'

import ARAgingReportPage from './ARAgingReportPage'
import OwnerPayablesReportPage from './OwnerPayablesReportPage'
import TripProfitabilityReportPage from './TripProfitabilityReportPage'
import TDSRegisterReportPage from './TDSRegisterReportPage'
import MonthlyPnLReportPage from './MonthlyPnLReportPage'
import CashFlowReportPage from './CashFlowReportPage'
import CustomerOutstandingReportPage from './CustomerOutstandingReportPage'
import LRRevenueVsCostReportPage from './LRRevenueVsCostReportPage'
import InvoiceCollectionReportPage from './InvoiceCollectionReportPage'
import PayrollRegisterReportPage from './PayrollRegisterReportPage'
import AdvanceOutstandingReportPage from './AdvanceOutstandingReportPage'
import DriverProfitReportPage from './DriverProfitReportPage'
import { money } from './FinanceReportShell'

const now = new Date()

const REPORTS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Summary' },
  { id: 'monthly_pnl', label: 'Monthly P&L', icon: TrendingUp, group: 'Summary' },
  { id: 'cash_flow', label: 'Cash Flow', icon: Wallet, group: 'Summary' },
  { id: 'ar_aging', label: 'AR Aging', icon: PieChart, group: 'Receivables' },
  { id: 'customer_outstanding', label: 'Customer Outstanding', icon: Users, group: 'Receivables' },
  { id: 'invoice_collection', label: 'Invoice Collection', icon: FileText, group: 'Receivables' },
  { id: 'owner_payables', label: 'Owner Payables', icon: ShieldAlert, group: 'Payables' },
  { id: 'profitability', label: 'Trip Profitability', icon: BarChart3, group: 'Operations' },
  { id: 'lr_revenue_cost', label: 'LR Revenue vs Cost', icon: Truck, group: 'Operations' },
  { id: 'payroll_register', label: 'Payroll Register', icon: Banknote, group: 'Payroll' },
  { id: 'advance_outstanding', label: 'Advance Outstanding', icon: GitMerge, group: 'Payroll' },
  { id: 'driver_profit', label: 'Driver Profit', icon: Users, group: 'Payroll' },
  { id: 'tds_register', label: 'TDS Register', icon: ShieldAlert, group: 'Compliance' },
]

const REPORT_COMPONENTS = {
  overview: null,
  monthly_pnl: MonthlyPnLReportPage,
  cash_flow: CashFlowReportPage,
  ar_aging: ARAgingReportPage,
  customer_outstanding: CustomerOutstandingReportPage,
  invoice_collection: InvoiceCollectionReportPage,
  owner_payables: OwnerPayablesReportPage,
  profitability: TripProfitabilityReportPage,
  lr_revenue_cost: LRRevenueVsCostReportPage,
  payroll_register: PayrollRegisterReportPage,
  advance_outstanding: AdvanceOutstandingReportPage,
  driver_profit: DriverProfitReportPage,
  tds_register: TDSRegisterReportPage,
}

export default function FinanceReportsDashboard() {
  const [activeReport, setActiveReport] = useState('overview')

  const { data: arAging = [] } = useARAgingReport({})
  const { data: ownerPayables = [] } = useOwnerPayablesReport({})
  const { data: tripProfitability = [] } = useTripProfitabilityReport({})
  const { data: tdsRegister = [] } = useTDSRegisterReport({})
  const { data: monthlyPnL } = useMonthlyPnLReport({ year: String(now.getFullYear()), month: String(now.getMonth() + 1) })
  const { data: cashFlow } = useCashFlowReport({ year: String(now.getFullYear()), month: String(now.getMonth() + 1) })
  const { data: advanceOutstanding = [] } = useAdvanceOutstandingReport({})

  const stats = useMemo(() => {
    const totalArDue = (arAging || []).reduce((sum, r) => sum + Number(r.amount_due || 0), 0)
    const totalOwnerPayables = (ownerPayables || []).reduce((sum, r) => sum + Number(r.total || 0), 0)
    const totalProfit = (tripProfitability || []).reduce((sum, r) => sum + Number(r.profit || 0), 0)
    const totalTds = (tdsRegister || []).reduce((sum, r) => sum + Number(r.total_tds || 0), 0)
    const totalAdvance = (advanceOutstanding || []).reduce((sum, r) => sum + Number(r.outstanding || 0), 0)

    return [
      { label: 'AR Due', value: totalArDue, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Owner Payables', value: totalOwnerPayables, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Monthly Net Profit', value: monthlyPnL?.net_profit || 0, color: Number(monthlyPnL?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-700', bg: 'bg-green-50' },
      { label: 'Net Cash Flow', value: cashFlow?.net_cash_flow || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Trip Profit (All)', value: totalProfit, color: totalProfit >= 0 ? 'text-green-600' : 'text-red-700', bg: 'bg-green-50' },
      { label: 'Advance Outstanding', value: totalAdvance, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'TDS Total', value: totalTds, color: 'text-teal-600', bg: 'bg-teal-50' },
    ]
  }, [arAging, ownerPayables, tripProfitability, tdsRegister, monthlyPnL, cashFlow, advanceOutstanding])

  const groupedReports = useMemo(() => {
    const groups = {}
    REPORTS.forEach((report) => {
      if (!groups[report.group]) groups[report.group] = []
      groups[report.group].push(report)
    })
    return groups
  }, [])

  const ActiveComponent = REPORT_COMPONENTS[activeReport]

  return (
    <div className="flex flex-col h-full bg-[#f4f5f7] min-h-[calc(100vh-4rem)]">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-bold text-[#172B4D]">Finance Reports</h1>
        <p className="text-xs text-gray-500 font-medium mt-1">Analyze accounts, profitability, payroll, and compliance data</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 hidden md:block">
          {Object.entries(groupedReports).map(([group, items]) => (
            <div key={group} className="py-3">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{group}</p>
              {items.map((report) => {
                const Icon = report.icon
                const active = activeReport === report.id
                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-left text-xs font-semibold transition-all ${
                      active ? 'bg-[#EBF3FF] text-[#0052CC] border-r-2 border-[#0052CC]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} />
                    {report.label}
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        <div className="md:hidden w-full border-b border-gray-200 bg-white p-2 overflow-x-auto flex gap-1">
          {REPORTS.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setActiveReport(report.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                activeReport === report.id ? 'bg-[#0052CC] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {report.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-hidden">
          {activeReport === 'overview' ? (
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>₹ {money(stat.value)}</p>
                    <div className={`mt-3 h-1.5 w-12 rounded-full ${stat.bg}`} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-6">Select a report from the sidebar to view detailed data, search, and export CSV.</p>
            </div>
          ) : ActiveComponent ? (
            <ActiveComponent />
          ) : null}
        </main>
      </div>
    </div>
  )
}
