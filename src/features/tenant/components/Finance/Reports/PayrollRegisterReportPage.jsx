import React, { useMemo, useState } from 'react'

import { usePayrollRegisterReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { ReportTable, exportCsv, money } from './FinanceReportShell'

export default function PayrollRegisterReportPage() {
  const { data = [], isLoading, refetch } = usePayrollRegisterReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => (data || []).filter((r) => String(r.driver_id || '').includes(search)),
    [data, search],
  )

  const columns = [
    { key: 'driver_id', title: 'Driver ID', render: (v) => (v ? String(v).slice(0, 8) : '-') },
    { key: 'base_salary', title: 'Base', align: 'right', render: (v) => money(v) },
    { key: 'trip_earnings', title: 'Trip Earn.', align: 'right', render: (v) => money(v) },
    { key: 'gross_pay', title: 'Gross', align: 'right', render: (v) => money(v) },
    { key: 'advance_recovery', title: 'Adv. Rec.', align: 'right', render: (v) => money(v) },
    { key: 'net_pay', title: 'Net Pay', align: 'right', render: (v) => money(v) },
    { key: 'payment_status', title: 'Status' },
  ]

  return (
    <FinanceReportShell
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search driver ID..."
      isLoading={isLoading}
      onRefresh={refetch}
      onExport={() => exportCsv(
        'payroll_register.csv',
        ['Driver', 'Base', 'Trip', 'Gross', 'Adv Recovery', 'Net', 'Status'],
        filtered.map((r) => [r.driver_id, r.base_salary, r.trip_earnings, r.gross_pay, r.advance_recovery, r.net_pay, r.payment_status]),
      )}
    >
      <ReportTable columns={columns} rows={filtered} />
    </FinanceReportShell>
  )
}
