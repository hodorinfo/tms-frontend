import React, { useMemo, useState } from 'react'
import { AlertCircle, Camera, ChevronRight, FileText, Loader2, Plus, Receipt } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import FinanceDetailShell from '../Common/FinanceDetailShell'
import {
  asList,
  BILLABLE_TRIP_STATUSES,
  formatApiErrorMessages,
  isTripInvoiceEligible,
  moneyINR,
} from '../Common/financeUtils'
import StatusBadge from '../Common/StatusBadge'
import { useTripLrRows } from './useTripLrRows'
import {
  useApproveExpense,
  useExpensesByTrip,
  useFinalizeTripSettlement,
  useGenerateInvoiceFromTrip,
  useInvoiceDetail,
  useInvoiceLineItems,
  useCustomerPayments,
  useInvoices,
  usePostInvoice,
  useRejectExpense,
} from '../../../queries/finance/financeQuery'
import { useTripCharges, useTripDetail, useTripDocuments } from '../../../queries/orders/ordersQuery'
import { useDriverDetail } from '../../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../../Drivers/common/utils'
import { formatDate } from '@/utils/dateFormat'

const TABS = [
  { key: 'lr', label: 'LR Summary' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'invoices', label: 'Invoice & Payments' },
  { key: 'settlement', label: 'Settlement' },
  { key: 'documents', label: 'Documents & POD' },
]

const EXPENSE_TYPE_HINT = 'Fuel, Toll, Maintenance, Repair, Driver Advance, Branch Advance, Office, Misc'

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="p-10 text-center">
      <div className="inline-flex p-3 rounded-full bg-gray-50 text-gray-400 mb-3">
        <Icon size={22} />
      </div>
      <p className="text-sm font-bold text-[#172B4D]">{title}</p>
      <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function WorkflowStep({ step, label, status, hint, action }) {
  const styles = {
    done: 'border-green-200 bg-green-50 text-green-800',
    current: 'border-[#0052CC] bg-[#EBF3FF] text-[#0052CC]',
    pending: 'border-gray-200 bg-gray-50 text-gray-500',
    locked: 'border-gray-200 bg-gray-50/60 text-gray-400 opacity-80',
  }
  const statusLabel = {
    done: 'Completed',
    current: 'Action needed',
    pending: 'Waiting',
    locked: 'Locked — complete previous step',
  }
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${styles[status] || styles.pending}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black border border-current">
          {step}
        </span>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
          <p className="text-[11px] mt-0.5 opacity-80">{statusLabel[status] || statusLabel.pending}</p>
          {hint && <p className="text-[11px] mt-1 opacity-90 leading-relaxed">{hint}</p>}
        </div>
      </div>
      {status !== 'locked' && action}
    </div>
  )
}

function getInvoiceWorkflowState(trip, tripInvoices, primaryInvoice) {
  const tripBillable = isTripInvoiceEligible(trip)
  const hasInvoice = tripInvoices.length > 0
  const invoiceStatus = String(primaryInvoice?.status || '').toUpperCase()
  const isDraft = invoiceStatus === 'DRAFT'
  const isPosted = hasInvoice && !isDraft
  const amountDue = Number(primaryInvoice?.amount_due || 0)
  const isFullyPaid = hasInvoice && (invoiceStatus === 'PAID' || amountDue <= 0)

  const step0 = tripBillable ? 'done' : 'current'
  const step1 = !tripBillable ? 'locked' : hasInvoice ? 'done' : 'current'
  const step2 = !tripBillable || !hasInvoice ? 'locked' : isPosted ? 'done' : 'current'
  const step3 = !tripBillable || !hasInvoice || !isPosted ? 'locked' : isFullyPaid ? 'done' : 'current'

  return { tripBillable, hasInvoice, isDraft, isPosted, isFullyPaid, amountDue, step0, step1, step2, step3 }
}

export default function TripFinanceDetail() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'lr'
  const [expandedLr, setExpandedLr] = useState(null)
  const [invoiceErrors, setInvoiceErrors] = useState([])

  const { data: trip, isLoading: tripLoading } = useTripDetail(tripId)
  const { data: driver } = useDriverDetail(trip?.primary_driver_id)
  const { rows: lrRows, isLoading: lrLoading } = useTripLrRows(trip)

  const { data: expensesRaw, isLoading: expensesLoading, isError: expensesError } = useExpensesByTrip(tripId)
  const { data: chargesRaw, isLoading: chargesLoading } = useTripCharges(tripId)
  const { data: lineItemsData } = useInvoiceLineItems({ trip_id: tripId, page_size: 100 })
  const lineItems = asList(lineItemsData)
  const lineItemInvoiceId = lineItems.find((li) => li.invoice)?.invoice
  const { data: tripInvoicesData } = useInvoices({ trip_id: tripId, page_size: 20 })
  const { data: lineItemInvoice } = useInvoiceDetail(lineItemInvoiceId)
  const { data: paymentsData } = useCustomerPayments({ page_size: 500 })
  const { data: docsData } = useTripDocuments(tripId)

  const generateInvoice = useGenerateInvoiceFromTrip()
  const finalizeSettlement = useFinalizeTripSettlement()
  const postInvoice = usePostInvoice()
  const approveExpense = useApproveExpense()
  const rejectExpense = useRejectExpense()

  const financeExpenses = asList(expensesRaw)
  const tripCharges = asList(chargesRaw)
  const documents = asList(docsData)

  const tripInvoices = useMemo(() => {
    const fromTripFilter = asList(tripInvoicesData)
    if (fromTripFilter.length) return fromTripFilter
    if (lineItemInvoice) return [lineItemInvoice]
    return []
  }, [tripInvoicesData, lineItemInvoice])

  const invoiceByOrderId = useMemo(() => {
    const map = {}
    lineItems.forEach((li) => {
      if (!li.order_id || !li.invoice) return
      const inv = tripInvoices.find((i) => String(i.id) === String(li.invoice))
      map[String(li.order_id)] = inv || { id: li.invoice }
    })
    if (tripInvoices.length === 1 && lrRows.length === 1) {
      map[String(lrRows[0].order_id)] = tripInvoices[0]
    }
    return map
  }, [lineItems, tripInvoices, lrRows])

  const expenseTotal = useMemo(
    () => financeExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [financeExpenses],
  )
  const approvedExpenseTotal = useMemo(
    () => financeExpenses.filter((e) => e.status === 'APPROVED').reduce((s, e) => s + Number(e.amount || 0), 0),
    [financeExpenses],
  )
  const chargesTotal = useMemo(
    () => tripCharges.reduce((s, c) => s + Number(c.amount || 0), 0),
    [tripCharges],
  )

  const freight = Number(trip?.total_bill_amount || trip?.total_freight_charge || 0)
  const totalCosts = approvedExpenseTotal + chargesTotal
  const netPnl = freight - totalCosts

  const primaryInvoice = tripInvoices[0]
  const workflow = getInvoiceWorkflowState(trip, tripInvoices, primaryInvoice)

  const tripPayments = useMemo(() => {
    const invIds = new Set(tripInvoices.map((i) => String(i.id)))
    const customerId = primaryInvoice?.billing_customer_id
    return asList(paymentsData).filter((p) => {
      if (p.invoice_id && invIds.has(String(p.invoice_id))) return true
      if (customerId && String(p.customer_id) === String(customerId) && invIds.size > 0) return true
      return false
    })
  }, [paymentsData, tripInvoices, primaryInvoice?.billing_customer_id])

  const invoiceSummaryLabel = useMemo(() => {
    if (!primaryInvoice) {
      if (!workflow.tripBillable) return `Blocked (${trip?.status || '—'})`
      return 'Not created'
    }
    return primaryInvoice.invoice_number || primaryInvoice.status || 'Created'
  }, [primaryInvoice, workflow.tripBillable, trip?.status])

  const handleGenerateInvoice = () => {
    setInvoiceErrors([])
    if (!workflow.tripBillable) {
      const msg = `Trip must be ${BILLABLE_TRIP_STATUSES.join(' or ')} before invoicing. Current status: ${trip?.status || 'UNKNOWN'}.`
      setInvoiceErrors([msg])
      return
    }
    generateInvoice.mutate(tripId, {
      onError: (err) => {
        const msgs = formatApiErrorMessages(err?.response?.data)
        const text = msgs.join(' ').toLowerCase()
        if (text.includes('already invoiced')) {
          const existingId = lineItemInvoiceId || lineItems.find((li) => li.invoice)?.invoice
          if (existingId) {
            navigate(`/tenant/dashboard/finance/invoices/${existingId}`)
            return
          }
        }
        setInvoiceErrors(msgs.length ? msgs : ['Could not generate invoice.'])
      },
      onSuccess: (invoice) => {
        setInvoiceErrors([])
        const id = invoice?.id || lineItemInvoiceId
        if (id) navigate(`/tenant/dashboard/finance/invoices/${id}`)
      },
    })
  }

  const setTab = (key) => setSearchParams({ tab: key }, { replace: true })

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="animate-spin mr-2" size={16} /> Loading trip finance...
      </div>
    )
  }

  if (!trip) {
    return <div className="p-8 text-sm text-gray-500">Trip not found.</div>
  }

  const driverName = getDriverName(driver)

  return (
    <FinanceDetailShell
      backTo="/tenant/dashboard/finance/trips"
      backLabel="All Trips"
      title={`Trip ${trip.trip_number || tripId.slice(0, 8)}`}
      subtitle={`${trip.vehicle_number || '—'} · ${driverName} · ${formatDate(trip.scheduled_pickup_date) || '—'}`}
      summaryItems={[
        { label: 'Route', value: `${trip.origin_address || '—'} → ${trip.destination_address || '—'}` },
        { label: 'Status', value: trip.status },
        { label: 'Freight', value: moneyINR(freight), className: 'text-green-600' },
        { label: 'Expenses', value: moneyINR(totalCosts), className: 'text-red-600' },
        { label: 'Net P&L', value: moneyINR(netPnl), className: netPnl >= 0 ? 'text-green-600' : 'text-red-600' },
        {
          label: 'Invoice',
          value: primaryInvoice ? (
            <Link to={`/tenant/dashboard/finance/invoices/${primaryInvoice.id}`} className="text-[#0052CC] hover:underline">
              {invoiceSummaryLabel} · {primaryInvoice.status}
            </Link>
          ) : invoiceSummaryLabel,
          className: primaryInvoice ? 'text-[#0052CC]' : workflow.tripBillable ? 'text-amber-600' : 'text-red-600',
        },
      ]}
      tabs={TABS.map((t) => ({
        ...t,
        count: t.key === 'expenses' ? financeExpenses.length + tripCharges.length : t.key === 'documents' ? documents.length : undefined,
      }))}
      activeTab={activeTab}
      onTabChange={setTab}
      actions={(
        <>
          <Link
            to="/tenant/dashboard/finance/invoices"
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            All Invoices
          </Link>
          {workflow.hasInvoice && primaryInvoice ? (
            <Link
              to={`/tenant/dashboard/finance/invoices/${primaryInvoice.id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90"
            >
              <FileText size={14} /> View Invoice
            </Link>
          ) : workflow.step1 === 'current' ? (
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={generateInvoice.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              <FileText size={14} /> Generate Invoice
            </button>
          ) : null}
          <Link
            to={`/tenant/dashboard/orders/trips/${tripId}`}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            Open Trip Ops
          </Link>
        </>
      )}
    >
      {activeTab === 'lr' && (
        <div className="overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/40 text-xs text-gray-600">
            Each row is one LR (consignment) on this trip. Invoice links open the customer bill; amounts come from LR finance records synced with the order.
          </div>
          {lrLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading LR details...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">LR #</th>
                  <th className="text-left px-4 py-3">Consignor</th>
                  <th className="text-left px-4 py-3">Consignee</th>
                  <th className="text-right px-4 py-3">Freight</th>
                  <th className="text-right px-4 py-3">Accessorial</th>
                  <th className="text-right px-4 py-3">TDS</th>
                  <th className="text-right px-4 py-3">Bill Amount</th>
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4 py-3">Paid</th>
                </tr>
              </thead>
              <tbody>
                {lrRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No LRs linked to this trip.
                      <Link to={`/tenant/dashboard/orders/trips/${tripId}`} className="block mt-2 text-[#0052CC] font-bold hover:underline">
                        Open Trip Ops to link orders
                      </Link>
                    </td>
                  </tr>
                ) : lrRows.map((lr) => {
                  const inv = invoiceByOrderId[String(lr.order_id)]
                  return (
                    <React.Fragment key={lr.id || lr.order_id}>
                      <tr
                        className="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer"
                        onClick={() => setExpandedLr(expandedLr === lr.id ? null : lr.id)}
                      >
                        <td className="px-4 py-3 font-semibold">{lr.lr_number}</td>
                        <td className="px-4 py-3">{lr.consignor_name}</td>
                        <td className="px-4 py-3">{lr.consignee_name}</td>
                        <td className="px-4 py-3 text-right">{moneyINR(lr.freight_charge)}</td>
                        <td className="px-4 py-3 text-right">{moneyINR(lr.accessorial_charge)}</td>
                        <td className="px-4 py-3 text-right">{moneyINR(lr.tds_amount)}</td>
                        <td className="px-4 py-3 text-right font-bold">{moneyINR(lr.bill_amount)}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {inv ? (
                            <Link
                              to={`/tenant/dashboard/finance/invoices/${inv.id}`}
                              className="inline-flex items-center gap-1 text-[#0052CC] font-bold hover:underline"
                            >
                              {inv.invoice_number} <ChevronRight size={12} />
                            </Link>
                          ) : (
                            <StatusBadge value={workflow.hasInvoice ? 'RAISED' : 'PENDING'} />
                          )}
                        </td>
                        <td className="px-4 py-3">{lr.is_paid ? '✓' : '—'}</td>
                      </tr>
                      {expandedLr === lr.id && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={9} className="px-6 py-4 text-xs text-gray-600 space-y-1">
                            <p>Incentive: {moneyINR(lr.incentive_amount)} · Late fee: {moneyINR(lr.late_fee)} · Part load: {moneyINR(lr.part_load_charge)} · Broker: {moneyINR(lr.broker_commission)}</p>
                            <p>Payment received: {moneyINR(lr.payment_received_amount)} · Balance: {moneyINR(lr.balance_due)}</p>
                            {lr.order_id && (
                              <Link to={`/tenant/dashboard/orders/${lr.order_id}`} className="text-[#0052CC] font-bold hover:underline">
                                Open order {lr.lr_number}
                              </Link>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div>
          <div className="px-4 py-3 border-b border-gray-100 space-y-2">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600">
              <span>Finance expenses: {moneyINR(expenseTotal)}</span>
              <span className="text-green-600">Approved: {moneyINR(approvedExpenseTotal)}</span>
              <span>Trip charges: {moneyINR(chargesTotal)}</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Loads from Finance service (types: {EXPENSE_TYPE_HINT}) plus trip-level charges from Trip Ops.
            </p>
          </div>
          {expensesError && (
            <p className="mx-4 mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertCircle size={14} /> Could not load finance expenses. Trip charges below may still apply.
            </p>
          )}
          {(expensesLoading || chargesLoading) ? (
            <p className="p-6 text-sm text-gray-500">Loading expenses...</p>
          ) : financeExpenses.length === 0 && tripCharges.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses on this trip yet"
              description={`Record fuel, toll, maintenance, or other costs in Finance. Supported types: ${EXPENSE_TYPE_HINT}.`}
              action={(
                <Link
                  to={`/tenant/dashboard/orders/trips/${tripId}?view=finance`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90"
                >
                  <Plus size={14} /> Add expense via Trip Ops
                </Link>
              )}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {financeExpenses.map((row) => (
                  <tr key={row.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/tenant/dashboard/finance/expenses/${row.id}`} className="text-[#0052CC] font-semibold hover:underline">
                        {row.expense_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.expense_type_name || row.expense_type?.name || row.expense_type_code || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{moneyINR(row.amount)}</td>
                    <td className="px-4 py-3">{row.expense_date}</td>
                    <td className="px-4 py-3"><StatusBadge value={row.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {row.status === 'DRAFT' && (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => approveExpense.mutate({ id: row.id })} className="text-[10px] font-bold text-green-600 hover:underline">Approve</button>
                          <button type="button" onClick={() => rejectExpense.mutate({ id: row.id, rejection_reason: 'Rejected from trip finance' })} className="text-[10px] font-bold text-red-600 hover:underline">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {tripCharges.map((row) => (
                  <tr key={`charge-${row.id}`} className="border-t border-gray-50 bg-slate-50/40">
                    <td className="px-4 py-3 text-gray-500 text-xs">Trip charge</td>
                    <td className="px-4 py-3">{row.charge_type || 'Charge'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{moneyINR(row.amount)}</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3"><StatusBadge value="CHARGE" /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/tenant/dashboard/orders/trips/${tripId}?view=finance`} className="text-[10px] font-bold text-[#0052CC] hover:underline">Edit in Trip Ops</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="p-5 space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-gray-600 leading-relaxed space-y-2">
            <p className="font-bold text-[#172B4D]">What is an invoice?</p>
            <p>
              Generating an invoice creates a <strong>formal bill</strong> in TMS for the customer (from this trip&apos;s LR freight).
              It is saved in your system under Finance — it is <strong>not emailed</strong> to the customer automatically today.
              You can open, print, or share it from the invoice detail page. Posting locks the bill; recording payment closes it in accounts.
            </p>
            <p className="font-semibold text-[#172B4D]">
              Current status:{' '}
              {!workflow.tripBillable && `Trip is ${trip.status} — complete delivery first. `}
              {workflow.tripBillable && !workflow.hasInvoice && 'Ready to generate invoice. '}
              {workflow.hasInvoice && workflow.isDraft && `Invoice ${primaryInvoice?.invoice_number} is DRAFT — post it to bill the customer. `}
              {workflow.isPosted && workflow.amountDue > 0 && `Invoice posted — ₹${workflow.amountDue} outstanding. `}
              {workflow.isFullyPaid && 'Invoice fully paid. '}
            </p>
          </div>

          {invoiceErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
              <p className="font-bold flex items-center gap-2"><AlertCircle size={14} /> Could not generate invoice</p>
              <ul className="list-disc pl-5 space-y-1">
                {invoiceErrors.map((msg) => <li key={msg}>{msg}</li>)}
              </ul>
              {!workflow.tripBillable && (
                <Link to={`/tenant/dashboard/orders/trips/${tripId}`} className="inline-block mt-2 font-bold text-[#0052CC] hover:underline">
                  Open Trip Ops to mark trip COMPLETED →
                </Link>
              )}
            </div>
          )}

          <div className="grid gap-3">
            <WorkflowStep
              step={0}
              label="Complete trip delivery"
              status={workflow.step0}
              hint={`Status must be ${BILLABLE_TRIP_STATUSES.join(' or ')}. Current: ${trip.status}.`}
              action={workflow.step0 === 'current' && (
                <Link
                  to={`/tenant/dashboard/orders/trips/${tripId}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-[10px] font-bold"
                >
                  Update trip
                </Link>
              )}
            />
            <WorkflowStep
              step={1}
              label="Generate invoice (saved in TMS)"
              status={workflow.step1}
              hint={workflow.hasInvoice
                ? `Invoice ${primaryInvoice?.invoice_number || 'created'} — open to post or record payment.`
                : 'Creates a DRAFT invoice from LR freight — no email sent.'}
              action={workflow.hasInvoice && primaryInvoice ? (
                <Link
                  to={`/tenant/dashboard/finance/invoices/${primaryInvoice.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold"
                >
                  View invoice
                </Link>
              ) : workflow.step1 === 'current' ? (
                <button
                  type="button"
                  onClick={handleGenerateInvoice}
                  disabled={generateInvoice.isPending}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-[10px] font-bold disabled:opacity-50"
                >
                  Generate
                </button>
              ) : null}
            />
            <WorkflowStep
              step={2}
              label="Post invoice"
              status={workflow.step2}
              hint="Locks the bill for AR / customer ledger."
              action={workflow.step2 === 'current' && primaryInvoice && (
                <button
                  type="button"
                  onClick={() => postInvoice.mutate(primaryInvoice.id)}
                  disabled={postInvoice.isPending}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold"
                >
                  Post invoice
                </button>
              )}
            />
            <WorkflowStep
              step={3}
              label="Record customer payment"
              status={workflow.step3}
              hint="When customer pays, record and reconcile against this invoice."
              action={workflow.step3 === 'current' && primaryInvoice && (
                <Link
                  to="/tenant/dashboard/finance/customer-payments"
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-[#0052CC] text-[#0052CC] text-[10px] font-bold hover:bg-[#EBF3FF]"
                >
                  Record payment
                </Link>
              )}
            />
          </div>

          {tripInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={trip.is_billed ? 'Invoice flagged on trip — open list to find it' : 'No invoice in the system yet'}
              description={
                trip.is_billed
                  ? 'This trip is marked as billed. Check All Invoices if it does not appear below after refresh.'
                  : workflow.tripBillable
                    ? "Click Generate above to create the customer bill for this trip's freight."
                    : `Complete the trip first (status ${BILLABLE_TRIP_STATUSES.join(' / ')}), then generate the invoice.`
              }
              action={(
                <div className="flex flex-wrap justify-center gap-2">
                  {workflow.step1 === 'current' && !trip.is_billed && (
                    <button
                      type="button"
                      onClick={handleGenerateInvoice}
                      disabled={generateInvoice.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold disabled:opacity-50"
                    >
                      <FileText size={14} /> Generate Invoice
                    </button>
                  )}
                  <Link
                    to="/tenant/dashboard/finance/invoices"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    All Invoices
                  </Link>
                </div>
              )}
            />
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50">Invoices for this trip</p>
                {tripInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 hover:bg-blue-50/20 cursor-pointer"
                    onClick={() => navigate(`/tenant/dashboard/finance/invoices/${inv.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/tenant/dashboard/finance/invoices/${inv.id}`)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-[#0052CC]">{inv.invoice_number}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-sm text-gray-600">{inv.billing_company_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{moneyINR(inv.total_amount)}</span>
                        <StatusBadge value={inv.status} />
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {inv.due_date || '—'} · Paid: {moneyINR(inv.amount_paid)} · Balance: {moneyINR(inv.amount_due)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50">Customer payments</p>
                {tripPayments.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-gray-500 text-center">
                    No payments recorded for this invoice yet.
                    {workflow.step3 === 'current' && (
                      <Link to="/tenant/dashboard/finance/customer-payments" className="block mt-2 font-bold text-[#0052CC] hover:underline">
                        Record a payment →
                      </Link>
                    )}
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-gray-500 bg-gray-50/50">
                      <tr>
                        <th className="text-left px-4 py-2">Ref</th>
                        <th className="text-right px-4 py-2">Amount</th>
                        <th className="text-left px-4 py-2">Date</th>
                        <th className="text-left px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tripPayments.map((p) => (
                        <tr key={p.id} className="border-t border-gray-50">
                          <td className="px-4 py-2 font-semibold">{p.reference_number || p.payment_number}</td>
                          <td className="px-4 py-2 text-right">{moneyINR(p.amount)}</td>
                          <td className="px-4 py-2">{formatDate(p.payment_date)}</td>
                          <td className="px-4 py-2"><StatusBadge value={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-xs text-gray-600 leading-relaxed">
            <p className="font-bold text-[#172B4D] mb-1">Trip settlement</p>
            <p>Locks this trip&apos;s P&amp;L: revenue from LRs minus approved expenses and recoveries. Run this after the trip is complete and invoices/expenses are recorded. Requires finance settlement or invoice-post permission.</p>
          </div>
          <table className="w-full text-sm max-w-lg">
            <tbody>
              {[
                ['Total Freight (revenue)', freight],
                ['Approved expenses', approvedExpenseTotal],
                ['Trip charges', chargesTotal],
                ['Net Trip P&L', netPnl],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-gray-50">
                  <td className="py-2 text-gray-600">{label}</td>
                  <td className="py-2 text-right font-bold">{moneyINR(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() => finalizeSettlement.mutate(tripId)}
            disabled={finalizeSettlement.isPending}
            className="px-4 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
          >
            Finalize Settlement
          </button>
          {finalizeSettlement.isError && (
            <p className="text-xs text-red-600">
              If you see a permission error, ask your admin to grant <code className="bg-red-50 px-1 rounded">finance.settlement.create</code> or re-run <code className="bg-red-50 px-1 rounded">seed_rbac</code> for your tenant.
            </p>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <>
          {documents.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No POD or documents uploaded"
              description="Upload proof of delivery and trip documents from Trip Ops. POD is required before marking delivery complete."
              action={(
                <Link
                  to={`/tenant/dashboard/orders/trips/${tripId}?view=docs`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90"
                >
                  <Camera size={14} /> Upload documents & POD
                </Link>
              )}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Document</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">{doc.document_name || doc.file_name || doc.id}</td>
                    <td className="px-4 py-3">{doc.document_type || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge value={doc.verification_status || doc.status} /></td>
                    <td className="px-4 py-3">{formatDate(doc.uploaded_at || doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3 border-t border-gray-100">
            <Link
              to={`/tenant/dashboard/orders/trips/${tripId}?view=docs`}
              className="text-xs font-bold text-[#0052CC] hover:underline"
            >
              + Upload more documents
            </Link>
          </div>
        </>
      )}
    </FinanceDetailShell>
  )
}
