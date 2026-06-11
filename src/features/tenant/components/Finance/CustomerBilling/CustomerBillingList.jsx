import React, { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import { asList, moneyINR } from '../Common/financeUtils'
import { useCustomerOutstandingReport, useInvoices } from '../../../queries/finance/financeQuery'
import { useCustomers } from '../../../queries/customers/customersQuery'

export default function CustomerBillingList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: outstanding = [], isLoading: outstandingLoading, refetch: refetchOutstanding } = useCustomerOutstandingReport({})
  const { data: invoicesData } = useInvoices({ page_size: 500, status: 'OVERDUE' })
  const { data: customersData } = useCustomers({ page_size: 500 })

  const customers = asList(customersData)
  const overdueInvoices = asList(invoicesData)

  const overdueByCustomer = useMemo(() => {
    const m = {}
    overdueInvoices.forEach((inv) => {
      const cid = String(inv.billing_customer_id)
      m[cid] = (m[cid] || 0) + Number(inv.amount_due || 0)
    })
    return m
  }, [overdueInvoices])

  const customerMap = useMemo(() => {
    const m = {}
    customers.forEach((c) => {
      m[String(c.id)] = c
    })
    return m
  }, [customers])

  const rows = useMemo(() => {
    const seen = new Set()
    const merged = []

    ;(outstanding || []).forEach((row) => {
      const id = String(row.billing_customer_id)
      seen.add(id)
      const customer = customerMap[id]
      const overdue = overdueByCustomer[id] || 0
      merged.push({
        id,
        name: row.billing_company_name || customer?.legal_name || customer?.company_name || id,
        outstanding: Number(row.outstanding || 0),
        overdue,
        credit_limit: customer?.credit_limit,
        status: overdue > 0 ? 'OVERDUE' : 'OK',
      })
    })

    customers.forEach((c) => {
      const id = String(c.id)
      if (seen.has(id)) return
      merged.push({
        id,
        name: c.legal_name || c.company_name || c.name || id,
        outstanding: 0,
        overdue: overdueByCustomer[id] || 0,
        credit_limit: c.credit_limit,
        status: (overdueByCustomer[id] || 0) > 0 ? 'OVERDUE' : 'OK',
      })
    })

    return merged
      .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search))
      .sort((a, b) => b.outstanding - a.outstanding)
  }, [outstanding, customers, customerMap, overdueByCustomer, search])

  const stats = useMemo(() => {
    const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0)
    const totalOverdue = rows.reduce((s, r) => s + r.overdue, 0)
    return [
      { label: 'Customers', value: rows.length },
      { label: 'Outstanding', value: moneyINR(totalOutstanding), className: 'text-blue-600' },
      { label: 'Overdue', value: moneyINR(totalOverdue), className: 'text-red-600' },
    ]
  }, [rows])

  const columns = [
    { key: 'name', title: 'Customer' },
    { key: 'outstanding', title: 'Outstanding', render: (v) => moneyINR(v) },
    { key: 'overdue', title: 'Overdue', render: (v) => moneyINR(v) },
    {
      key: 'credit_limit',
      title: 'Credit Limit',
      render: (v) => (v != null && v !== '' ? moneyINR(v) : '—'),
    },
    { key: 'status', title: 'Status' },
  ]

  return (
    <FinanceListPage
      title="Customer Billing"
      subtitle="Invoices, payments, and reconciliations per customer"
      stats={stats}
      rows={rows}
      columns={columns}
      search={search}
      setSearch={setSearch}
      onRefresh={refetchOutstanding}
      isLoading={outstandingLoading}
      emptyMessage="No customers with billing activity"
      onRowClick={(row) => navigate(`/tenant/dashboard/finance/billing/${row.id}`)}
      rowActions={(row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/billing/${row.id}`) }}
          className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#EBF3FF] hover:text-[#0052CC]"
        >
          <Eye size={14} />
        </button>
      )}
    />
  )
}
