import React, { useMemo, useState } from 'react'
import { CheckCircle2, Edit2, GitMerge, Plus, Trash2, XCircle } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useAutoReconcilePayment,
  useBounceCustomerPayment,
  useCreateCustomerPayment,
  useCustomerPayments,
  useDeleteCustomerPayment,
  useInvoices,
  useReconcilePayment,
  useUpdateCustomerPayment,
  useVerifyCustomerPayment,
} from '../../../queries/finance/financeQuery'
import { useCustomers } from '../../../queries/customers/customersQuery'
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function CustomerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showReconcile, setShowReconcile] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const { data: allCustomersData } = useCustomers({ page_size: 1000 })
  const allCustomers = asList(allCustomersData)
  
  const initialPayForm = {
    payment_number: `CP-${Date.now()}`,
    customer_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_mode: 'BANK_TRANSFER',
    reference_number: '',
    bank_name: '',
    invoice_id: '',
    status: 'RECEIVED',
    notes: '',
  }

  const [payForm, setPayForm] = useState(initialPayForm)
  const [recForm, setRecForm] = useState({
    customer_payment_id: '',
    invoice_id: '',
    amount_applied: '',
  })
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useCustomerPayments(queryParams)
  const { data: invoicesData } = useInvoices({ page_size: 1000 })
  const allInvoices = asList(invoicesData)

  const verify = useVerifyCustomerPayment()
  const bounce = useBounceCustomerPayment()
  const autoReconcile = useAutoReconcilePayment()
  const createPayment = useCreateCustomerPayment()
  const updatePayment = useUpdateCustomerPayment()
  const deletePayment = useDeleteCustomerPayment()
  const reconcile = useReconcilePayment()
  const rows = asList(data)

  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Received', value: rows.filter((r) => r.status === 'RECEIVED').length, className: 'text-indigo-600' },
    { label: 'Verified', value: rows.filter((r) => r.status === 'VERIFIED').length, className: 'text-green-600' },
    { label: 'Bounced', value: rows.filter((r) => r.status === 'BOUNCED').length, className: 'text-red-600' },
  ]), [data?.count, rows])

  return (
    <>
      <FinanceListPage
        title="Customer Payments"
        subtitle="Track received amounts, verification, and bounced transactions."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="VERIFIED">Verified</option>
            <option value="BOUNCED">Bounced</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'payment_number', title: 'Payment #', render: (val) => <span className="font-bold text-[#172B4D]">{val}</span> },
          { 
            key: 'customer_id', 
            title: 'Customer', 
            render: (cid) => {
              const c = allCustomers.find(cust => cust.id === cid)
              return <span className="font-medium text-gray-700">{c?.legal_name || cid?.split('-')[0]}</span>
            }
          },
          { 
            key: 'invoice_id', 
            title: 'Applied Invoice',
            render: (iid) => {
              if (!iid) return <span className="text-gray-400">Unapplied</span>
              const inv = allInvoices.find(i => i.id === iid)
              return <span className="font-bold text-[#0052CC]">{inv?.invoice_number || iid?.split('-')[0]}</span>
            }
          },
          { key: 'payment_date', title: 'Date', render: (d) => d ? formatDate(d) : '-' },
          { key: 'amount', title: 'Amount', render: (v) => <span className="font-black text-emerald-600">₹{parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> },
          { key: 'payment_mode', title: 'Mode', render: (v) => <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">{v?.replace('_', ' ')}</span> },
          { key: 'status', title: 'Status' },
        ]}
        actions={(
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => {
                setPayForm(initialPayForm)
                setEditingId(null)
                setShowCreate(true)
              }} 
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0747A6] text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={14} /> Record payment
            </button>
            <button type="button" onClick={() => setShowReconcile(true)} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#0052CC] text-[#0052CC] text-xs font-bold hover:bg-blue-50 transition-all">
              Manual reconcile
            </button>
          </div>
        )}
        rowActions={(row) => (
          <>
            <button 
              type="button" 
              onClick={() => {
                setPayForm(row)
                setEditingId(row.id)
                setShowCreate(true)
              }} 
              className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button 
              type="button" 
              onClick={() => window.confirm('Delete this payment record?') && deletePayment.mutate(row.id, { onSuccess: refetch })} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            {row.status === 'RECEIVED' && (
              <button type="button" disabled={verify.isPending} onClick={() => verify.mutate(row.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg disabled:opacity-50" title="Verify">
                <CheckCircle2 size={16} />
              </button>
            )}
            {row.status !== 'BOUNCED' && (
              <button type="button" disabled={bounce.isPending} onClick={() => window.confirm('Mark this payment as bounced?') && bounce.mutate(row.id)} className="p-2 text-gray-400 hover:text-orange-600 rounded-lg disabled:opacity-50" title="Bounce">
                <XCircle size={16} />
              </button>
            )}
            {row.status === 'VERIFIED' && (
              <button
                type="button"
                disabled={autoReconcile.isPending}
                onClick={() => autoReconcile.mutate(row.id)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg disabled:opacity-50"
                title="Auto Reconcile"
              >
                <GitMerge size={16} />
              </button>
            )}
          </>
        )}
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-[#172B4D] tracking-tight">{editingId ? 'Edit customer payment' : 'Record customer payment'}</h3>
              <p className="text-xs text-gray-500 font-medium">Please provide accurate payment details for financial reconciliation.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment #</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Enter payment number" value={payForm.payment_number} onChange={(e) => setPayForm({ ...payForm, payment_number: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={payForm.customer_id}
                  onChange={(e) => setPayForm({ ...payForm, customer_id: e.target.value })}
                >
                  <option value="">Select a customer...</option>
                  {allCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.legal_name || c.customer_code || c.id.slice(-6)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Mode</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={payForm.payment_mode} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={payForm.status} onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}>
                  <option value="RECEIVED">Received</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="BOUNCED">Bounced</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference Number</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="TXN ID / Cheque #" value={payForm.reference_number} onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Name</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Bank branch name" value={payForm.bank_name} onChange={(e) => setPayForm({ ...payForm, bank_name: e.target.value })} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice (Optional)</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={payForm.invoice_id}
                  onChange={(e) => setPayForm({ ...payForm, invoice_id: e.target.value })}
                >
                  <option value="">Select an invoice to apply payment to...</option>
                  {allInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.total_amount} ({inv.status})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[80px]" placeholder="Add any additional remarks..." value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                disabled={createPayment.isPending || updatePayment.isPending}
                onClick={() => {
                  const payload = { ...payForm }
                  if (!payload.invoice_id) delete payload.invoice_id
                  
                  if (editingId) {
                    updatePayment.mutate({ id: editingId, data: payload }, { onSuccess: () => { setShowCreate(false); refetch() } })
                  } else {
                    createPayment.mutate(payload, { onSuccess: () => { setShowCreate(false); refetch() } })
                  }
                }}
              >
                {editingId ? 'Update Payment' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReconcile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-white/20">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-[#172B4D]">Manual reconcile</h3>
              <p className="text-xs text-gray-500 font-medium">Link a verified payment to an outstanding invoice manually.</p>
            </div>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Payment</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={recForm.customer_payment_id} 
                  onChange={(e) => setRecForm({ ...recForm, customer_payment_id: e.target.value })}
                >
                  <option value="">Select a verified payment...</option>
                  {rows.filter(r => r.status === 'VERIFIED').map(r => (
                    <option key={r.id} value={r.id}>{r.payment_number} | {r.amount} | {r.payment_date}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Invoice</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={recForm.invoice_id} 
                  onChange={(e) => setRecForm({ ...recForm, invoice_id: e.target.value })}
                >
                  <option value="">Select an invoice...</option>
                  {allInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_number} | {inv.total_amount} | {inv.status}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount to Apply</label>
                <input 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                  type="number" 
                  placeholder="0.00" 
                  value={recForm.amount_applied} 
                  onChange={(e) => setRecForm({ ...recForm, amount_applied: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowReconcile(false)}>Cancel</button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                disabled={reconcile.isPending}
                onClick={() => reconcile.mutate({
                  customer_payment_id: recForm.customer_payment_id,
                  invoice_id: recForm.invoice_id,
                  amount_applied: recForm.amount_applied,
                }, { onSuccess: () => { setShowReconcile(false); refetch() } })}
              >
                Apply Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
