import React, { useMemo, useState } from 'react'

import { useDriverProfitReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { ReportTable, exportCsv, money } from './FinanceReportShell'

export default function DriverProfitReportPage() {
  const { data = [], isLoading, refetch } = useDriverProfitReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => (data || []).filter((r) => String(r.driver_id || '').includes(search)),
    [data, search],
  )

  const columns = [
    { key: 'driver_id', title: 'Driver ID', render: (v) => (v ? String(v).slice(0, 8) : '-') },
    { key: 'total_trip_earnings', title: 'Trip Earnings', align: 'right', render: (v) => money(v) },
    { key: 'total_net_pay', title: 'Net Pay', align: 'right', render: (v) => money(v) },
  ]

  return (
    <FinanceReportShell
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search driver ID..."
      isLoading={isLoading}
      onRefresh={refetch}
      onExport={() => exportCsv(
        'driver_profit.csv',
        ['Driver ID', 'Trip Earnings', 'Net Pay'],
        filtered.map((r) => [r.driver_id, r.total_trip_earnings, r.total_net_pay]),
      )}
    >
      <ReportTable columns={columns} rows={filtered} />
    </FinanceReportShell>
  )
}
