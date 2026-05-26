import axiosInstance from '../axiosInstance'

// ─── 1. VEHICLE TYPES ────────────────────────────────────────────────────────

const BASE_VEHICLE_TYPES = 'api/v1/vehicles/vehicle-types'

export const vehicleTypesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_VEHICLE_TYPES}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_VEHICLE_TYPES}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_VEHICLE_TYPES}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_VEHICLE_TYPES}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_VEHICLE_TYPES}/${id}/`).then(r => r.data),
}

// ─── 2. VEHICLES ─────────────────────────────────────────────────────────────

const BASE_VEHICLES = 'api/v1/vehicles/vehicles'

export const vehiclesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_VEHICLES}/`, { params }).then(r => r.data),

  stats: () =>
    axiosInstance.get(`${BASE_VEHICLES}/stats/`).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_VEHICLES}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_VEHICLES}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_VEHICLES}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_VEHICLES}/${id}/`).then(r => r.data),

  restore: (id) =>
    axiosInstance.post(`${BASE_VEHICLES}/${id}/restore/`).then(r => r.data),

  /** CSV export — respects same query params as list (filters, search, visibility). */
  exportCsv: (params) =>
    axiosInstance.get(`${BASE_VEHICLES}/export/`, {
      params,
      responseType: 'blob',
    }),

  /** CSV import template (headers + sample row). */
  importTemplate: () =>
    axiosInstance.get(`${BASE_VEHICLES}/import-template/`, {
      responseType: 'blob',
    }),

  /** CSV import — multipart field name must be `file`. */
  importCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post(`${BASE_VEHICLES}/import/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  getDocuments: (id) =>
    axiosInstance.get(`${BASE_VEHICLES}/${id}/documents/`).then(r => r.data),

  getMaintenance: (id) =>
    axiosInstance.get(`${BASE_VEHICLES}/${id}/maintenance/`).then(r => r.data),

  getFuelLogs: (id) =>
    axiosInstance.get(`${BASE_VEHICLES}/${id}/fuel-logs/`).then(r => r.data),
}

// ─── 3. VEHICLE DOCUMENTS ────────────────────────────────────────────────────

const BASE_DOCUMENTS = 'api/v1/vehicles/vehicle-documents'

export const vehicleDocumentsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_DOCUMENTS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_DOCUMENTS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_DOCUMENTS}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': undefined } : {}
    }).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_DOCUMENTS}/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': undefined } : {}
    }).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_DOCUMENTS}/${id}/`).then(r => r.data),
}

// ─── 4. VEHICLE INSURANCE ────────────────────────────────────────────────────

const BASE_INSURANCE = 'api/v1/vehicles/vehicle-insurances'

export const vehicleInsurancesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_INSURANCE}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_INSURANCE}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_INSURANCE}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_INSURANCE}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_INSURANCE}/${id}/`).then(r => r.data),
}

// ─── 5. MAINTENANCE SCHEDULES ────────────────────────────────────────────────

const BASE_MAINT_SCHEDULES = 'api/v1/vehicles/vehicle-maintenance-schedules'

export const maintenanceSchedulesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_MAINT_SCHEDULES}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_MAINT_SCHEDULES}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_MAINT_SCHEDULES}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_MAINT_SCHEDULES}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_MAINT_SCHEDULES}/${id}/`).then(r => r.data),
}

// ─── 6. MAINTENANCE RECORDS ──────────────────────────────────────────────────

const BASE_MAINT_RECORDS = 'api/v1/vehicles/vehicle-maintenance-records'

export const maintenanceRecordsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_MAINT_RECORDS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_MAINT_RECORDS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_MAINT_RECORDS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_MAINT_RECORDS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_MAINT_RECORDS}/${id}/`).then(r => r.data),
}

// ─── 7. VEHICLE INSPECTIONS ──────────────────────────────────────────────────

const BASE_INSPECTIONS = 'api/v1/vehicles/vehicle-inspections'

export const vehicleInspectionsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_INSPECTIONS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_INSPECTIONS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_INSPECTIONS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_INSPECTIONS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_INSPECTIONS}/${id}/`).then(r => r.data),
}

// ─── 8. FUEL LOGS ────────────────────────────────────────────────────────────

const BASE_FUEL_LOGS = 'api/v1/vehicles/vehicle-fuel-logs'

export const vehicleFuelLogsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_FUEL_LOGS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_FUEL_LOGS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_FUEL_LOGS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_FUEL_LOGS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_FUEL_LOGS}/${id}/`).then(r => r.data),
}

// ─── 9. TIRE MANAGEMENT ──────────────────────────────────────────────────────

const BASE_TIRES = 'api/v1/vehicles/vehicle-tire-management'

export const vehicleTiresApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_TIRES}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_TIRES}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_TIRES}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_TIRES}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_TIRES}/${id}/`).then(r => r.data),
}

// ─── 10. ACCESSORIES ─────────────────────────────────────────────────────────

const BASE_ACCESSORIES = 'api/v1/vehicles/vehicle-accessories'

export const vehicleAccessoriesApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_ACCESSORIES}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_ACCESSORIES}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_ACCESSORIES}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_ACCESSORIES}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_ACCESSORIES}/${id}/`).then(r => r.data),
}

// ─── 11. TOLL TAGS ───────────────────────────────────────────────────────────

const BASE_TOLL_TAGS = 'api/v1/vehicles/vehicle-toll-tags'

export const vehicleTollTagsApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_TOLL_TAGS}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_TOLL_TAGS}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_TOLL_TAGS}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_TOLL_TAGS}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_TOLL_TAGS}/${id}/`).then(r => r.data),
}

// ─── 12. OWNERSHIP HISTORY ───────────────────────────────────────────────────

const BASE_OWNERSHIP = 'api/v1/vehicles/vehicle-ownership-history'

export const vehicleOwnershipApi = {
  list: (params) =>
    axiosInstance.get(`${BASE_OWNERSHIP}/`, { params }).then(r => r.data),

  get: (id) =>
    axiosInstance.get(`${BASE_OWNERSHIP}/${id}/`).then(r => r.data),

  create: (data) =>
    axiosInstance.post(`${BASE_OWNERSHIP}/`, data).then(r => r.data),

  update: (id, data) =>
    axiosInstance.patch(`${BASE_OWNERSHIP}/${id}/`, data).then(r => r.data),

  delete: (id) =>
    axiosInstance.delete(`${BASE_OWNERSHIP}/${id}/`).then(r => r.data),
}
