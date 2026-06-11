import React, { useState, useMemo } from 'react';
import { Loader2, Plus, Edit } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateVehicleAssignment,
  useUpdateVehicleAssignment,
  useDeleteVehicleAssignment,
  useDriverVehicleAssignments,
  useVehiclesList,
} from '../../../../queries/drivers/vehicleAssignmentQuery';
import { useUsers } from '../../../../queries/users/userQuery';
import { useCurrentUser } from '../../../../queries/users/userActionQuery';
import { ASSIGNMENT_TYPES, ASSIGNMENT_STATUS_STYLES, ASSIGNMENT_TYPE_STYLES } from '../../common/constants';
import { User, Car, Calendar, FileText, CheckSquare, Clock } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import { getInitials } from '../../common/utils';
import DriverSelect from '../../common/DriverSelect';
import { formatDateTime } from '@/utils/dateFormat';


// Vehicle Select for assignments - Displays registration, make and model
export const VehicleSelect = ({ value, onChange }) => {
  const { data, isLoading } = useVehiclesList({ status: 'ACTIVE' });
  const vehicles = data?.results ?? [];

  return (
    <Select value={value} onChange={onChange} disabled={isLoading}>
      <option value="">{isLoading ? 'Loading vehicles...' : 'Select vehicle'}</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>
          {v.registration_number} — {v.make} {v.model}
        </option>
      ))}
    </Select>
  );
};


export const AddAssignmentModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState({
    vehicle: '',
    assigned_date: '',
    unassigned_date: '',
    assignment_type: 'PERMANENT',
    is_active: true,
    assigned_by: '',
    notes: '',
  });

  // Auto-fill assigned_by when currentUser is loaded
  React.useEffect(() => {
    if (currentUser?.id && !form.assigned_by) {
      setForm(p => ({ ...p, assigned_by: currentUser.id }));
    }
  }, [currentUser, form.assigned_by]);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { data: assignmentsData } = useDriverVehicleAssignments(targetDriverId);
  const createAssignment = useCreateVehicleAssignment(targetDriverId);
  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (fieldErrors?.[f]) {
      setFieldErrors(p => ({ ...p, [f]: '' }));
    }
  };

  const renderError = (field) => {
    const err = fieldErrors?.[field];
    if (!err) return null;
    return <div className="text-[10px] text-red-500 font-bold mb-1 tracking-tight">{err}</div>;
  };

  const handleSubmit = () => {
    setError('');
    const errors = {};
    const hasActive = assignmentsData?.results?.some(
      (a) => a.is_active === true || a.is_active === 'true' || a.is_active === 1 || a.is_active === '1'
    );
    if (hasActive) return setError('You cannot add more than 1 vehicle to driver at one time.');

    if (!targetDriverId) errors.driver = 'This field is required';
    if (!form.vehicle) errors.vehicle = 'This field is required';
    if (!form.assigned_date) errors.assigned_date = 'This field is required';

    if (form.unassigned_date && form.assigned_date && form.unassigned_date < form.assigned_date) {
      errors.unassigned_date = 'Unassigned date cannot be before assigned date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    createAssignment.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Assign Vehicle"
      description="Assign a vehicle to a driver"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createAssignment.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createAssignment.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Assign Vehicle</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        
        {!driverId && (
          <div>
            <Label required>Driver</Label>
            {renderError('driver')}
            <DriverSelect value={targetDriverId} onChange={(val) => { setTargetDriverId(val); setFieldErrors(p => ({ ...p, driver: '' })); }} disableBusy={true} />
          </div>
        )}

        <div>
          <Label required>vehicle</Label>
          {renderError('vehicle')}
          <VehicleSelect value={form.vehicle} onChange={set('vehicle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>assigned_date</Label>
            {renderError('assigned_date')}
            <Input type="date" value={form.assigned_date} onChange={set('assigned_date')} />
          </div>
          <div>
            <Label>unassigned_date</Label>
            {renderError('unassigned_date')}
            <Input type="date" value={form.unassigned_date} onChange={set('unassigned_date')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>assignment_type</Label>
            <Select value={form.assignment_type} onChange={set('assignment_type')}>
              {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="is_active_add" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#0052CC] cursor-pointer" />
            <label htmlFor="is_active_add" className="text-sm font-semibold text-gray-600 cursor-pointer">is_active</label>
          </div>
          <div><Label>assigned_by</Label>
            <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium">
              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
            </div>
          </div>
        </div>
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditAssignmentModal = ({ assignment, driverId, onClose }) => {
  const [form, setForm] = useState({
    vehicle: assignment.vehicle ?? '',
    assigned_date: assignment.assigned_date ?? '',
    unassigned_date: assignment.unassigned_date ?? '',
    assignment_type: assignment.assignment_type ?? 'PERMANENT',
    is_active: assignment.is_active ?? true,
    assigned_by: assignment.assigned_by ?? '',
    notes: assignment.notes ?? '',
  });
  const { data: usersData } = useUsers({ page_size: 1000 });
  const userMap = useMemo(() => {
    const map = {};
    usersData?.results?.forEach(u => {
      map[u.id] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'System User';
    });
    return map;
  }, [usersData]);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const { data: assignmentsData } = useDriverVehicleAssignments(driverId);
  const updateAssignment = useUpdateVehicleAssignment(driverId, assignment.id);
  const deleteAssignment = useDeleteVehicleAssignment(driverId);
  
  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (fieldErrors?.[f]) {
      setFieldErrors(p => ({ ...p, [f]: '' }));
    }
  };

  const renderError = (field) => {
    const err = fieldErrors?.[field];
    if (!err) return null;
    return <div className="text-[10px] text-red-500 font-bold mb-1 tracking-tight">{err}</div>;
  };

  const handleSubmit = () => {
    setError('');
    setFieldErrors({});
    const errors = {};
    
    // Check if trying to activate this one while another is already active
    if (form.is_active) {
      const otherActive = assignmentsData?.results?.some(
        (a) =>
          (a.is_active === true || a.is_active === 'true' || a.is_active === 1 || a.is_active === '1') &&
          a.id !== assignment.id
      );
      if (otherActive) return setError('Another vehicle is already active for this driver. Please deactivate it first.');
    }

    if (!form.vehicle) errors.vehicle = 'This field is required';
    if (!form.assigned_date) errors.assigned_date = 'This field is required';

    if (form.unassigned_date && form.assigned_date && form.unassigned_date < form.assigned_date) {
      errors.unassigned_date = 'Unassigned date cannot be before assigned date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (k === 'is_active' || k === 'assigned_by') return [k, v];
        return [k, v === '' ? null : v];
      })
    );
    updateAssignment.mutate(clean, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Assignment"
      description={<span>Editing: <span className="font-semibold text-gray-600">{assignment.vehicle_registration ?? 'Vehicle'}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Assignment
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={updateAssignment.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
               {updateAssignment.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Assignment</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Assignment?"
          description="This assignment will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteAssignment.mutate(assignment.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteAssignment.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div>
          <Label required>vehicle</Label>
          {renderError('vehicle')}
          <VehicleSelect value={form.vehicle} onChange={set('vehicle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>assigned_date</Label>
            {renderError('assigned_date')}
            <Input type="date" value={form.assigned_date} onChange={set('assigned_date')} />
          </div>
          <div>
            <Label>unassigned_date</Label>
            {renderError('unassigned_date')}
            <Input type="date" value={form.unassigned_date} onChange={set('unassigned_date')} />
          </div>
          <div><Label>assignment_type</Label>
            <Select value={form.assignment_type} onChange={set('assignment_type')}>
              {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="is_active_edit" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#0052CC] cursor-pointer" />
            <label htmlFor="is_active_edit" className="text-sm font-semibold text-gray-600 cursor-pointer">is_active</label>
          </div>
          <div><Label>assigned_by</Label>
            <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium">
              {userMap[form.assigned_by] || form.assigned_by || '—'}
            </div>
          </div>
        </div>
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteAssignmentDialog = ({ assignment, driverId, onClose }) => {
  const deleteMutation = useDeleteVehicleAssignment(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(assignment.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Assignment?"
      description={<p>Vehicle <span className="font-semibold text-gray-600">{assignment.vehicle_registration ?? 'assignment'}</span> will be permanently removed.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};

export const ViewAssignmentModal = ({ record, driverName, employeeId, onClose, userMap = {} }) => {
  const LabelValue = ({ label, value, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
        {value || '—'}
      </span>
    </div>
  );

  const assignedBy = userMap[record.assigned_by] || record.assigned_by_name || record.assigned_by || '—';

  return (
    <ModalWrapper
      title="Assignment Details"
      onClose={onClose}
      footer={
        <div className="flex justify-end w-full">
          <button 
            onClick={onClose} 
            className="px-8 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Record Card */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0052CC] shrink-0 border border-blue-100/50">
              <Car size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#172B4D] leading-none tracking-tight">{driverName || record.driver_name || '-'}</h3>
                <StatusBadge
                  label={record.is_active ? 'Active' : 'Inactive'}
                  styles={ASSIGNMENT_STATUS_STYLES[record.is_active ? 'ACTIVE' : 'INACTIVE']}
                />
              </div>
              <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                 <User size={12} /> Employee ID: {employeeId || record.employee_id || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="px-1">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <div className="py-2 border-b border-gray-50 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">vehicle</span>
              <span className="font-mono text-[12px] text-[#0052CC] font-bold">
                {record.vehicle_registration ?? '—'}
              </span>
            </div>
            <div className="py-2 border-b border-gray-50 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">assignment_type</span>
              <div className="mt-0.5">
                <StatusBadge
                  label={record.assignment_type_display ?? record.assignment_type}
                  styles={ASSIGNMENT_TYPE_STYLES[record.assignment_type]}
                />
              </div>
            </div>
            <LabelValue label="assigned_date" value={record.assigned_date} />
            <LabelValue label="unassigned_date" value={record.unassigned_date} />
            <LabelValue label="assigned_by" value={assignedBy} />
            <LabelValue 
              label="record_created_at" 
              value={record.created_at ? formatDateTime(record.created_at) : '—'} 
            />
          </div>

          {/* Notes Section */}
          <div className="mt-4 pt-4 border-t border-gray-50 uppercase">
             <span className="text-[10px] font-bold text-gray-400 tracking-widest ">Notes & Remarks</span>
             <div className="mt-2 bg-gray-50/50 rounded-lg p-3 border border-gray-100/50">
                <p className="text-[12px] text-gray-600 leading-relaxed italic">
                  {record.notes || 'No additional notes provided for this assignment.'}
                </p>
             </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
