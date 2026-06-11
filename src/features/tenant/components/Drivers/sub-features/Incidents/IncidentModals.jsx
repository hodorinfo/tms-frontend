import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Plus, Edit, AlertTriangle, MapPin, Calendar, Clock, Shield, Search, Info, User, Car } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateIncident,
  useUpdateIncident,
  useDeleteIncident,
} from '../../../../queries/drivers/incidentsAndAttendance';
import { useVehiclesList } from '../../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../../queries/users/userQuery';
import { useCurrentUser } from '../../../../queries/users/userActionQuery';
import { useTrips } from '../../../../queries/orders/ordersQuery';
import DriverSelect from '../../common/DriverSelect';
import { INCIDENT_TYPES, SEVERITY_TYPES as SEVERITY_LIST, RESOLUTION_STATUS } from '../../common/constants';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

// Vehicle Select for incidents - Displays registration, make and model
export const VehicleSelect = ({ value, onChange, ...props }) => {
  const { data, isLoading } = useVehiclesList({ status: 'ACTIVE' });
  const vehicles = data?.results ?? [];

  return (
    <Select value={value} onChange={onChange} disabled={isLoading} {...props}>
      <option value="">{isLoading ? 'Loading vehicles...' : 'Select vehicle'}</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>
          {v.registration_number} — {v.make} {v.model}
        </option>
      ))}
    </Select>
  );
};

// Trip Select for incidents - Displays Trip Number and Route
export const TripSelect = ({ value, onChange, onSelectTrip, ...props }) => {
  const { data, isLoading } = useTrips({ page_size: 1000, ordering: '-created_at' });
  
  // Filtering trips based on user request: DISPATCHED, IN_TRANSIT, DELAYED
  const trips = useMemo(() => {
    const results = data?.results || (Array.isArray(data) ? data : []);
    const allowedStatuses = ['DISPATCHED', 'IN_TRANSIT', 'DELAYED'];
    return results.filter(t => allowedStatuses.includes(t.status));
  }, [data]);

  const handleChange = (e) => {
    const tripId = e.target.value;
    onChange(e);
    if (onSelectTrip) {
      const trip = trips.find(t => t.id === tripId);
      onSelectTrip(trip);
    }
  };

  return (
    <Select value={value} onChange={handleChange} disabled={isLoading} {...props}>
      <option value="">{isLoading ? 'Loading trips...' : (trips.length === 0 ? 'No active trips found' : 'Select trip')}</option>
      {trips.map(t => (
        <option key={t.id} value={t.id}>
          {t.trip_number || `TRIP-${t.id.slice(-6)}`} — {t.origin_city || 'N/A'} to {t.destination_city || 'N/A'}
        </option>
      ))}
    </Select>
  );
};

export const AddIncidentModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    vehicle: '',
    trip_id: '',
    incident_type: '',
    incident_date: '',
    location: '',
    description: '',
    severity: '',
    resolution_status: 'OPEN',
    police_report_number: '',
    insurance_claim_number: '',
    resolution_notes: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const createIncident = useCreateIncident(targetDriverId);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    const newErrors = {};
    if (!targetDriverId) newErrors.driver = "This field is required";
    if (!form.incident_type) newErrors.incident_type = 'Incident type is required';
    if (!form.vehicle) newErrors.vehicle = 'Vehicle is required';
    if (!form.trip_id) newErrors.trip_id = 'Trip number is required';
    if (!form.severity) newErrors.severity = 'Severity is required';
    if (!form.incident_date) newErrors.incident_date = 'Incident date is required';
    if (!form.description) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }
    setFieldErrors({});

    createIncident.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  const handleTripSelect = (trip) => {
    if (!trip) return;
    setForm(p => ({
      ...p,
      vehicle: trip.vehicle_id || trip.primary_vehicle_id || p.vehicle,
      trip_id: trip.id
    }));
    // If we're in "All Incidents" mode (driverId is null), auto-fill the driver too
    if (!driverId && (trip.driver_id || trip.primary_driver_id)) {
      setTargetDriverId(trip.driver_id || trip.primary_driver_id);
    }
  };

  return (
    <ModalWrapper
      title="Add Incident"
      description="Record a new incident"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createIncident.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createIncident.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : <><Plus size={14} /> Add Incident</>
            }
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}

        {!driverId && (
          <div>
            {fieldErrors.driver && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.driver}</div>}
            <Label required>Driver</Label>
            <DriverSelect value={targetDriverId} onChange={setTargetDriverId} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            {fieldErrors.vehicle && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.vehicle}</div>}
            <Label required>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={(e) => { setForm(p => ({ ...p, vehicle: e.target.value })); if(fieldErrors.vehicle) setFieldErrors(pf => ({...pf, vehicle: ''})); }} />
          </div>
          <div>
            {fieldErrors.trip_id && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.trip_id}</div>}
            <Label required>Trip Number</Label>
            <TripSelect 
              value={form.trip_id} 
              onChange={(e) => { setForm(p => ({ ...p, trip_id: e.target.value })); if(fieldErrors.trip_id) setFieldErrors(pf => ({...pf, trip_id: ''})); }} 
              onSelectTrip={handleTripSelect}
            />
          </div>
          <div>
            {fieldErrors.severity && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.severity}</div>}
            <Label required>Severity</Label>
            <Select value={form.severity} onChange={(e) => { set('severity')(e); if(fieldErrors.severity) setFieldErrors(pf => ({...pf, severity: ''})); }}>
              <option value="">Select severity</option>
              {SEVERITY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            {fieldErrors.incident_date && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.incident_date}</div>}
            <Label required>Incident Date</Label>
            <Input type="datetime-local" value={form.incident_date} onChange={set('incident_date')} />
          </div>
          <div>
            <Label>Location</Label>
            <Input placeholder="Location" value={form.location} onChange={set('location')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Police Report Number</Label>
            <Input placeholder="Police report no" value={form.police_report_number} onChange={set('police_report_number')} />
          </div>
          <div>
            <Label>Insurance Claim Number</Label>
            <Input placeholder="Insurance no" value={form.insurance_claim_number} onChange={set('insurance_claim_number')} />
          </div>
        </div>
        <div>
          {fieldErrors.description && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.description}</div>}
          <Label required>Description</Label>
          <textarea
            rows={2} placeholder="Describe what happened..."
            value={form.description} onChange={set('description')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none"
          />
        </div>
        <div className="border-t border-gray-100 pt-4 mt-4">
          <Label>Resolution Status</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Select value={form.resolution_status} onChange={set('resolution_status')}>
              {RESOLUTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input placeholder="Resolution notes..." value={form.resolution_notes} onChange={set('resolution_notes')} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditIncidentModal = ({ incident, driverId, onClose }) => {
  const [form, setForm] = useState({
    vehicle: incident.vehicle ?? '',
    trip_id: incident.trip_id ?? '',
    incident_type: incident.incident_type ?? '',
    incident_date: incident.incident_date ? incident.incident_date.slice(0, 16) : '',
    location: incident.location ?? '',
    description: incident.description ?? '',
    severity: incident.severity ?? 'MEDIUM',
    resolution_status: incident.resolution_status ?? 'OPEN',
    police_report_number: incident.police_report_number ?? '',
    insurance_claim_number: incident.insurance_claim_number ?? '',
    resolution_notes: incident.resolution_notes ?? '',
    resolved_by: incident.resolved_by ?? '',
    resolved_at: incident.resolved_at ?? '',
  });
  
  const { data: currentUser } = useCurrentUser();
  const { data: usersData } = useUsers({ page_size: 1000 });

  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    const isResolved = newStatus === 'RESOLVED' || newStatus === 'CLOSED';
    
    setForm(p => {
      const newState = { ...p, resolution_status: newStatus };
      if (isResolved) {
        // Only set if not already set to avoid overwriting original timestamp
        if (!newState.resolved_at) newState.resolved_at = new Date().toISOString();
        if (!newState.resolved_by) newState.resolved_by = currentUser?.id || '';
      } else {
        // Clear if not resolved
        newState.resolved_by = '';
        newState.resolved_at = '';
      }
      return newState;
    });
  };

  // Safety: If status is resolved but fields are missing (e.g. late load or backend missing), fill them.
  useEffect(() => {
    const isResolved = form.resolution_status === 'RESOLVED' || form.resolution_status === 'CLOSED';
    if (isResolved) {
      const updates = {};
      if (currentUser?.id && !form.resolved_by) updates.resolved_by = currentUser.id;
      if (!form.resolved_at) updates.resolved_at = new Date().toISOString();
      
      if (Object.keys(updates).length > 0) {
        setForm(p => ({ ...p, ...updates }));
      }
    }
  }, [currentUser?.id, form.resolution_status, form.resolved_at, form.resolved_by]);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const updateIncident = useUpdateIncident(driverId, incident.id);
  const deleteIncident = useDeleteIncident(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    const newErrors = {};
    if (!form.incident_type) newErrors.incident_type = 'Incident type is required';
    if (!form.vehicle) newErrors.vehicle = 'Vehicle is required';
    if (!form.trip_id) newErrors.trip_id = 'Trip number is required';
    if (!form.severity) newErrors.severity = 'Severity is required';
    if (!form.incident_date) newErrors.incident_date = 'Incident date is required';
    if (!form.description) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }
    setFieldErrors({});

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (k === 'resolved_by' || k === 'resolved_at') return [k, v || null];
        return [k, v === '' ? null : v];
      })
    );

    updateIncident.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  const handleTripSelect = (trip) => {
    if (!trip) return;
    setForm(p => ({
      ...p,
      vehicle: trip.vehicle_id || trip.primary_vehicle_id || p.vehicle,
      trip_id: trip.id
    }));
  };

  return (
    <ModalWrapper
      title="Edit Incident"
      description={<span>Editing: <span className="font-semibold text-gray-600">{incident.incident_type_display ?? incident.incident_type}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Incident
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateIncident.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateIncident.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : <><Edit size={14} /> Update Incident</>
              }
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Incident?"
          description="This incident will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteIncident.mutate(incident.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteIncident.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {fieldErrors.incident_type && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.incident_type}</div>}
            <Label required>Incident Type</Label>
            <Select value={form.incident_type} onChange={set('incident_type')}>
              <option value="">Select type</option>
              {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            {fieldErrors.vehicle && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.vehicle}</div>}
            <Label required>Vehicle</Label>
            <VehicleSelect value={form.vehicle} onChange={(e) => { setForm(p => ({ ...p, vehicle: e.target.value })); if(fieldErrors.vehicle) setFieldErrors(pf => ({...pf, vehicle: ''})); }} />
          </div>
          <div>
            {fieldErrors.trip_id && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.trip_id}</div>}
            <Label required>Trip Number</Label>
            <TripSelect 
              value={form.trip_id} 
              onChange={(e) => { setForm(p => ({ ...p, trip_id: e.target.value })); if(fieldErrors.trip_id) setFieldErrors(pf => ({...pf, trip_id: ''})); }} 
              onSelectTrip={handleTripSelect}
            />
          </div>
          <div>
             {fieldErrors.severity && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.severity}</div>}
            <Label required>Severity</Label>
            <Select value={form.severity} onChange={(e) => { set('severity')(e); if(fieldErrors.severity) setFieldErrors(pf => ({...pf, severity: ''})); }}>
              <option value="">Select severity</option>
              {SEVERITY_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            {fieldErrors.incident_date && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.incident_date}</div>}
            <Label required>Incident Date</Label>
            <Input type="datetime-local" value={form.incident_date} onChange={set('incident_date')} />
          </div>
          <div>
            <Label>Location</Label>
            <Input placeholder="Location" value={form.location} onChange={set('location')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Police Report Number</Label>
            <Input placeholder="Police report no" value={form.police_report_number} onChange={set('police_report_number')} />
          </div>
          <div>
            <Label>Insurance Claim Number</Label>
            <Input placeholder="Insurance no" value={form.insurance_claim_number} onChange={set('insurance_claim_number')} />
          </div>
        </div>
        <div>
          {fieldErrors.description && <div className="text-[10px] text-red-500 font-bold mb-1 ml-1">{fieldErrors.description}</div>}
          <Label required>Description</Label>
          <textarea
            rows={2} placeholder="Describe what happened..."
            value={form.description} onChange={set('description')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none"
          />
        </div>
        <div className="border-t border-gray-100 pt-4 mt-4">
          <Label>Resolution Status</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Select value={form.resolution_status} onChange={handleStatusChange}>
              {RESOLUTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input placeholder="Resolution notes..." value={form.resolution_notes} onChange={set('resolution_notes')} />
          </div>
          {(form.resolved_by || form.resolved_at) && (
            <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <Label>Resolved By</Label>
                <div className="text-xs font-semibold text-gray-600 mt-1">
                  {userMap[form.resolved_by] || 
                   (form.resolved_by === currentUser?.id ? (`${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username) : null) || 
                   form.resolved_by || '—'}
                </div>
              </div>
              <div>
                <Label>Resolved At</Label>
                <div className="text-xs font-semibold text-gray-600 mt-1">
                  {form.resolved_at ? formatDateTime(form.resolved_at) : '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteIncidentDialog = ({ incident, driverId, onClose }) => {
  const deleteMutation = useDeleteIncident(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(incident.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Incident?"
      description={<p><span className="font-semibold text-gray-600">{incident.incident_type_display || incident.incident_type}</span> incident will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};

export const ViewIncidentModal = ({ incident, driverName, employeeId, vehicleName, tripNumber, userMap, currentUser, onClose }) => {
  // Record view logic
  const LabelValue = ({ label, value, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
        {value || '—'}
      </span>
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return formatDateTime(dateStr);
  };

  const resolvedBy = userMap[incident.resolved_by] || 
    (incident.resolved_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) || 
    incident.resolved_by_name || incident.resolved_by || '—';

  return (
    <ModalWrapper
      title="Incident Information"
      onClose={onClose}
      footer={
        <div className="flex justify-end w-full">
          <button 
            onClick={onClose} 
            className="px-8 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Identity Section - Header Card */}
        <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 mb-2">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#172B4D] leading-none tracking-tight">{driverName || incident.driver_name || '-'}</h3>
              <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-1
                ${incident.resolution_status === 'RESOLVED' || incident.resolution_status === 'CLOSED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {incident.resolution_status_display || incident.resolution_status}
              </div>
            </div>
            <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <User size={12} /> Employee ID: {employeeId || incident.employee_id || '—'}
            </div>
          </div>
        </div>

        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 border-b border-gray-50 mb-2">
           <LabelValue label="Incident Type" value={incident.incident_type_display || incident.incident_type} />
           <LabelValue label="Incident Date" value={formatDate(incident.incident_date)} />
           <LabelValue label="Vehicle Registration" value={vehicleName || incident.vehicle_registration} />
           <LabelValue label="Trip Number" value={tripNumber || incident.trip_id} />
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 pt-2">
           <LabelValue label="Location" value={incident.location} />
           <LabelValue label="Severity" value={incident.severity_display || incident.severity} />
           <LabelValue label="Police Report Number" value={incident.police_report_number} color="font-mono" />
           <LabelValue label="Insurance Claim Number" value={incident.insurance_claim_number} color="font-mono" />
           <LabelValue label="Resolution Status" value={incident.resolution_status_display || incident.resolution_status} />
           <LabelValue 
             label="Record Created At" 
             value={incident.created_at ? formatDateTime(incident.created_at) : '—'} 
           />
        </div>

        {/* Resolution Section */}
        <div className="grid grid-cols-2 gap-x-8 px-2 pt-2 border-t border-gray-50">
           <LabelValue label="Resolved By" value={resolvedBy} />
           <LabelValue label="Resolved At" value={formatDate(incident.resolved_at)} />
        </div>

        {/* Description Section */}
        <div className="px-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Incident Description</span>
          <div className="p-3 bg-gray-50 rounded-lg text-[13px] text-gray-600 border border-gray-100 italic leading-relaxed">
             {incident.description || 'No description provided.'}
          </div>
        </div>

        {/* Resolution Notes Section */}
        <div className="px-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Resolution Notes</span>
          <div className="p-3 bg-green-50/30 rounded-lg text-[13px] text-green-900 border border-green-100/30 leading-relaxed">
             {incident.resolution_notes || 'No resolution notes provided.'}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
