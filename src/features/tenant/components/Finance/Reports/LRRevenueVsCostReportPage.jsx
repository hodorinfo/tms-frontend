import React, { useMemo, useState } from 'react'

import { useLRRevenueVsCostReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { ReportTable, exportCsv, money } from './FinanceReportShell'

export default function LRRevenueVsCostReportPage() {
  const { data = [], isLoading, refetch } = useLRRevenueVsCostReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => (data || []).filter((r) =>
      String(r.lr_number || '').toLowerCase().includes(search.toLowerCase())
      || String(r.trip_id || '').includes(search),
    ),
    [data, search],
  )

  const columns = [
    { key: 'lr_number', title: 'LR #' },
    { key: 'trip_id', title: 'Trip ID', render: (v) => (v ? String(v).slice(0, 8) : '-') },
    { key: 'revenue', title: 'Revenue', align: 'right', render: (v) => money(v) },
    { key: 'cost', title: 'Cost', align: 'right', render: (v) => money(v) },
    { key: 'profit', title: 'Profit', align: 'right', render: (v) => money(v) },
  ]

  return (
    <FinanceReportShell
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search LR or trip..."
      isLoading={isLoading}
      onRefresh={refetch}
      onExport={() => exportCsv(
        'lr_revenue_vs_cost.csv',
        ['LR', 'Trip', 'Revenue', 'Cost', 'Profit'],
        filtered.map((r) => [r.lr_number, r.trip_id, r.revenue, r.cost, r.profit]),
      )}
    >
      <ReportTable columns={columns} rows={filtered} />
    </FinanceReportShell>
  )
}
