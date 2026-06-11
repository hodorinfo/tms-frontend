import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import {
  advanceApi,
  creditNoteApi,
  customerPaymentApi,
  expenseApi,
  financePeriodApi,
  financeReportApi,
  invoiceLineItemApi,
  invoiceApi,
  ledgerApi,
  ownerPaymentApi,
  payrollApi,
  reconciliationApi,
  settlementApi,
  tripLookupApi,
  tdsApi,
} from '../../api/finance/financeEndpoint'
import { formatApiError } from '../../components/Finance/Common/financeUtils'

export const financeKeys = {
  invoices: (params) => ['finance', 'invoices', params],
  invoiceDetail: (id) => ['finance', 'invoiceDetail', id],
  invoiceLineItems: (params) => ['finance', 'invoiceLineItems', params],
  creditNotes: (params) => ['finance', 'creditNotes', params],
  customerPayments: (params) => ['finance', 'customerPayments', params],
  ownerPayments: (params) => ['finance', 'ownerPayments', params],
  payrollPeriods: (params) => ['finance', 'payrollPeriods', params],
  payrollEntries: (params) => ['finance', 'payrollEntries', params],
  payrollDeductions: (params) => ['finance', 'payrollDeductions', params],
  tdsEntries: (params) => ['finance', 'tdsEntries', params],
  tdsReturns: (params) => ['finance', 'tdsReturns', params],
  advances: (params) => ['finance', 'advances', params],
  reports: (name, params) => ['finance', 'reports', name, params],
  tripsLookup: (params) => ['finance', 'tripsLookup', params],
  invoiceEligibleTrips: (params) => ['finance', 'invoiceEligibleTrips', params],
  financePeriods: (params) => ['finance', 'financePeriods', params],
  ledgerAccounts: (params) => ['finance', 'ledgerAccounts', params],
  journalEntries: (params) => ['finance', 'journalEntries', params],
  journalEntryDetail: (id) => ['finance', 'journalEntryDetail', id],
  lrSettlement: (tripId) => ['finance', 'lrSettlement', tripId],
  reconciliations: (params) => ['finance', 'reconciliations', params],
  expenses: (params) => ['finance', 'expenses', params],
  expenseDetail: (id) => ['finance', 'expenseDetail', id],
  tripSettlement: (tripId) => ['finance', 'tripSettlement', tripId],
  expensesByTrip: (tripId) => ['finance', 'expensesByTrip', tripId],
  expensesByVehicle: (vehicleId) => ['finance', 'expensesByVehicle', vehicleId],
}

const onErr = (label) => (error) => {
  const status = error?.response?.status
  let msg = formatApiError(error?.response?.data) || error.message || 'Request failed'
  if (status >= 500 && (msg === 'Request failed' || msg.includes('Server error'))) {
    msg = 'Server error — please try again.'
  }
  toast.error(`${label}: ${msg}`, { duration: 7000 })
}

export const useInvoices = (params) => useQuery({ queryKey: financeKeys.invoices(params), queryFn: () => invoiceApi.list(params) })
export const useInvoiceDetail = (id) => useQuery({
  queryKey: financeKeys.invoiceDetail(id),
  queryFn: () => invoiceApi.get(id),
  enabled: !!id,
})
export const useInvoiceLineItems = (params) =>
  useQuery({ queryKey: financeKeys.invoiceLineItems(params), queryFn: () => invoiceLineItemApi.list(params) })
export const useCreditNotes = (params) =>
  useQuery({ queryKey: financeKeys.creditNotes(params), queryFn: () => creditNoteApi.list(params) })
export const useCustomerPayments = (params) => useQuery({ queryKey: financeKeys.customerPayments(params), queryFn: () => customerPaymentApi.list(params) })
export const useOwnerPayments = (params) => useQuery({ queryKey: financeKeys.ownerPayments(params), queryFn: () => ownerPaymentApi.list(params) })
export const usePayrollPeriods = (params) => useQuery({ queryKey: financeKeys.payrollPeriods(params), queryFn: () => payrollApi.listPeriods(params) })
export const usePayrollEntries = (params) => useQuery({ queryKey: financeKeys.payrollEntries(params), queryFn: () => payrollApi.listEntries(params) })
export const usePayrollDeductions = (params) => useQuery({ queryKey: financeKeys.payrollDeductions(params), queryFn: () => payrollApi.listDeductions(params) })
export const useTDSEntries = (params) => useQuery({ queryKey: financeKeys.tdsEntries(params), queryFn: () => tdsApi.listEntries(params) })
export const useTDSReturns = (params) => useQuery({ queryKey: financeKeys.tdsReturns(params), queryFn: () => tdsApi.listReturns(params) })
export const useAdvances = (params) => useQuery({ queryKey: financeKeys.advances(params), queryFn: () => advanceApi.list(params) })
export const useTripsLookup = (params) =>
  useQuery({ queryKey: financeKeys.tripsLookup(params), queryFn: () => tripLookupApi.list(params) })
export const useInvoiceEligibleTrips = (params) =>
  useQuery({ queryKey: financeKeys.invoiceEligibleTrips(params), queryFn: () => invoiceApi.eligibleTrips(params) })
export const useARAgingReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('arAging', params), queryFn: () => financeReportApi.arAging(params) })
export const useOwnerPayablesReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('ownerPayables', params), queryFn: () => financeReportApi.ownerPayables(params) })
export const useTripProfitabilityReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('tripProfitability', params), queryFn: () => financeReportApi.tripProfitability(params) })
export const useTDSRegisterReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('tdsRegister', params), queryFn: () => financeReportApi.tdsRegister(params) })
export const useFinanceDashboard = () =>
  useQuery({ queryKey: ['finance', 'dashboard'], queryFn: () => financeReportApi.dashboard() })
export const useCustomerLedger = (customerId) =>
  useQuery({
    queryKey: ['finance', 'customerLedger', customerId],
    queryFn: () => financeReportApi.customerLedger(customerId),
    enabled: !!customerId,
  })
export const useMonthlyPnLReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('monthlyPnl', params), queryFn: () => financeReportApi.monthlyPnl(params) })
export const useCashFlowReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('cashFlow', params), queryFn: () => financeReportApi.cashFlow(params) })
export const useCustomerOutstandingReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('customerOutstanding', params), queryFn: () => financeReportApi.customerOutstanding(params) })
export const useLRRevenueVsCostReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('lrRevenueVsCost', params), queryFn: () => financeReportApi.lrRevenueVsCost(params) })
export const useInvoiceCollectionReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('invoiceCollection', params), queryFn: () => financeReportApi.invoiceCollection(params) })
export const usePayrollRegisterReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('payrollRegister', params), queryFn: () => financeReportApi.payrollRegister(params) })
export const useAdvanceOutstandingReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('advanceOutstanding', params), queryFn: () => financeReportApi.advanceOutstanding(params) })
export const useDriverProfitReport = (params) =>
  useQuery({ queryKey: financeKeys.reports('driverProfit', params), queryFn: () => financeReportApi.driverProfit(params) })
export const useAdvanceDetail = (id) => useQuery({
  queryKey: ['finance', 'advanceDetail', id],
  queryFn: () => advanceApi.get(id),
  enabled: !!id,
})
export const useAdvanceCategories = () =>
  useQuery({ queryKey: ['finance', 'advanceCategories'], queryFn: () => advanceApi.listCategories({ page_size: 200 }) })
export const useAdvanceDisbursements = (params) =>
  useQuery({ queryKey: ['finance', 'advanceDisbursements', params], queryFn: () => advanceApi.listDisbursements(params) })
export const useAdvanceRepayments = (params) =>
  useQuery({ queryKey: ['finance', 'advanceRepayments', params], queryFn: () => advanceApi.listRepayments(params) })
export const useAdvanceApprovals = (params) =>
  useQuery({ queryKey: ['finance', 'advanceApprovals', params], queryFn: () => advanceApi.listApprovals(params) })

export const useFinancePeriods = (params) =>
  useQuery({ queryKey: financeKeys.financePeriods(params), queryFn: () => financePeriodApi.list(params) })
export const useLedgerAccounts = (params) =>
  useQuery({ queryKey: financeKeys.ledgerAccounts(params), queryFn: () => ledgerApi.listAccounts(params) })
export const useJournalEntries = (params) =>
  useQuery({ queryKey: financeKeys.journalEntries(params), queryFn: () => ledgerApi.listJournalEntries(params) })
export const useJournalEntryDetail = (id) =>
  useQuery({
    queryKey: financeKeys.journalEntryDetail(id),
    queryFn: () => ledgerApi.getJournalEntry(id),
    enabled: !!id,
  })
export const useCreateJournalEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ledgerApi.createJournalEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'journalEntries'] })
      qc.invalidateQueries({ queryKey: ['finance', 'ledgerAccounts'] })
      toast.success('Journal entry posted')
    },
    onError: onErr('Could not post journal entry'),
  })
}
export const useLRSettlement = (tripId) =>
  useQuery({
    queryKey: financeKeys.lrSettlement(tripId),
    queryFn: () => settlementApi.getLrSettlement(tripId),
    enabled: !!tripId,
  })
export const useReconciliations = (params) =>
  useQuery({ queryKey: financeKeys.reconciliations(params), queryFn: () => reconciliationApi.list(params) })
export const useExpenses = (params) =>
  useQuery({ queryKey: financeKeys.expenses(params), queryFn: () => expenseApi.list(params) })
export const useExpensesByTrip = (tripId, options = {}) =>
  useQuery({
    queryKey: financeKeys.expensesByTrip(tripId),
    queryFn: () => expenseApi.byTrip(tripId),
    enabled: !!tripId && (options.enabled !== false),
    ...options,
  })
export const useExpensesByVehicle = (vehicleId, options = {}) =>
  useQuery({
    queryKey: financeKeys.expensesByVehicle(vehicleId),
    queryFn: () => expenseApi.byVehicle(vehicleId),
    enabled: !!vehicleId && (options.enabled !== false),
    ...options,
  })
export const useExpenseDetail = (id) =>
  useQuery({ queryKey: financeKeys.expenseDetail(id), queryFn: () => expenseApi.get(id), enabled: !!id })
export const useTripSettlement = (tripId) =>
  useQuery({ queryKey: financeKeys.tripSettlement(tripId), queryFn: () => settlementApi.getLrSettlement(tripId), enabled: !!tripId })

export const useCreateInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Invoice created')
    },
    onError: onErr('Could not create invoice'),
  })
}
export const useUpdateInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => invoiceApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: financeKeys.invoiceDetail(vars.id) })
      toast.success('Invoice updated')
    },
    onError: onErr('Could not update invoice'),
  })
}
export const useCreateCreditNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: creditNoteApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'creditNotes'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Credit note created')
    },
    onError: onErr('Could not create credit note'),
  })
}
export const useCreateCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'reconciliations'] })
      toast.success('Payment recorded')
    },
    onError: onErr('Could not create payment'),
  })
}
export const useCreateOwnerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ownerPaymentApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      toast.success('Owner payment created')
    },
    onError: onErr('Could not create owner payment'),
  })
}
export const useCreateAdvanceRequest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance request created')
    },
    onError: onErr('Could not create advance'),
  })
}
export const useCreateFinancePeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: financePeriodApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'financePeriods'] })
      toast.success('Finance period created')
    },
    onError: onErr('Could not create period'),
  })
}
export const useCloseFinancePeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: financePeriodApi.close,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'financePeriods'] })
      toast.success('Period closed')
    },
    onError: onErr('Could not close period'),
  })
}

export const useDeleteInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Invoice deleted')
    },
    onError: onErr('Could not delete invoice'),
  })
}

export const useInvoiceLineItemDetail = (id) => useQuery({
  queryKey: ['finance', 'lineItemDetail', id],
  queryFn: () => invoiceLineItemApi.get(id),
  enabled: !!id,
})

export const useCreateInvoiceLineItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceLineItemApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceLineItems'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Line item added')
    },
    onError: onErr('Could not add line item'),
  })
}

export const useUpdateInvoiceLineItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => invoiceLineItemApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceLineItems'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Line item updated')
    },
    onError: onErr('Could not update line item'),
  })
}

export const useDeleteInvoiceLineItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceLineItemApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceLineItems'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Line item deleted')
    },
    onError: onErr('Could not delete line item'),
  })
}

export const useCreditNoteDetail = (id) => useQuery({
  queryKey: ['finance', 'creditNoteDetail', id],
  queryFn: () => creditNoteApi.get(id),
  enabled: !!id,
})

export const useUpdateCreditNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => creditNoteApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'creditNotes'] })
      toast.success('Credit note updated')
    },
    onError: onErr('Could not update credit note'),
  })
}

export const useDeleteCreditNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: creditNoteApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'creditNotes'] })
      toast.success('Credit note deleted')
    },
    onError: onErr('Could not delete credit note'),
  })
}

export const useCustomerPaymentDetail = (id) => useQuery({
  queryKey: ['finance', 'customerPaymentDetail', id],
  queryFn: () => customerPaymentApi.get(id),
  enabled: !!id,
})

export const useUpdateCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => customerPaymentApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      toast.success('Payment updated')
    },
    onError: onErr('Could not update payment'),
  })
}

export const useDeleteCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      toast.success('Payment deleted')
    },
    onError: onErr('Could not delete payment'),
  })
}

export const useOwnerPaymentDetail = (id) => useQuery({
  queryKey: ['finance', 'ownerPaymentDetail', id],
  queryFn: () => ownerPaymentApi.get(id),
  enabled: !!id,
})

export const useUpdateOwnerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => ownerPaymentApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      toast.success('Owner payment updated')
    },
    onError: onErr('Could not update owner payment'),
  })
}

export const useDeleteOwnerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ownerPaymentApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      toast.success('Owner payment deleted')
    },
    onError: onErr('Could not delete owner payment'),
  })
}

export const useUpdateFinancePeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => financePeriodApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'financePeriods'] })
      toast.success('Period updated')
    },
    onError: onErr('Could not update period'),
  })
}

export const useDeleteFinancePeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: financePeriodApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'financePeriods'] })
      toast.success('Period deleted')
    },
    onError: onErr('Could not delete period'),
  })
}

export const usePostInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.post,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Invoice posted')
    },
    onError: onErr('Could not post invoice'),
  })
}
export const useCancelInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Invoice cancelled')
    },
    onError: onErr('Could not cancel invoice'),
  })
}
export const useMarkInvoiceOverdue = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.markOverdue,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceDetail'] })
      toast.success('Invoice marked overdue')
    },
    onError: onErr('Could not mark overdue'),
  })
}
export const useGenerateInvoiceFromTrip = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.generateFromTrip,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceLineItems'] })
      toast.success('Invoice generated from trip')
    },
    onError: onErr('Could not generate invoice'),
  })
}
export const useGenerateConsolidatedInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: invoiceApi.generateConsolidated,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoiceEligibleTrips'] })
      toast.success('Consolidated invoice generated')
    },
    onError: onErr('Could not generate consolidated invoice'),
  })
}
export const useApplyCreditNoteToInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, creditNoteId }) => invoiceApi.applyCreditNote(id, creditNoteId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: financeKeys.invoiceDetail(vars.id) })
      qc.invalidateQueries({ queryKey: ['finance', 'creditNotes'] })
      toast.success('Credit note applied')
    },
    onError: onErr('Could not apply credit note'),
  })
}
export const useVerifyCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.verify,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'customerPaymentDetail'] })
      toast.success('Customer payment verified')
    },
    onError: onErr('Verification failed'),
  })
}
export const useBounceCustomerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.bounce,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'customerPaymentDetail'] })
      toast.success('Payment marked bounced')
    },
    onError: onErr('Bounce failed'),
  })
}
export const useAutoReconcilePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customerPaymentApi.autoReconcile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Payment auto-reconciled')
    },
    onError: onErr('Auto-reconcile failed'),
  })
}
export const useApproveOwnerPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ownerPaymentApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPaymentDetail'] })
      toast.success('Owner payment approved')
    },
    onError: onErr('Approval failed'),
  })
}
export const useMarkOwnerPaymentPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ownerPaymentApi.markPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'ownerPaymentDetail'] })
      toast.success('Owner payment marked paid')
    },
    onError: onErr('Mark paid failed'),
  })
}
export const useReconcilePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reconciliationApi.reconcile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'reconciliations'] })
      toast.success('Payment reconciled')
    },
    onError: onErr('Reconciliation failed'),
  })
}
export const useUpdateReconciliation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => reconciliationApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'reconciliations'] })
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Reconciliation updated')
    },
    onError: onErr('Update failed'),
  })
}
export const useDeleteReconciliation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reconciliationApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'reconciliations'] })
      qc.invalidateQueries({ queryKey: ['finance', 'customerPayments'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      toast.success('Reconciliation deleted')
    },
    onError: onErr('Delete failed'),
  })
}
export const useApproveExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => expenseApi.approve(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      qc.invalidateQueries({ queryKey: ['finance', 'expensesByTrip'] })
      qc.invalidateQueries({ queryKey: ['finance', 'expensesByVehicle'] })
      toast.success('Expense approved')
    },
    onError: onErr('Could not approve expense'),
  })
}
export const useRejectExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rejection_reason }) => expenseApi.reject(id, rejection_reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'expenses'] })
      qc.invalidateQueries({ queryKey: ['finance', 'expensesByTrip'] })
      qc.invalidateQueries({ queryKey: ['finance', 'expensesByVehicle'] })
      toast.success('Expense rejected')
    },
    onError: onErr('Could not reject expense'),
  })
}
export const useFinalizeTripSettlement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settlementApi.finalizeTrip,
    onSuccess: (_data, tripId) => {
      qc.invalidateQueries({ queryKey: financeKeys.tripSettlement(tripId) })
      toast.success('Trip settlement finalized')
    },
    onError: onErr('Could not finalize trip settlement'),
  })
}
export const useGeneratePayrollEntries = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.generateEntries,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entries generated')
    },
    onError: onErr('Generation failed'),
  })
}
export const useClosePayrollPeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.closePeriod,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      toast.success('Payroll period closed')
    },
    onError: onErr('Could not close period'),
  })
}
export const useMarkAllPayrollPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.markAllPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('All payroll entries marked paid')
    },
    onError: onErr('Could not mark all paid'),
  })
}
export const useMarkPayrollEntryPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.markEntryPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entry marked paid')
    },
    onError: onErr('Could not mark entry paid'),
  })
}
export const usePayrollEntryDetail = (id) => useQuery({
  queryKey: ['finance', 'payrollEntryDetail', id],
  queryFn: () => payrollApi.getEntry(id),
  enabled: !!id,
})
export const useUpdatePayrollEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateEntry(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entry updated')
    },
    onError: onErr('Could not update entry'),
  })
}
export const useDeletePayrollEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.deleteEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entry deleted')
    },
    onError: onErr('Could not delete entry'),
  })
}
export const useCreatePayrollEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.createEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollEntries'] })
      toast.success('Payroll entry created')
    },
    onError: onErr('Could not create entry'),
  })
}
export const useCreatePayrollDeduction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.createDeduction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollDeductions'] })
      toast.success('Deduction created')
    },
    onError: onErr('Could not create deduction'),
  })
}
export const useUpdatePayrollDeduction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateDeduction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollDeductions'] })
      toast.success('Deduction updated')
    },
    onError: onErr('Could not update deduction'),
  })
}
export const useDeletePayrollDeduction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.deleteDeduction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollDeductions'] })
      toast.success('Deduction deleted')
    },
    onError: onErr('Could not delete deduction'),
  })
}
export const useCreatePayrollPeriod = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payrollApi.createPeriod,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payrollPeriods'] })
      toast.success('Payroll period created')
    },
    onError: onErr('Could not create payroll period'),
  })
}
export const useIssueTDSCertificate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tds_certificate_number }) => tdsApi.issueCertificate(id, tds_certificate_number),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('Certificate issued')
    },
    onError: onErr('Could not issue certificate'),
  })
}
export const useFileTDSReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.fileReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('Quarterly return filed')
    },
    onError: onErr('Filing failed'),
  })
}
export const useMarkTDSEntryPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.markEntryPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('TDS entry marked paid')
    },
    onError: onErr('Could not mark TDS entry paid'),
  })
}
export const useMarkTDSReturnPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.markReturnPaid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('TDS return marked paid')
    },
    onError: onErr('Could not mark TDS return paid'),
  })
}

export const useCreateTDSEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.createEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('TDS Entry created')
    },
    onError: onErr('Could not create TDS entry'),
  })
}

export const useUpdateTDSEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => tdsApi.updateEntry(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('TDS Entry updated')
    },
    onError: onErr('Could not update TDS entry'),
  })
}

export const useDeleteTDSEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.deleteEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsEntries'] })
      toast.success('TDS Entry deleted')
    },
    onError: onErr('Could not delete TDS entry'),
  })
}

export const useCreateTDSReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.createReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('Quarterly return created')
    },
    onError: onErr('Could not create quarterly return'),
  })
}

export const useUpdateTDSReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => tdsApi.updateReturn(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('Quarterly return updated')
    },
    onError: onErr('Could not update quarterly return'),
  })
}

export const useDeleteTDSReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tdsApi.deleteReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'tdsReturns'] })
      toast.success('Quarterly return deleted')
    },
    onError: onErr('Could not delete quarterly return'),
  })
}
export const useApproveAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.approve,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance approved')
    },
    onError: onErr('Advance approval failed'),
  })
}
export const useRejectAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rejection_reason }) => advanceApi.reject(id, rejection_reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance rejected')
    },
    onError: onErr('Advance rejection failed'),
  })
}
export const useDisburseAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.disburse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance disbursed')
    },
    onError: onErr('Disbursement failed'),
  })
}
export const useSettleAdvance = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => advanceApi.settle(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advances'] })
      toast.success('Advance settled')
    },
    onError: onErr('Advance settle failed'),
  })
}
export const useCreateAdvanceCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advanceCategories'] })
      toast.success('Category created')
    },
    onError: onErr('Could not create category'),
  })
}
export const useUpdateAdvanceCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => advanceApi.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advanceCategories'] })
      toast.success('Category updated')
    },
    onError: onErr('Could not update category'),
  })
}
export const useDeleteAdvanceCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'advanceCategories'] })
      toast.success('Category deleted')
    },
    onError: onErr('Could not delete category'),
  })
}
