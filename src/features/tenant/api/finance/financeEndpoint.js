import axiosInstance from '../axiosInstance'

const INV_BASE = '/api/v1/finance/invoices'
const PAY_BASE = '/api/v1/finance/payments'
const CPAY_BASE = `${PAY_BASE}/customer-payments`
const OPAY_BASE = `${PAY_BASE}/owner-payments`
const REC_BASE = `${PAY_BASE}/reconciliations`
const PRL_BASE = '/api/v1/finance/payroll'
const TDS_BASE = '/api/v1/finance/tds'
const ADV_BASE = '/api/v1/finance/advances'
const REP_BASE = '/api/v1/finance/reports'
const PER_BASE = '/api/v1/finance/periods'
const LED_BASE = '/api/v1/finance/ledger'
const SET_BASE = '/api/v1/finance/settlement'
const EXP_BASE = '/api/v1/finance/expenses'

export const invoiceApi = {
  list: (params) => axiosInstance.get(`${INV_BASE}/invoices/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${INV_BASE}/invoices/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${INV_BASE}/invoices/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${INV_BASE}/invoices/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${INV_BASE}/invoices/${id}/`).then(r => r.data),
  post: (id) => axiosInstance.post(`${INV_BASE}/invoices/${id}/post-invoice/`).then(r => r.data),
  cancel: (id) => axiosInstance.post(`${INV_BASE}/invoices/${id}/cancel/`).then(r => r.data),
  markOverdue: (id) => axiosInstance.post(`${INV_BASE}/invoices/${id}/mark-overdue/`).then(r => r.data),
  applyCreditNote: (id, credit_note_id) => axiosInstance.post(`${INV_BASE}/invoices/${id}/apply-credit-note/`, { credit_note_id }).then(r => r.data),
  generateFromTrip: (tripId) => axiosInstance.post(`${INV_BASE}/invoices/generate-from-trip/`, { trip_id: tripId }).then(r => r.data),
  generateConsolidated: (data) => axiosInstance.post(`${INV_BASE}/invoices/generate-consolidated/`, data).then(r => r.data),
  eligibleTrips: (params) => axiosInstance.get(`${INV_BASE}/invoices/eligible-trips/`, { params }).then(r => r.data),
}

export const invoiceLineItemApi = {
  list: (params) => axiosInstance.get(`${INV_BASE}/invoice-line-items/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${INV_BASE}/invoice-line-items/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${INV_BASE}/invoice-line-items/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${INV_BASE}/invoice-line-items/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${INV_BASE}/invoice-line-items/${id}/`).then(r => r.data),
}

export const creditNoteApi = {
  list: (params) => axiosInstance.get(`${INV_BASE}/credit-notes/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${INV_BASE}/credit-notes/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${INV_BASE}/credit-notes/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${INV_BASE}/credit-notes/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${INV_BASE}/credit-notes/${id}/`).then(r => r.data),
}

export const customerPaymentApi = {
  list: (params) => axiosInstance.get(`${CPAY_BASE}/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${CPAY_BASE}/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${CPAY_BASE}/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${CPAY_BASE}/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${CPAY_BASE}/${id}/`).then(r => r.data),
  verify: (id) => axiosInstance.post(`${CPAY_BASE}/${id}/verify/`).then(r => r.data),
  bounce: (id) => axiosInstance.post(`${CPAY_BASE}/${id}/bounce/`).then(r => r.data),
  autoReconcile: (id) => axiosInstance.post(`${CPAY_BASE}/${id}/auto-reconcile/`).then(r => r.data),
}

export const ownerPaymentApi = {
  list: (params) => axiosInstance.get(`${OPAY_BASE}/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${OPAY_BASE}/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${OPAY_BASE}/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${OPAY_BASE}/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${OPAY_BASE}/${id}/`).then(r => r.data),
  approve: (id) => axiosInstance.post(`${OPAY_BASE}/${id}/approve/`).then(r => r.data),
  markPaid: (id) => axiosInstance.post(`${OPAY_BASE}/${id}/mark-paid/`).then(r => r.data),
}

export const reconciliationApi = {
  list: (params) => axiosInstance.get(`${REC_BASE}/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${REC_BASE}/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${REC_BASE}/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${REC_BASE}/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${REC_BASE}/${id}/`).then(r => r.data),
  reconcile: (data) => axiosInstance.post(`${REC_BASE}/reconcile/`, data).then(r => r.data),
}

export const payrollApi = {
  // Periods
  listPeriods: (params) => axiosInstance.get(`${PRL_BASE}/periods/`, { params }).then(r => r.data),
  getPeriod: (id) => axiosInstance.get(`${PRL_BASE}/periods/${id}/`).then(r => r.data),
  createPeriod: (data) => axiosInstance.post(`${PRL_BASE}/periods/`, data).then(r => r.data),
  updatePeriod: (id, data) => axiosInstance.patch(`${PRL_BASE}/periods/${id}/`, data).then(r => r.data),
  deletePeriod: (id) => axiosInstance.delete(`${PRL_BASE}/periods/${id}/`).then(r => r.data),
  
  generateEntries: (id) => axiosInstance.post(`${PRL_BASE}/periods/${id}/generate-entries/`).then(r => r.data),
  closePeriod: (id) => axiosInstance.post(`${PRL_BASE}/periods/${id}/close-period/`).then(r => r.data),
  markAllPaid: (id) => axiosInstance.post(`${PRL_BASE}/periods/${id}/mark-all-paid/`).then(r => r.data),

  // Entries
  listEntries: (params) => axiosInstance.get(`${PRL_BASE}/entries/`, { params }).then(r => r.data),
  getEntry: (id) => axiosInstance.get(`${PRL_BASE}/entries/${id}/`).then(r => r.data),
  createEntry: (data) => axiosInstance.post(`${PRL_BASE}/entries/`, data).then(r => r.data),
  updateEntry: (id, data) => axiosInstance.patch(`${PRL_BASE}/entries/${id}/`, data).then(r => r.data),
  deleteEntry: (id) => axiosInstance.delete(`${PRL_BASE}/entries/${id}/`).then(r => r.data),
  markEntryPaid: (id) => axiosInstance.post(`${PRL_BASE}/entries/${id}/mark-paid/`).then(r => r.data),

  // Deductions
  listDeductions: (params) => axiosInstance.get(`${PRL_BASE}/deductions/`, { params }).then(r => r.data),
  getDeduction: (id) => axiosInstance.get(`${PRL_BASE}/deductions/${id}/`).then(r => r.data),
  createDeduction: (data) => axiosInstance.post(`${PRL_BASE}/deductions/`, data).then(r => r.data),
  updateDeduction: (id, data) => axiosInstance.patch(`${PRL_BASE}/deductions/${id}/`, data).then(r => r.data),
  deleteDeduction: (id) => axiosInstance.delete(`${PRL_BASE}/deductions/${id}/`).then(r => r.data),
}

export const tdsApi = {
  listEntries: (params) => axiosInstance.get(`${TDS_BASE}/entries/`, { params }).then(r => r.data),
  getEntry: (id) => axiosInstance.get(`${TDS_BASE}/entries/${id}/`).then(r => r.data),
  createEntry: (data) => axiosInstance.post(`${TDS_BASE}/entries/`, data).then(r => r.data),
  updateEntry: (id, data) => axiosInstance.patch(`${TDS_BASE}/entries/${id}/`, data).then(r => r.data),
  deleteEntry: (id) => axiosInstance.delete(`${TDS_BASE}/entries/${id}/`).then(r => r.data),
  
  listReturns: (params) => axiosInstance.get(`${TDS_BASE}/quarterly-returns/`, { params }).then(r => r.data),
  getReturn: (id) => axiosInstance.get(`${TDS_BASE}/quarterly-returns/${id}/`).then(r => r.data),
  createReturn: (data) => axiosInstance.post(`${TDS_BASE}/quarterly-returns/`, data).then(r => r.data),
  updateReturn: (id, data) => axiosInstance.patch(`${TDS_BASE}/quarterly-returns/${id}/`, data).then(r => r.data),
  deleteReturn: (id) => axiosInstance.delete(`${TDS_BASE}/quarterly-returns/${id}/`).then(r => r.data),
  
  issueCertificate: (id, tds_certificate_number) =>
    axiosInstance.post(`${TDS_BASE}/entries/${id}/issue-certificate/`, { tds_certificate_number }).then(r => r.data),
  markEntryPaid: (id) => axiosInstance.post(`${TDS_BASE}/entries/${id}/mark-paid/`).then(r => r.data),
  fileReturn: (data) => axiosInstance.post(`${TDS_BASE}/quarterly-returns/file-return/`, data).then(r => r.data),
  markReturnPaid: (id) => axiosInstance.post(`${TDS_BASE}/quarterly-returns/${id}/mark-paid/`).then(r => r.data),
}

export const advanceApi = {
  list: (params) => axiosInstance.get(`${ADV_BASE}/requests/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${ADV_BASE}/requests/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${ADV_BASE}/requests/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${ADV_BASE}/requests/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${ADV_BASE}/requests/${id}/`).then(r => r.data),
  
  approve: (id) => axiosInstance.post(`${ADV_BASE}/requests/${id}/approve/`).then(r => r.data),
  reject: (id, rejection_reason) => axiosInstance.post(`${ADV_BASE}/requests/${id}/reject/`, { rejection_reason }).then(r => r.data),
  disburse: (id) => axiosInstance.post(`${ADV_BASE}/requests/${id}/disburse/`).then(r => r.data),
  settle: (id, data) => axiosInstance.post(`${ADV_BASE}/requests/${id}/settle/`, data || {}).then(r => r.data),
  
  listCategories: (params) => axiosInstance.get(`${ADV_BASE}/categories/`, { params }).then(r => r.data),
  createCategory: (data) => axiosInstance.post(`${ADV_BASE}/categories/`, data).then(r => r.data),
  updateCategory: (id, data) => axiosInstance.patch(`${ADV_BASE}/categories/${id}/`, data).then(r => r.data),
  deleteCategory: (id) => axiosInstance.delete(`${ADV_BASE}/categories/${id}/`).then(r => r.data),
  listDisbursements: (params) => axiosInstance.get(`${ADV_BASE}/disbursements/`, { params }).then(r => r.data),
  listRepayments: (params) => axiosInstance.get(`${ADV_BASE}/repayments/`, { params }).then(r => r.data),
  listApprovals: (params) => axiosInstance.get(`${ADV_BASE}/approvals/`, { params }).then(r => r.data),
}

export const financeReportApi = {
  dashboard: () => axiosInstance.get(`${REP_BASE}/dashboard/`).then(r => r.data),
  customerLedger: (customerId) => axiosInstance.get(`${REP_BASE}/customer-ledger/${customerId}/`).then(r => r.data),
  arAging: (params) => axiosInstance.get(`${REP_BASE}/ar-aging/`, { params }).then(r => r.data),
  ownerPayables: (params) => axiosInstance.get(`${REP_BASE}/owner-payables/`, { params }).then(r => r.data),
  tripProfitability: (params) => axiosInstance.get(`${REP_BASE}/trip-profitability/`, { params }).then(r => r.data),
  tdsRegister: (params) => axiosInstance.get(`${REP_BASE}/tds-register/`, { params }).then(r => r.data),
  driverProfit: (params) => axiosInstance.get(`${REP_BASE}/driver-profit/`, { params }).then(r => r.data),
  advanceOutstanding: (params) => axiosInstance.get(`${REP_BASE}/advance-outstanding/`, { params }).then(r => r.data),
  monthlyPnl: (params) => axiosInstance.get(`${REP_BASE}/monthly-pnl/`, { params }).then(r => r.data),
  cashFlow: (params) => axiosInstance.get(`${REP_BASE}/cash-flow/`, { params }).then(r => r.data),
  customerOutstanding: (params) => axiosInstance.get(`${REP_BASE}/customer-outstanding/`, { params }).then(r => r.data),
  lrRevenueVsCost: (params) => axiosInstance.get(`${REP_BASE}/lr-revenue-vs-cost/`, { params }).then(r => r.data),
  invoiceCollection: (params) => axiosInstance.get(`${REP_BASE}/invoice-collection/`, { params }).then(r => r.data),
  payrollRegister: (params) => axiosInstance.get(`${REP_BASE}/payroll-register/`, { params }).then(r => r.data),
}

export const tripLookupApi = {
  list: (params) => axiosInstance.get('/api/v1/trips/', { params }).then(r => r.data),
}

export const financePeriodApi = {
  list: (params) => axiosInstance.get(`${PER_BASE}/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${PER_BASE}/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${PER_BASE}/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${PER_BASE}/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${PER_BASE}/${id}/`).then(r => r.data),
  close: (id) => axiosInstance.post(`${PER_BASE}/${id}/close/`).then(r => r.data),
}

export const ledgerApi = {
  listAccounts: (params) => axiosInstance.get(`${LED_BASE}/accounts/`, { params }).then(r => r.data),
  getAccount: (id) => axiosInstance.get(`${LED_BASE}/accounts/${id}/`).then(r => r.data),
  listJournalEntries: (params) => axiosInstance.get(`${LED_BASE}/journal-entries/`, { params }).then(r => r.data),
  getJournalEntry: (id) => axiosInstance.get(`${LED_BASE}/journal-entries/${id}/`).then(r => r.data),
  createJournalEntry: (data) => axiosInstance.post(`${LED_BASE}/journal-entries/`, data).then(r => r.data),
  deleteJournalEntry: (id) => axiosInstance.delete(`${LED_BASE}/journal-entries/${id}/`).then(r => r.data),
}

export const settlementApi = {
  getLrSettlement: (tripId) => axiosInstance.get(`${SET_BASE}/lr/${tripId}/`).then(r => r.data),
  finalizeTrip: (tripId) => axiosInstance.post(`${SET_BASE}/trip/${tripId}/finalize/`).then(r => r.data),
  finalizeDriver: (driverId, data) => axiosInstance.post(`${SET_BASE}/driver/${driverId}/finalize/`, data).then(r => r.data),
}

export const expenseApi = {
  list: (params) => axiosInstance.get(`${EXP_BASE}/`, { params }).then(r => r.data),
  get: (id) => axiosInstance.get(`${EXP_BASE}/${id}/`).then(r => r.data),
  create: (data) => axiosInstance.post(`${EXP_BASE}/`, data).then(r => r.data),
  update: (id, data) => axiosInstance.patch(`${EXP_BASE}/${id}/`, data).then(r => r.data),
  delete: (id) => axiosInstance.delete(`${EXP_BASE}/${id}/`).then(r => r.data),
  submit: (id) => axiosInstance.post(`${EXP_BASE}/${id}/submit/`).then(r => r.data),
  approve: (id, data) => axiosInstance.post(`${EXP_BASE}/${id}/approve/`, data || {}).then(r => r.data),
  reject: (id, rejection_reason) => axiosInstance.post(`${EXP_BASE}/${id}/reject/`, { rejection_reason }).then(r => r.data),
  settle: (id, data) => axiosInstance.post(`${EXP_BASE}/${id}/settle/`, data || {}).then(r => r.data),
  byTrip: (tripId) => axiosInstance.get(`${EXP_BASE}/by-trip/${tripId}/`).then(r => r.data),
  byVehicle: (vehicleId) => axiosInstance.get(`${EXP_BASE}/by-vehicle/${vehicleId}/`).then(r => r.data),
}
