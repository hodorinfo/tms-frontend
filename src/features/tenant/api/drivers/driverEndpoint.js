import axiosInstance from '../axiosInstance';

const BASE = '/api/v1/drivers';

const driverApi = {

  // REGISTER DRIVER (create user + driver)
  registerDriver: (data) =>
    axiosInstance.post(`${BASE}/drivers/register/`, data),

  // ─── 1. Drivers ──────────────────────────────────

  // LIST - params: { status, driver_type, license_type, search, page, page_size }
  getDrivers: (params) =>
    axiosInstance.get(`${BASE}/drivers/`, { params }),

  // GLOBAL STATS (independent of list filters/pagination)
  getDriverStats: () =>
    axiosInstance.get(`${BASE}/drivers/stats/`),

  // DETAIL
  getDriverById: (id) =>
    axiosInstance.get(`${BASE}/drivers/${id}/`),

  // CREATE 
  createDriver: (data) =>
    axiosInstance.post(`${BASE}/drivers/`, data),

  // UPDATE - data: { years_of_experience, status, ... }
  updateDriver: (id, data) =>
    axiosInstance.patch(`${BASE}/drivers/${id}/`, data),

  // DELETE - Response: 204 No Content
  deleteDriver: (id) =>
    axiosInstance.delete(`${BASE}/drivers/${id}/`),

  // RESTORE - Response: 200
  restoreDriver: (id) =>
    axiosInstance.post(`${BASE}/drivers/${id}/restore/`),

  exportCsv: (params) =>
    axiosInstance.get(`${BASE}/drivers/export/`, {
      params,
      responseType: 'blob',
    }),

  importTemplate: () =>
    axiosInstance.get(`${BASE}/drivers/import-template/`, {
      responseType: 'blob',
    }),

  importCsv: (file) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post(`${BASE}/drivers/import/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },


  // ─── 2. Documents ────────────────────────────────

  // LIST ALL - params: { driver, document_type, verification_status }
  getDocuments: (params) =>
    axiosInstance.get(`${BASE}/driver-documents/`, { params }),

  // GET BY ID
  getDocumentById: (id) =>
    axiosInstance.get(`${BASE}/driver-documents/${id}/`),

  // // LIST BY DRIVER (nested route - GET only)
  // getDriverDocuments: (driverId, params) =>
  //   axiosInstance.get(`${BASE}/drivers/${driverId}/documents/`, { params }),

  // CREATE - driver ID passed in request body
  createDriverDocument: (data) =>
    axiosInstance.post(`${BASE}/driver-documents/`, data),

  // UPDATE - flat endpoint, only document id required
  updateDriverDocument: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-documents/${id}/`, data),

  // DELETE - flat endpoint, only document id required
  deleteDriverDocument: (id) =>
    axiosInstance.delete(`${BASE}/driver-documents/${id}/`),


  // ─── 3. Emergency Contacts ───────────────────────

  // LIST BY DRIVER - params: { driver, is_primary }
  getEmergencyContacts: (params) =>
    axiosInstance.get(`${BASE}/driver-emergency-contacts/`, { params }),
  // Usage on driver detail page:
  // getEmergencyContacts({ driver: driverId }) → that driver's contacts only

  // GET BY ID - flat endpoint
  getEmergencyContactById: (id) =>
    axiosInstance.get(`${BASE}/driver-emergency-contacts/${id}/`),
  // Usage: contact row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createEmergencyContact: (data) =>
    axiosInstance.post(`${BASE}/driver-emergency-contacts/`, data),
  // data = { driver: driverId, contact_name, relationship, phone... }

  // UPDATE - flat endpoint, only contact id required
  updateEmergencyContact: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-emergency-contacts/${id}/`, data),

  // DELETE - flat endpoint, only contact id required
  deleteEmergencyContact: (id) =>
    axiosInstance.delete(`${BASE}/driver-emergency-contacts/${id}/`),



  // ─── 4. Training Records ─────────────────────────

  // LIST BY DRIVER - params: { driver, training_type, status }
  getTrainingRecords: (params) =>
    axiosInstance.get(`${BASE}/driver-training-records/`, { params }),
  // Usage on driver detail page:
  // getTrainingRecords({ driver: driverId }) → that driver's records only

  // GET BY ID - flat endpoint
  getTrainingRecordById: (id) =>
    axiosInstance.get(`${BASE}/driver-training-records/${id}/`),
  // Usage: training row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createTrainingRecord: (data) =>
    axiosInstance.post(`${BASE}/driver-training-records/`, data),
  // data = { driver: driverId, training_type, training_date, ... }

  // UPDATE - flat endpoint, only record id required
  updateTrainingRecord: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-training-records/${id}/`, data),

  // DELETE - flat endpoint, only record id required
  deleteTrainingRecord: (id) =>
    axiosInstance.delete(`${BASE}/driver-training-records/${id}/`),



  // ─── 5. Medical Records ──────────────────────────

  // LIST BY DRIVER - params: { driver, fitness_status }
  getMedicalRecords: (params) =>
    axiosInstance.get(`${BASE}/driver-medical-records/`, { params }),
  // Usage on driver detail page:
  // getMedicalRecords({ driver: driverId }) → that driver's records only

  // GET BY ID - flat endpoint
  getMedicalRecordById: (id) =>
    axiosInstance.get(`${BASE}/driver-medical-records/${id}/`),
  // Usage: medical row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createMedicalRecord: (data) =>
    axiosInstance.post(`${BASE}/driver-medical-records/`, data),
  // data = { driver: driverId, examination_date, fitness_status, ... }

  // UPDATE - flat endpoint, only record id required
  updateMedicalRecord: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-medical-records/${id}/`, data),

  // DELETE - flat endpoint, only record id required
  deleteMedicalRecord: (id) =>
    axiosInstance.delete(`${BASE}/driver-medical-records/${id}/`),




  // ─── 6. Performance Metrics ──────────────────────

  // LIST BY DRIVER - params: { driver, period_start, period_end }
  getPerformanceMetrics: (params) =>
    axiosInstance.get(`${BASE}/driver-performance-metrics/`, { params }),
  // Usage on driver detail page:
  // getPerformanceMetrics({ driver: driverId }) → that driver's metrics only

  // GET BY ID - flat endpoint
  getPerformanceMetricById: (id) =>
    axiosInstance.get(`${BASE}/driver-performance-metrics/${id}/`),
  // Usage: metric row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createPerformanceMetric: (data) =>
    axiosInstance.post(`${BASE}/driver-performance-metrics/`, data),
  // data = { driver: driverId, period_start, period_end, trips_completed, ... }

  // UPDATE - flat endpoint, only metric id required
  updatePerformanceMetric: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-performance-metrics/${id}/`, data),

  // DELETE - flat endpoint, only metric id required
  deletePerformanceMetric: (id) =>
    axiosInstance.delete(`${BASE}/driver-performance-metrics/${id}/`),




  // ─── 7. Incidents ────────────────────────────────

  // LIST BY DRIVER - params: { driver, incident_type, severity, resolution_status }
  getIncidents: (params) =>
    axiosInstance.get(`${BASE}/driver-incidents/`, { params }),
  // Usage on driver detail page:
  // getIncidents({ driver: driverId }) → that driver's incidents only

  // GET BY ID - flat endpoint
  getIncidentById: (id) =>
    axiosInstance.get(`${BASE}/driver-incidents/${id}/`),
  // Usage: incident row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createIncident: (data) =>
    axiosInstance.post(`${BASE}/driver-incidents/`, data),
  // data = { driver: driverId, vehicle, incident_type, incident_date, ... }

  // UPDATE - flat endpoint, only incident id required
  // data = { resolution_status, resolution_notes }
  updateIncident: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-incidents/${id}/`, data),

  // DELETE - flat endpoint, only incident id required
  deleteIncident: (id) =>
    axiosInstance.delete(`${BASE}/driver-incidents/${id}/`),




  // ─── 8. Attendance ───────────────────────────────

  // LIST BY DRIVER - params: { driver, status, date }
  getAttendance: (params) =>
    axiosInstance.get(`${BASE}/driver-attendance/`, { params }),
  // Usage on driver detail page:
  // getAttendance({ driver: driverId }) → that driver's attendance only

  // GET BY ID - flat endpoint
  getAttendanceById: (id) =>
    axiosInstance.get(`${BASE}/driver-attendance/${id}/`),
  // Usage: attendance row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createAttendance: (data) =>
    axiosInstance.post(`${BASE}/driver-attendance/`, data),
  // data = { driver: driverId, date, status, check_in_time, check_out_time }

  // UPDATE - flat endpoint, only attendance id required
  updateAttendance: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-attendance/${id}/`, data),

  // DELETE - flat endpoint, only attendance id required
  deleteAttendance: (id) =>
    axiosInstance.delete(`${BASE}/driver-attendance/${id}/`),




  // ─── 9. Vehicle Assignments ──────────────────────

  // LIST BY DRIVER - params: { driver }
  getVehicleAssignments: (params) =>
    axiosInstance.get(`${BASE}/driver-vehicle-assignments/`, { params }),
  // Usage on driver detail page:
  // getVehicleAssignments({ driver: driverId }) → that driver's assignments only

  // GET BY ID - flat endpoint
  getVehicleAssignmentById: (id) =>
    axiosInstance.get(`${BASE}/driver-vehicle-assignments/${id}/`),
  // Usage: assignment row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createVehicleAssignment: (data) =>
    axiosInstance.post(`${BASE}/driver-vehicle-assignments/`, data),
  // data = { driver: driverId, vehicle, assignment_type, assigned_date }

  // UPDATE - flat endpoint, only assignment id required
  updateVehicleAssignment: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-vehicle-assignments/${id}/`, data),

  // DELETE - flat endpoint, only assignment id required
  deleteVehicleAssignment: (id) =>
    axiosInstance.delete(`${BASE}/driver-vehicle-assignments/${id}/`),



  // ─── 10. Salary Structures ───────────────────────

  // LIST BY DRIVER - params: { driver, payment_frequency, effective_from, effective_to }
  getSalaryStructures: (params) =>
    axiosInstance.get(`${BASE}/driver-salary-structures/`, { params }),
  // Usage on driver detail page:
  // getSalaryStructures({ driver: driverId }) → that driver's salary only

  // GET BY ID - flat endpoint
  getSalaryStructureById: (id) =>
    axiosInstance.get(`${BASE}/driver-salary-structures/${id}/`),
  // Usage: salary row click → fetch detail by id

  // CREATE - driver ID passed in request body
  createSalaryStructure: (data) =>
    axiosInstance.post(`${BASE}/driver-salary-structures/`, data),
  // data = { driver: driverId, base_salary, allowances, deductions, payment_frequency, effective_from }

  // UPDATE - flat endpoint, only salary id required
  updateSalaryStructure: (id, data) =>
    axiosInstance.patch(`${BASE}/driver-salary-structures/${id}/`, data),

  // DELETE - flat endpoint, only salary id required
  deleteSalaryStructure: (id) =>
    axiosInstance.delete(`${BASE}/driver-salary-structures/${id}/`),

};




export default driverApi;