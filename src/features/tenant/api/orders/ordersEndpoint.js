import axiosInstance from '../axiosInstance'

// ─── 1. PUBLIC / HEALTH ─────────────────────────────────────────────────────

export const orderServiceHealthApi = {
  check: () =>
    axiosInstance.get('health/').then(r => r.data),
}

// ─── 2. ORDERS (LR) ─────────────────────────────────────────────────────────

const BASE_ORDERS = 'api/v1/orders'

export const ordersApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_ORDERS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_ORDERS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_ORDERS}/`, data).then(r => r.data),

  // Supports both PUT and PATCH as per your requirements
  update: (id, data) =>
    axiosInstance.patch(`${BASE_ORDERS}/${id}/`, data).then(r => r.data),

  replace: (id, data) =>
    axiosInstance.put(`${BASE_ORDERS}/${id}/`, data).then(r => r.data),

  cancel: (id) =>
    axiosInstance.post(`${BASE_ORDERS}/${id}/cancel/`).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_ORDERS}/${id}/`).then(r => r.data),

  invoicePdf: (id) =>
    axiosInstance.get(`${BASE_ORDERS}/${id}/invoice-pdf/`, { responseType: 'blob' }),

  assignTrip: (id, data) => {
    const payload = { ...(data || {}) }
    delete payload.trip_number // backend always auto-generates unique trip_number
    return axiosInstance.post(`${BASE_ORDERS}/${id}/assign_trip/`, payload).then(r => r.data)
  },
}

// ─── 3. TRIPS ───────────────────────────────────────────────────────────────

const BASE_TRIPS = 'api/v1/trips'

export const tripsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_TRIPS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_TRIPS}/${id}/`).then(r => r.data),

  create: (data) => {
    const payload = { ...(data || {}) }
    delete payload.trip_number // backend-controlled identifier
    return axiosInstance.post(`${BASE_TRIPS}/`, payload).then(r => r.data)
  },

  // --- Sub-resources ---
  listStops: (tripId, params) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/stops/`, { params }).then(r => r.data),
  createStop: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/stops/`, data).then(r => r.data),
  updateStop: (tripId, stopId, data) =>
    axiosInstance.patch(`${BASE_TRIPS}/${tripId}/stops/${stopId}/`, data).then(r => r.data),
  deleteStop: (tripId, stopId) =>
    axiosInstance.delete(`${BASE_TRIPS}/${tripId}/stops/${stopId}/`).then(r => r.data),

  listStatusHistory: (tripId, params) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/status-history/`, { params }).then(r => r.data),

  listDocuments: (tripId, params) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/documents/`, { params }).then(r => r.data),
  createDocument: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/documents/`, data).then(r => r.data),
  uploadPod: (tripId, formData) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/documents/upload/`, formData).then(r => r.data),
  updateDocument: (tripId, documentId, data) =>
    axiosInstance.patch(`${BASE_TRIPS}/${tripId}/documents/${documentId}/`, data).then(r => r.data),
  deleteDocument: (tripId, documentId) =>
    axiosInstance.delete(`${BASE_TRIPS}/${tripId}/documents/${documentId}/`).then(r => r.data),

  listPodDocuments: (params) =>
    axiosInstance.get(`${BASE_TRIPS}/pod-documents/`, { params }).then(r => r.data),
  getPodDocument: (id) =>
    axiosInstance.get(`${BASE_TRIPS}/pod-documents/${id}/`).then(r => r.data),

  listExpenses: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/expenses/`).then(r => r.data),
  createExpense: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/expenses/`, data).then(r => r.data),
  updateExpense: (tripId, expenseId, data) =>
    axiosInstance.patch(`${BASE_TRIPS}/${tripId}/expenses/${expenseId}/`, data).then(r => r.data),
  deleteExpense: (tripId, expenseId) =>
    axiosInstance.delete(`${BASE_TRIPS}/${tripId}/expenses/${expenseId}/`).then(r => r.data),

  listCharges: (tripId) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/charges/`).then(r => r.data),
  createCharge: (tripId, data) =>
    axiosInstance.post(`${BASE_TRIPS}/${tripId}/charges/`, data).then(r => r.data),
  updateCharge: (tripId, chargeId, data) =>
    axiosInstance.patch(`${BASE_TRIPS}/${tripId}/charges/${chargeId}/`, data).then(r => r.data),
  deleteCharge: (tripId, chargeId) =>
    axiosInstance.delete(`${BASE_TRIPS}/${tripId}/charges/${chargeId}/`).then(r => r.data),
  listCargo: (tripId, params) =>
    axiosInstance.get(`${BASE_TRIPS}/${tripId}/cargo/`, { params }).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_TRIPS}/${id}/`, data).then(r => r.data),
  replace: (id, data) =>
    axiosInstance.put(`${BASE_TRIPS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_TRIPS}/${id}/`).then(r => r.data),
}
// ─── 4. CARGO ──────────────────────────────────────────────────────────────

const BASE_CARGO = 'api/v1/cargo'

export const cargoApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_CARGO}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_CARGO}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_CARGO}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_CARGO}/${id}/`, data).then(r => r.data),
  replace: (id, data) =>
    axiosInstance.put(`${BASE_CARGO}/${id}/`, data).then(r => r.data),
  transitionStatus: (id, new_status) =>
    axiosInstance.post(`${BASE_CARGO}/${id}/transition-status/`, { new_status }).then(r => r.data),
  delete: (id) =>
    axiosInstance.delete(`${BASE_CARGO}/${id}/`).then(r => r.data),
}

export const cargoMovementsApi = {
  list: (cargoId, params) =>
    axiosInstance.get(`${BASE_CARGO}/${cargoId}/movements/`, { params }).then(r => r.data),
  create: (cargoId, data) =>
    axiosInstance.post(`${BASE_CARGO}/${cargoId}/movements/`, data).then(r => r.data),
}

// ─── 5. POD (TripDocument) — legacy deliveriesApi alias ─────────────────────

/** @deprecated Use tripsApi.listPodDocuments / uploadPod / getPodDocument */
export const deliveriesApi = {
  list: (params) => tripsApi.listPodDocuments(params),
  get: (id) => tripsApi.getPodDocument(id),
  create: () => Promise.reject(new Error('Use tripsApi.uploadPod(tripId, formData) for POD uploads')),
  update: (id, data) => {
    const tripId = data?.trip || data?.trip_id
    if (!tripId) {
      return Promise.reject(new Error('trip id required — use tripsApi.updateDocument(tripId, id, data)'))
    }
    return tripsApi.updateDocument(tripId, id, data)
  },
  replace: (id, data) => deliveriesApi.update(id, data),
  delete: (id) => Promise.reject(new Error('Use tripsApi.deleteDocument(tripId, id)')),
}