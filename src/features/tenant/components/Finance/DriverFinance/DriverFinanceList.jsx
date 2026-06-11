import React, { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import { asList, moneyINR } from '../Common/financeUtils'
import {
  useAdvanceOutstandingReport,
  usePayrollEntries,
  usePayrollPeriods,
} from '../../../queries/finance/financeQuery'
import { useDrivers } from '../../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../../Drivers/common/utils'

export default function DriverFinanceList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const now = new Date()
  const { data: periodsData } = usePayrollPeriods({ month: now.getMonth() + 1, year: now.getFullYear(), page_size: 5 })
  const periods = asList(periodsData)
  const currentPeriod = periods[0]

  const { data: entriesData, isLoading: entriesLoading, refetch } = usePayrollEntries(
    currentPeriod ? { payroll_period: currentPeriod.id, page_size: 500 } : { page_size: 0 },
  )
  const { data: advanceData } = useAdvanceOutstandingReport({})
  const { data: driversData } = useDrivers({ page_size: 500 })

  const entries = asList(entriesData)
  const drivers = asList(driversData)

  const advanceMap = useMemo(() => {
    const m = {}
    ;(advanceData || []).forEach((r) => { m[String(r.driver_id)] = Number(r.outstanding || 0) })
    return m
  }, [advanceData])

  const rows = useMemo(() => {
    const byDriver = {}
    entries.forEach((e) => {
      byDriver[String(e.driver_id)] = e
    })

    const merged = drivers.map((d) => {
      const id = String(d.id)
      const entry = byDriver[id]
      return {
        id,
        name: getDriverName(d),
        month: currentPeriod ? `${currentPeriod.month}/${currentPeriod.year}` : '—',
        base_salary: entry?.base_salary || 0,
        trip_earnings: entry?.trip_earnings || 0,
        advances_due: advanceMap[id] || 0,
        net_pay: entry?.net_pay || 0,
        status: entry?.payment_status || (advanceMap[id] > 0 ? 'ADVANCE_DUE' : '—'),
      }
    })

    return merged
      .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search))
      .filter((r) => !status || r.status === status)
      .sort((a, b) => b.net_pay - a.net_pay)
  }, [drivers, entries, advanceMap, currentPeriod, search, status])

  const stats = useMemo(() => {
    const totalPayroll = rows.reduce((s, r) => s + Number(r.net_pay || 0), 0)
    const pending = rows.filter((r) => r.status === 'PENDING').length
    const totalAdvances = rows.reduce((s, r) => s + r.advances_due, 0)
    return [
      { label: 'Drivers', value: rows.length },
      { label: 'Payroll (Month)', value: moneyINR(totalPayroll) },
      { label: 'Pending Pay', value: pending, className: 'text-amber-600' },
      { label: 'Advances Due', value: moneyINR(totalAdvances), className: 'text-purple-600' },
    ]
  }, [rows])

  const columns = [
    { key: 'name', title: 'Driver' },
    { key: 'month', title: 'Period' },
    { key: 'base_salary', title: 'Base Salary', render: (v) => moneyINR(v) },
    { key: 'trip_earnings', title: 'Trip Earnings', render: (v) => moneyINR(v) },
    { key: 'advances_due', title: 'Advances Due', render: (v) => moneyINR(v) },
    { key: 'net_pay', title: 'Net Pay', render: (v) => moneyINR(v) },
    { key: 'status', title: 'Status' },
  ]

  const secondaryFilters = (
    <select
      className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
    >
      <option value="">All statuses</option>
      <option value="PENDING">Pending</option>
      <option value="PAID">Paid</option>
      <option value="ADVANCE_DUE">Advance Due</option>
    </select>
  )

  return (
    <FinanceListPage
      title="Driver Finance"
      subtitle="Payroll, advances, and settlements per driver"
      stats={stats}
      rows={rows}
      columns={columns}
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={entriesLoading}
      secondaryFilters={secondaryFilters}
      emptyMessage="No driver finance records for this period"
      onRowClick={(row) => navigate(`/tenant/dashboard/finance/drivers/${row.id}`)}
      rowActions={(row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/drivers/${row.id}`) }}
          className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#EBF3FF] hover:text-[#0052CC]"
        >
          <Eye size={14} />
        </button>
      )}
    />
  )
}
