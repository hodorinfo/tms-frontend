import React, { useMemo, useState } from 'react'
import { CheckCircle2, Coins, List, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useClosePayrollPeriod,
  useCreatePayrollPeriod,
  useGeneratePayrollEntries,
  useMarkAllPayrollPaid,
  usePayrollPeriods,
} from '../../../queries/finance/financeQuery'

import PayrollDeductionsPage from './PayrollDeductionsPage'
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function PayrollDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('periods')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    period_code: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    start_date: '',
    end_date: '',
  })
  
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  
  const { data, isLoading, refetch } = usePayrollPeriods(queryParams)
  const generate = useGeneratePayrollEntries()
  const close = useClosePayrollPeriod()
  const markAllPaid = useMarkAllPayrollPaid()
  const createPeriod = useCreatePayrollPeriod()
  
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Open', value: rows.filter((r) => r.status === 'OPEN').length, className: 'text-amber-600' },
    { label: 'Processing', value: rows.filter((r) => r.status === 'PROCESSING').length, className: 'text-indigo-600' },
    { label: 'Closed', value: rows.filter((r) => r.status === 'CLOSED').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-8 py-4">
            <button 
              type="button" 
              onClick={() => setActiveTab('periods')}
              className={`text-sm font-bold transition-all border-b-2 pb-4 -mb-4 ${activeTab === 'periods' ? 'text-[#0052CC] border-[#0052CC]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Payroll Periods
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('deductions')}
              className={`text-sm font-bold transition-all border-b-2 pb-4 -mb-4 ${activeTab === 'deductions' ? 'text-[#0052CC] border-[#0052CC]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Deduction Types
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {activeTab === 'periods' ? (
          <FinanceListPage
            title="Payroll"
            subtitle="Generate payroll entries, monitor processing, and close payroll periods."
            search={search}
            setSearch={setSearch}
            secondaryFilters={(
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="PROCESSING">Processing</option>
                <option value="CLOSED">Closed</option>
              </select>
            )}
            onRefresh={refetch}
            isLoading={isLoading}
            stats={stats}
            rows={rows}
            columns={[
              { key: 'period_code', title: 'Period Code', render: (v) => <span className="font-bold text-[#172B4D]">{v}</span> },
              { key: 'month', title: 'Month', render: (m) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' }) },
              { key: 'year', title: 'Year' },
              { key: 'start_date', title: 'From', render: (d) => d ? formatDate(d) : '-' },
              { key: 'end_date', title: 'To', render: (d) => d ? formatDate(d) : '-' },
              { 
                key: 'status', 
                title: 'Status',
                render: (s) => (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    s === 'CLOSED' ? 'bg-green-100 text-green-700' :
                    s === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {s}
                  </span>
                )
              },
            ]}
            actions={(
              <button 
                type="button" 
                onClick={() => {
                  setForm({
                    period_code: `PRL-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    start_date: '',
                    end_date: '',
                  })
                  setShowCreate(true)
                }} 
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0747A6] text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={14} /> Create period
              </button>
            )}
            rowActions={(row) => (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/tenant/dashboard/finance/payroll/${row.id}/entries`)}
                  className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"
                  title="Entries"
                >
                  <List size={16} />
                </button>
                {row.status === 'OPEN' && (
                  <button type="button" disabled={generate.isPending} onClick={() => generate.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white disabled:opacity-50 transition-all">
                    Generate
                  </button>
                )}
                {['OPEN', 'PROCESSING'].includes(row.status) && (
                  <button type="button" disabled={close.isPending} onClick={() => window.confirm('Close this payroll period?') && close.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50 transition-all" title="Close Period">
                    <CheckCircle2 size={16} />
                  </button>
                )}
                {row.status === 'PROCESSING' && (
                  <button
                    type="button"
                    disabled={markAllPaid.isPending}
                    onClick={() => markAllPaid.mutate(row.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50 transition-all"
                    title="Mark All Entries Paid"
                  >
                    <Coins size={16} />
                  </button>
                )}
              </>
            )}
          />
        ) : (
          <PayrollDeductionsPage />
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-[#172B4D]">Create payroll period</h3>
            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Period Code</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Period code" value={form.period_code} onChange={(e) => setForm({ ...form, period_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Month</label>
                  <input type="number" min={1} max={12} className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Month" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Year</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">Start Date</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">End Date</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                disabled={!form.period_code || !form.start_date || !form.end_date || createPeriod.isPending}
                onClick={() => createPeriod.mutate(
                  {
                    period_code: form.period_code,
                    month: form.month,
                    year: form.year,
                    start_date: form.start_date,
                    end_date: form.end_date,
                    status: 'OPEN',
                  },
                  { onSuccess: () => { setShowCreate(false); refetch() } },
                )}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
