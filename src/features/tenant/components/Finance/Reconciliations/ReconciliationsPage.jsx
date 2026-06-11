import React, { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'

import FinanceListPage from '../Common/FinanceListPage'
import ReconcileModal from './ReconcileModal'
import { useReconciliations, useInvoices, useCustomerPayments, useDeleteReconciliation } from '../../../queries/finance/financeQuery'
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export default function ReconciliationsPage() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  
  const params = useMemo(() => (search ? { search } : {}), [search])
  const { data, isLoading, refetch } = useReconciliations(params)
  const { mutate: deleteRecon } = useDeleteReconciliation()
  
  // Fetch lists to map UUIDs into readable names
  const { data: invData } = useInvoices({ limit: 500 })
  const { data: payData } = useCustomerPayments({ limit: 500 })
  
  const rows = asList(data)
  const invoices = asList(invData)
  const payments = asList(payData)

  const renderAmount = (amount) => (
    <span className="font-black text-emerald-600">
      ₹{parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </span>
  )

  const renderDate = (d) => (
    <span className="font-medium text-gray-700">{d ? formatDate(d) : '-'}</span>
  )

  // Helper to map UI names from the fetched lists
  const renderMappedId = (id, type) => {
    if (!id) return '-'
    let readable = null
    
    if (type === 'invoice') {
      const inv = invoices.find(i => i.id === id)
      readable = inv?.invoice_number
    } else if (type === 'payment') {
      const pay = payments.find(p => p.id === id)
      readable = pay?.reference_number || (pay?.id ? `PAY-${pay.id.split('-')[0].toUpperCase()}` : null)
    }

    const displayVal = readable || id.split('-')[0]
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]" title={readable || id}>
          {displayVal}
        </span>
        {!readable && (
           <span className="text-[9px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded font-mono uppercase tracking-tighter">ID</span>
        )}
      </div>
    )
  }

  return (
    <>
      <ReconcileModal 
        isOpen={isModalOpen} 
        editData={editData}
        onClose={() => {
          setIsModalOpen(false)
          setEditData(null)
        }} 
      />
      
      <FinanceListPage
        title="Payment Reconciliations"
        subtitle="Customer payment allocations to invoices."
        search={search}
        setSearch={setSearch}
        onRefresh={refetch}
        isLoading={isLoading}
        stats={[{ label: 'Reconciled Records', value: data?.count ?? rows.length, className: 'text-blue-600' }]}
        actions={
          <button 
            onClick={() => {
              setEditData(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#0052CC] hover:bg-blue-700 shadow-sm transition-all shadow-blue-500/20"
          >
            <Plus size={16} /> Reconcile Payment
          </button>
        }
        rows={rows}
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditData(row)
                setIsModalOpen(true)
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Delete this reconciliation?')) {
                  deleteRecon(row.id)
                }
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        columns={[
          { key: 'id', title: 'Recon ID', render: (val) => <span className="font-mono text-xs text-gray-500 uppercase">{val?.split('-')[0]}</span> },
          { key: 'invoice_id', title: 'Invoice', render: (val) => renderMappedId(val, 'invoice') },
          { key: 'customer_payment', title: 'Payment Ref', render: (val) => renderMappedId(val, 'payment') },
          { key: 'amount_applied', title: 'Amount Applied', render: renderAmount },
          { key: 'reconciled_date', title: 'Date', render: renderDate },
        ]}
      />
    </>
  )
}
