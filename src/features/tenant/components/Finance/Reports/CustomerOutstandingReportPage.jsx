import React, { useMemo, useState } from 'react'

import { useCustomerOutstandingReport } from '../../../queries/finance/financeQuery'
import FinanceReportShell, { ReportTable, exportCsv, money } from './FinanceReportShell'

export default function CustomerOutstandingReportPage() {
  const { data = [], isLoading, refetch } = useCustomerOutstandingReport({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => (data || []).filter((r) =>
      String(r.billing_company_name || '').toLowerCase().includes(search.toLowerCase())
      || String(r.billing_customer_id || '').includes(search),
    ),
    [data, search],
  )

  const columns = [
    { key: 'billing_company_name', title: 'Customer' },
    { key: 'billing_customer_id', title: 'Customer ID' },
    { key: 'outstanding', title: 'Outstanding', align: 'right', render: (v) => money(v) },
  ]

  return (
    <FinanceReportShell
      search={search}
      onSearch={setSearch}
      searchPlaceholder="Search customer..."
      isLoading={isLoading}
      onRefresh={refetch}
      onExport={() => exportCsv(
        'customer_outstanding.csv',
        ['Customer', 'Customer ID', 'Outstanding'],
        filtered.map((r) => [r.billing_company_name, r.billing_customer_id, r.outstanding]),
      )}
    >
      <ReportTable columns={columns} rows={filtered} />
    </FinanceReportShell>
  )
}
