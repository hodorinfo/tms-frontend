import React, { useMemo, useState } from 'react'

import { useAdvanceOutstandingReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { ReportTable, exportCsv, money } from './FinanceReportShell'

export default function AdvanceOutstandingReportPage() {
  const { data = [], isLoading, refetch } = useAdvanceOutstandingReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => (data || []).filter((r) => String(r.driver_id || '').includes(search)),
    [data, search],
  )

  const columns = [
    { key: 'driver_id', title: 'Driver ID', render: (v) => (v ? String(v).slice(0, 8) : '-') },
    { key: 'outstanding', title: 'Outstanding', align: 'right', render: (v) => money(v) },
  ]

  return (
    <FinanceReportShell
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search driver ID..."
      isLoading={isLoading}
      onRefresh={refetch}
      onExport={() => exportCsv(
        'advance_outstanding.csv',
        ['Driver ID', 'Outstanding'],
        filtered.map((r) => [r.driver_id, r.outstanding]),
      )}
    >
      <ReportTable columns={columns} rows={filtered} />
    </FinanceReportShell>
  )
}
