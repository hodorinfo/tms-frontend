import React, { useMemo, useState } from 'react'
import { CheckCircle2, Edit2, Plus, Trash2 } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import {
  useApproveOwnerPayment,
  useCreateOwnerPayment,
  useDeleteOwnerPayment,
  useMarkOwnerPaymentPaid,
  useOwnerPayments,
  useUpdateOwnerPayment,
} from '../../../queries/finance/financeQuery'
import { useTripsLookup } from '../../../queries/finance/financeQuery'
import { useVehicles } from '../../../queries/vehicles/vehicleQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function OwnerPaymentsDashboard() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: vehiclesData } = useVehicles({ page_size: 1000 })
  const { data: tripsData } = useTripsLookup({ page_size: 200 })
  const vehRows = asList(vehiclesData)
  const trips = asList(tripsData)
  const ownerOptions = useMemo(() => {
    const seen = new Set()
    return vehRows.filter(v => v.owner_name).reduce((acc, v) => {
      if (!seen.has(v.owner_name)) {
        seen.add(v.owner_name)
        acc.push(v.owner_name)
      }
      return acc
    }, []).sort()
  }, [vehRows])

  const [editingId, setEditingId] = useState(null)
  
  const initialForm = {
    payment_number: `OP-${Date.now()}`,
    owner_name: '',
    vehicle_id: '',
    trip_id: '',
    order_id: '',
    lr_number: '',
    payment_date: new Date().toISOString().slice(0, 10),
    booked_price: '',
    tds_percentage: '0',
    tds_amount: '0',
    broker_commission: '0',
    advance_deduction: '0',
    net_payable: '',
    amount_paid: '0',
    payment_mode: 'BANK_TRANSFER',
    reference_number: '',
    status: 'PENDING',
    notes: '',
  }

  const [form, setForm] = useState(initialForm)
  const queryParams = useMemo(() => {
    const p = {}
    if (search) p.search = search
    if (status) p.status = status
    return p
  }, [search, status])
  const { data, isLoading, refetch } = useOwnerPayments(queryParams)
  const approve = useApproveOwnerPayment()
  const markPaid = useMarkOwnerPaymentPaid()
  const createOwner = useCreateOwnerPayment()
  const updateOwner = useUpdateOwnerPayment()
  const deleteOwner = useDeleteOwnerPayment()
  const rows = asList(data)
  const stats = useMemo(() => ([
    { label: 'Total', value: data?.count || rows.length, className: 'text-blue-600' },
    { label: 'Pending', value: rows.filter((r) => r.status === 'PENDING').length, className: 'text-amber-600' },
    { label: 'Approved', value: rows.filter((r) => r.status === 'APPROVED').length, className: 'text-indigo-600' },
    { label: 'Paid', value: rows.filter((r) => r.status === 'PAID').length, className: 'text-green-600' },
  ]), [data?.count, rows])

  return (
    <>
      <FinanceListPage
        title="Owner Payments"
        subtitle="Control owner payables, approvals, and payout completion."
        search={search}
        setSearch={setSearch}
        secondaryFilters={(
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
          </select>
        )}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={stats}
        rows={rows}
        columns={[
          { key: 'payment_number', title: 'Payment #' },
          { key: 'owner_name', title: 'Owner' },
          { key: 'lr_number', title: 'LR #' },
          {
            key: 'trip_id',
            title: 'Trip',
            render: (tid) => {
              if (!tid) return '-'
              const t = trips.find(tr => tr.id === tid)
              return t ? (t.trip_number || tid.slice(-8).toUpperCase()) : tid.slice(-8).toUpperCase()
            }
          },
          { key: 'booked_price', title: 'Booked', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'broker_commission', title: 'Broker', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'payment_date', title: 'Payment Date' },
          { key: 'net_payable', title: 'Net Payable', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'amount_paid', title: 'Paid', render: (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
          { key: 'status', title: 'Status' },
        ]}
        actions={(
          <button 
            type="button" 
            onClick={() => {
              setForm(initialForm)
              setEditingId(null)
              setShowCreate(true)
            }} 
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0747A6] text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> New owner payment
          </button>
        )}
        rowActions={(row) => (
          <>
            <button 
              type="button" 
              onClick={() => {
                setForm(row)
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
              onClick={() => window.confirm('Delete this payment record?') && deleteOwner.mutate(row.id, { onSuccess: refetch })} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            {row.status === 'PENDING' && (
              <button type="button" disabled={approve.isPending} onClick={() => approve.mutate(row.id)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg disabled:opacity-50" title="Approve">
                <CheckCircle2 size={16} />
              </button>
            )}
            {row.status === 'APPROVED' && (
              <button type="button" disabled={markPaid.isPending} onClick={() => markPaid.mutate(row.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white disabled:opacity-50" title="Mark Paid">
                Mark Paid
              </button>
            )}
          </>
        )}
      />
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black text-[#172B4D] tracking-tight">{editingId ? 'Edit owner payment' : 'Create owner payment'}</h3>
              <p className="text-xs text-gray-500 font-medium">Record and manage payments to vehicle owners and external partners.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment #</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Enter payment number" value={form.payment_number} onChange={(e) => setForm({ ...form, payment_number: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Owner Name</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                >
                  <option value="">Select an owner...</option>
                  {ownerOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle (Optional)</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                >
                  <option value="">Select a vehicle...</option>
                  {vehRows.map(v => (
                    <option key={v.id} value={v.id}>{v.plate_number} {v.owner_name ? `(${v.owner_name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LR Number</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="LR-0001" value={form.lr_number} onChange={(e) => setForm({ ...form, lr_number: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID (LR UUID)</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Order UUID" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Linked Trip (Optional)</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={form.trip_id}
                  onChange={(e) => setForm({ ...form, trip_id: e.target.value })}
                >
                  <option value="">Select a trip...</option>
                  {trips.map(t => {
                    const label = [t.trip_number || t.id.slice(-8).toUpperCase(), t.origin_address, t.destination_address].filter(Boolean).join(' | ')
                    return <option key={t.id} value={t.id}>{label}</option>
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booked Price</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={form.booked_price} onChange={(e) => setForm({ ...form, booked_price: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TDS %</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0" value={form.tds_percentage} onChange={(e) => setForm({ ...form, tds_percentage: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TDS Amount</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={form.tds_amount} onChange={(e) => setForm({ ...form, tds_amount: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Broker Commission</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={form.broker_commission} onChange={(e) => setForm({ ...form, broker_commission: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advance Deduction</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={form.advance_deduction} onChange={(e) => setForm({ ...form, advance_deduction: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Payable</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={form.net_payable} onChange={(e) => setForm({ ...form, net_payable: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount Paid</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" type="number" placeholder="0.00" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Mode</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference Number</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="TXN ID / Cheque #" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[80px]" placeholder="Add any additional remarks..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                type="button"
                className="px-8 py-2.5 rounded-xl bg-[#0052CC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                disabled={createOwner.isPending || updateOwner.isPending}
                onClick={() => {
                  const payload = { ...form }
                  if (!payload.vehicle_id) delete payload.vehicle_id
                  if (!payload.trip_id) delete payload.trip_id
                  
                  if (editingId) {
                    updateOwner.mutate({ id: editingId, data: payload }, { onSuccess: () => { setShowCreate(false); refetch() } })
                  } else {
                    createOwner.mutate(payload, { onSuccess: () => { setShowCreate(false); refetch() } })
                  }
                }}
              >
                {editingId ? 'Update Payment' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
