import React, { useMemo, useState } from 'react'

import { useInvoiceCollectionReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { ReportTable, exportCsv, money } from './FinanceReportShell'

export default function InvoiceCollectionReportPage() {
  const { data = [], isLoading, refetch } = useInvoiceCollectionReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => (data || []).filter((r) =>
      String(r.invoice_number || '').toLowerCase().includes(search.toLowerCase())
      || String(r.status || '').toLowerCase().includes(search.toLowerCase()),
    ),
    [data, search],
  )

  const columns = [
    { key: 'invoice_number', title: 'Invoice #' },
    { key: 'status', title: 'Status' },
    { key: 'total_amount', title: 'Total', align: 'right', render: (v) => money(v) },
    { key: 'amount_paid', title: 'Paid', align: 'right', render: (v) => money(v) },
    { key: 'amount_due', title: 'Due', align: 'right', render: (v) => money(v) },
  ]

  return (
    <FinanceReportShell
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search invoice or status..."
      isLoading={isLoading}
      onRefresh={refetch}
      onExport={() => exportCsv(
        'invoice_collection.csv',
        ['Invoice', 'Status', 'Total', 'Paid', 'Due'],
        filtered.map((r) => [r.invoice_number, r.status, r.total_amount, r.amount_paid, r.amount_due]),
      )}
    >
      <ReportTable columns={columns} rows={filtered} />
    </FinanceReportShell>
  )
}
