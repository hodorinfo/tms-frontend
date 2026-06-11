import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useApproveExpense, useExpenseDetail, useRejectExpense } from '../../../queries/finance/financeQuery'

export default function ExpenseDetail() {
  const { id } = useParams()
  const [rejectionReason, setRejectionReason] = useState('')
  const { data: expense, isLoading } = useExpenseDetail(id)
  const approveMutation = useApproveExpense()
  const rejectMutation = useRejectExpense()

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading expense...</div>
  if (!expense) return <div className="p-6 text-sm text-red-500">Expense not found.</div>

  const canReject = rejectionReason.trim().length > 0
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h1 className="text-xl font-bold text-[#172B4D]">Expense {expense.expense_number}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <p><span className="text-gray-500">Amount:</span> {expense.amount} {expense.currency}</p>
            <p><span className="text-gray-500">Trip:</span> {expense.trip_id || '-'}</p>
            <p><span className="text-gray-500">Vehicle:</span> {expense.vehicle_id || '-'}</p>
            <p><span className="text-gray-500">Status:</span> {expense.status}</p>
            <p><span className="text-gray-500">Approved by:</span> {expense.approved_by || '-'}</p>
            <p><span className="text-gray-500">Approved at:</span> {expense.approved_at || '-'}</p>
          </div>
          {expense.receipt_url && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Receipt Preview</p>
              <iframe title="receipt-preview" src={expense.receipt_url} className="w-full h-80 rounded-lg border border-gray-200" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-bold text-[#172B4D]">Approval Workflow</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => approveMutation.mutate({ id, data: {} })}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white"
            >
              Approve
            </button>
          </div>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm"
            placeholder="Rejection reason (required)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <button
            type="button"
            disabled={!canReject}
            onClick={() => rejectMutation.mutate({ id, rejection_reason: rejectionReason })}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            Reject
          </button>
          <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
            <p>Audit trail</p>
            <p>Created: {expense.created_at || '-'}</p>
            <p>Submitted/Approved by: {expense.approved_by || '-'}</p>
            <p>Rejected by: {expense.rejected_by || '-'}</p>
            <p>Reason: {expense.rejection_reason || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

