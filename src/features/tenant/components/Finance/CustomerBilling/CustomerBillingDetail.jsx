import React, { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import FinanceDetailShell from '../Common/FinanceDetailShell'
import { asList, moneyINR } from '../Common/financeUtils'
import StatusBadge from '../Common/StatusBadge'
import {
  useCustomerLedger,
  useCustomerPayments,
  useInvoices,
  useReconciliations,
} from '../../../queries/finance/financeQuery'
import { useCustomers } from '../../../queries/customers/customersQuery'
import { formatDate } from '@/utils/dateFormat'

const TABS = [
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'reconciliations', label: 'Reconciliations' },
  { key: 'ledger', label: 'Ledger' },
]

export default function CustomerBillingDetail() {
  const { customerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'invoices'
  const [expandedInvoice, setExpandedInvoice] = useState(null)

  const { data: customersData } = useCustomers({ page_size: 500 })
  const customers = asList(customersData)
  const customer = customers.find((c) => String(c.id) === String(customerId))

  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    billing_customer_id: customerId,
    page_size: 200,
  })
  const { data: paymentsData, isLoading: paymentsLoading } = useCustomerPayments({
    customer_id: customerId,
    page_size: 200,
  })
  const { data: reconciliationsData, isLoading: reconLoading } = useReconciliations({ page_size: 500 })
  const { data: ledger, isLoading: ledgerLoading } = useCustomerLedger(customerId)

  const invoices = asList(invoicesData)
  const payments = asList(paymentsData)
  const allReconciliations = asList(reconciliationsData)

  const invoiceIds = new Set(invoices.map((i) => i.id))
  const customerReconciliations = allReconciliations.filter(
    (r) => invoiceIds.has(r.invoice) || invoices.some((inv) => inv.id === r.invoice_id),
  )

  const outstanding = invoices.reduce((s, inv) => s + Number(inv.amount_due || 0), 0)
  const overdue = invoices.filter((inv) => inv.status === 'OVERDUE').reduce((s, inv) => s + Number(inv.amount_due || 0), 0)

  const setTab = (key) => setSearchParams({ tab: key }, { replace: true })

  const name = customer?.legal_name || customer?.company_name || customer?.name || ledger?.customer_name || customerId

  return (
    <FinanceDetailShell
      backTo="/tenant/dashboard/finance/billing"
      backLabel="All Customers"
      title={name}
      subtitle={customer?.gstin ? `GSTIN: ${customer.gstin}` : `Customer ID: ${customerId}`}
      summaryItems={[
        { label: 'Outstanding', value: moneyINR(outstanding), className: 'text-blue-600' },
        { label: 'Overdue', value: moneyINR(overdue), className: overdue > 0 ? 'text-red-600' : 'text-gray-600' },
        {
          label: 'Credit Limit',
          value: customer?.credit_limit != null ? moneyINR(customer.credit_limit) : '—',
        },
        { label: 'Invoices', value: invoices.length },
        { label: 'Payments', value: payments.length },
        { label: 'Status', value: overdue > 0 ? 'OVERDUE' : 'OK' },
      ]}
      tabs={TABS.map((t) => ({
        ...t,
        count: t.key === 'invoices' ? invoices.length : t.key === 'payments' ? payments.length : undefined,
      }))}
      activeTab={activeTab}
      onTabChange={setTab}
      actions={(
        <Link
          to="/tenant/dashboard/finance/invoices"
          className="px-3 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90"
        >
          + New Invoice
        </Link>
      )}
    >
      {activeTab === 'invoices' && (
        <div className="overflow-x-auto">
          {invoicesLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading invoices...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Invoice #</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Due</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No invoices.</td></tr>
                ) : invoices.map((inv) => (
                  <React.Fragment key={inv.id}>
                    <tr
                      className="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer"
                      onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}
                    >
                      <td className="px-4 py-3">
                        <Link to={`/tenant/dashboard/finance/invoices/${inv.id}`} className="font-bold text-[#0052CC] hover:underline" onClick={(e) => e.stopPropagation()}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{moneyINR(inv.total_amount)}</td>
                      <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3"><StatusBadge value={inv.status} /></td>
                      <td className="px-4 py-3 text-right">{moneyINR(inv.amount_due)}</td>
                    </tr>
                    {expandedInvoice === inv.id && (
                      <tr className="bg-gray-50/80">
                        <td colSpan={6} className="px-6 py-3 text-xs text-gray-600">
                          Paid: {moneyINR(inv.amount_paid)} · Trip: {inv.trip_id ? String(inv.trip_id).slice(0, 8) : '—'}
                          <Link to={`/tenant/dashboard/finance/customer-payments`} className="ml-4 text-[#0052CC] font-bold hover:underline">Record Payment</Link>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="overflow-x-auto">
          {paymentsLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading payments...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Ref</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Mode</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No payments.</td></tr>
                ) : payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50">
                    <td className="px-4 py-3 font-semibold">{p.reference_number || p.payment_number}</td>
                    <td className="px-4 py-3 text-right">{moneyINR(p.amount)}</td>
                    <td className="px-4 py-3">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3">{p.payment_mode}</td>
                    <td className="px-4 py-3"><StatusBadge value={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'reconciliations' && (
        <div className="overflow-x-auto">
          {reconLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading reconciliations...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-right px-4 py-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {customerReconciliations.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No reconciliations.</td></tr>
                ) : customerReconciliations.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">{formatDate(r.reconciliation_date || r.created_at)}</td>
                    <td className="px-4 py-3">{r.customer_payment_number || String(r.customer_payment || '').slice(0, 8)}</td>
                    <td className="px-4 py-3">{r.invoice_number || String(r.invoice || '').slice(0, 8)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{moneyINR(r.amount_applied)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="overflow-x-auto">
          {ledgerLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading ledger...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Debit</th>
                  <th className="text-right px-4 py-3">Credit</th>
                  <th className="text-right px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(ledger?.entries || []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No ledger entries.</td></tr>
                ) : (ledger?.entries || []).map((row, idx) => (
                  <tr key={`${row.reference}-${idx}`} className="border-t border-gray-50">
                    <td className="px-4 py-3">{row.date || '—'}</td>
                    <td className="px-4 py-3">{row.reference}</td>
                    <td className="px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3 text-right">{moneyINR(row.debit)}</td>
                    <td className="px-4 py-3 text-right">{moneyINR(row.credit)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{moneyINR(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </FinanceDetailShell>
  )
}
