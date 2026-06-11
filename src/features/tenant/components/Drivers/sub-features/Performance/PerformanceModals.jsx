import React, { useState } from 'react';
import { Loader2, Plus, Edit, User, Clock, BarChart2, TrendingUp, Star, MessageSquare, BarChart3, Target, AlertTriangle } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreatePerformanceMetric,
  useUpdatePerformanceMetric,
  useDeletePerformanceMetric,
} from '../../../../queries/drivers/performanceMetricsQuery';
import DriverSelect from '../../common/DriverSelect';
import { formatDateTime } from '@/utils/dateFormat';

// Shared Form Fields for Performance
const PerformanceFormFields = ({ form, setForm, fieldErrors, setFieldErrors }) => {
    const set = (f) => (e) => {
      setForm(p => ({ ...p, [f]: e.target.value }));
      // Clear field error when user starts typing/selecting
      if (fieldErrors?.[f]) {
        setFieldErrors(p => ({ ...p, [f]: '' }));
      }
    };

    const renderError = (field) => {
      const error = fieldErrors?.[field];
      if (!error) return null;
      return <div className="text-[10px] text-red-500 font-bold mb-1 tracking-tight">{error}</div>;
    };

    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Period Start</Label>
          {renderError('period_start')}
          <Input type="date" value={form.period_start} onChange={set('period_start')} max={today} />
        </div>
        <div>
          <Label required>Period End</Label>
          {renderError('period_end')}
          <Input type="date" value={form.period_end} onChange={set('period_end')} max={today} />
        </div>
        <div>
          <Label>Trips Completed</Label>
          {renderError('trips_completed')}
          <Input type="number" placeholder="e.g. 0" min="0" value={form.trips_completed} onChange={set('trips_completed')} />
        </div>
        <div>
          <Label>Distance Covered (km)</Label>
          {renderError('distance_covered')}
          <Input type="number" placeholder="e.g. 0.00" min="0" step="0.5" value={form.distance_covered} onChange={set('distance_covered')} />
        </div>
        <div>
          <Label>Fuel Efficiency (km/L)</Label>
          {renderError('fuel_efficiency')}
          <Input type="number" placeholder="e.g. 8.5" min="0" step="0.1" value={form.fuel_efficiency} onChange={set('fuel_efficiency')} />
        </div>
        <div>
          <Label>On-Time Delivery Rate (%)</Label>
          {renderError('on_time_delivery_rate')}
          <Input type="number" placeholder="e.g. 95" min="0" max="100" step="0.1" value={form.on_time_delivery_rate} onChange={set('on_time_delivery_rate')} />
        </div>
        <div>
          <Label>Safety Score (0-100)</Label>
          {renderError('safety_score')}
          <Input type="number" placeholder="e.g. 90" min="0" max="100" step="0.1" value={form.safety_score} onChange={set('safety_score')} />
        </div>
        <div>
          <Label>Customer Rating (0-5)</Label>
          {renderError('customer_rating')}
          <Input type="number" placeholder="e.g. 4.5" min="0" max="5" step="0.1" value={form.customer_rating} onChange={set('customer_rating')} />
        </div>
      </div>
      <div><Label>Notes</Label>
        <textarea rows={2} placeholder="Any additional notes..." value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
      </div>
    );
};

export const AddPerformanceModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    period_start: '',
    period_end: '',
    trips_completed: '',
    distance_covered: '',
    fuel_efficiency: '',
    on_time_delivery_rate: '',
    safety_score: '',
    customer_rating: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const createMetric = useCreatePerformanceMetric(targetDriverId);

  // Real-time Date Validation
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (form.period_start && form.period_end) {
      if (form.period_start > form.period_end) {
        setFieldErrors(prev => ({ 
          ...prev, 
          period_start: 'Period start cannot be after period end',
          period_end: 'Period end cannot be before start date' 
        }));
      } else if (form.period_end > today) {
        setFieldErrors(prev => ({ 
          ...prev, 
          period_end: 'Period end cannot be in the future' 
        }));
        setFieldErrors(prev => {
           const next = { ...prev };
           if (next.period_start === 'Period start cannot be after period end') next.period_start = '';
           return next;
        });
      } else {
        setFieldErrors(prev => {
          const next = { ...prev };
          if (next.period_start === 'Period start cannot be after period end') next.period_start = '';
          if (next.period_end === 'Period end cannot be before start date' || next.period_end === 'Period end cannot be in the future') next.period_end = '';
          return next;
        });
      }
    } else if (form.period_end && form.period_end > today) {
      setFieldErrors(prev => ({ ...prev, period_end: 'Period end cannot be in the future' }));
    } else if (fieldErrors.period_end === 'Period end cannot be in the future') {
      setFieldErrors(prev => ({ ...prev, period_end: '' }));
    }
  }, [form.period_start, form.period_end]);

  // Real-time Numeric Validation
  React.useEffect(() => {
    setFieldErrors(prev => {
      const next = { ...prev };
      
      // Trips Completed
      if (form.trips_completed !== '' && Number(form.trips_completed) < 0) {
        next.trips_completed = 'trips_completed cannot be negative.';
      } else if (next.trips_completed === 'trips_completed cannot be negative.') {
        next.trips_completed = '';
      }

      if (form.distance_covered !== '' && Number(form.distance_covered) < 0) {
        next.distance_covered = 'distance_covered cannot be negative.';
      } else if (next.distance_covered === 'distance_covered cannot be negative.') {
        next.distance_covered = '';
      }

      if (form.fuel_efficiency !== '' && Number(form.fuel_efficiency) < 0) {
        next.fuel_efficiency = 'fuel_efficiency cannot be negative.';
      } else if (next.fuel_efficiency === 'fuel_efficiency cannot be negative.') {
        next.fuel_efficiency = '';
      }

      if (form.on_time_delivery_rate !== '') {
        const rate = Number(form.on_time_delivery_rate);
        if (rate < 0 || rate > 100) next.on_time_delivery_rate = 'on_time_delivery_rate must be between 0 and 100.';
        else if (next.on_time_delivery_rate === 'on_time_delivery_rate must be between 0 and 100.') next.on_time_delivery_rate = '';
      }

      if (form.safety_score !== '') {
        const safety = Number(form.safety_score);
        if (safety < 0 || safety > 100) next.safety_score = 'safety_score must be between 0 and 100.';
        else if (next.safety_score === 'safety_score must be between 0 and 100.') next.safety_score = '';
      }

      if (form.customer_rating !== '') {
        const rating = Number(form.customer_rating);
        if (rating < 0 || rating > 5) next.customer_rating = 'customer_rating must be between 0 and 5.';
        else if (next.customer_rating === 'customer_rating must be between 0 and 5.') next.customer_rating = '';
      }

      return next;
    });
  }, [form.trips_completed, form.distance_covered, form.fuel_efficiency, form.on_time_delivery_rate, form.safety_score, form.customer_rating]);

  const handleSubmit = () => {
    setError('');
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!targetDriverId) newErrors.driver = 'This field is required';
    if (!form.period_start) newErrors.period_start = 'This field is required';
    if (!form.period_end) newErrors.period_end = 'This field is required';

    if (form.period_start && form.period_end && form.period_start > form.period_end) {
      newErrors.period_start = 'Period start cannot be after period end';
      newErrors.period_end = 'Period end cannot be before start date';
    } else if (form.period_end && form.period_end > today) {
      newErrors.period_end = 'Period end cannot be in the future';
    }

    if (form.trips_completed !== '' && Number(form.trips_completed) < 0) {
      newErrors.trips_completed = 'trips_completed cannot be negative.';
    }
    if (form.distance_covered !== '' && Number(form.distance_covered) < 0) {
      newErrors.distance_covered = 'distance_covered cannot be negative.';
    }
    if (form.fuel_efficiency !== '' && Number(form.fuel_efficiency) < 0) {
      newErrors.fuel_efficiency = 'fuel_efficiency cannot be negative.';
    }
    if (form.on_time_delivery_rate !== '') {
      const rate = Number(form.on_time_delivery_rate);
      if (rate < 0 || rate > 100) newErrors.on_time_delivery_rate = 'on_time_delivery_rate must be between 0 and 100.';
    }
    if (form.safety_score !== '') {
      const safety = Number(form.safety_score);
      if (safety < 0 || safety > 100) newErrors.safety_score = 'safety_score must be between 0 and 100.';
    }
    if (form.customer_rating !== '') {
      const rating = Number(form.customer_rating);
      if (rating < 0 || rating > 5) newErrors.customer_rating = 'customer_rating must be between 0 and 5.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    const submissionData = cleanObject(form);
    
    ['trips_completed', 'distance_covered', 'on_time_delivery_rate'].forEach(field => {
      if (submissionData[field] === null || submissionData[field] === '') {
        delete submissionData[field];
      }
    });

    createMetric.mutate(submissionData, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Performance Metric"
      description="Add performance data"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createMetric.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createMetric.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Metric</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>}
        {!driverId && (
            <div>
              <Label required>Driver</Label>
              {fieldErrors.driver && <div className="text-[10px] text-red-500 font-bold mb-1 tracking-tight">{fieldErrors.driver}</div>}
              <DriverSelect value={targetDriverId} onChange={(val) => {
                setTargetDriverId(val);
                if (fieldErrors.driver) setFieldErrors(p => ({ ...p, driver: '' }));
              }} />
            </div>
        )}
        <PerformanceFormFields form={form} setForm={setForm} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />
      </div>
    </ModalWrapper>
  );
};

export const EditPerformanceModal = ({ metric, driverId, onClose }) => {
  const [form, setForm] = useState({
    period_start: metric.period_start ?? '',
    period_end: metric.period_end ?? '',
    trips_completed: metric.trips_completed ?? '',
    distance_covered: metric.distance_covered ?? '',
    fuel_efficiency: metric.fuel_efficiency ?? '',
    on_time_delivery_rate: metric.on_time_delivery_rate ?? '',
    safety_score: metric.safety_score ?? '',
    customer_rating: metric.customer_rating ?? '',
    notes: metric.notes ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Real-time Date Validation
  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (form.period_start && form.period_end) {
      if (form.period_start > form.period_end) {
        setFieldErrors(prev => ({ 
          ...prev, 
          period_start: 'Period start cannot be after period end',
          period_end: 'Period end cannot be before start date' 
        }));
      } else if (form.period_end > today) {
        setFieldErrors(prev => ({ 
          ...prev, 
          period_end: 'Period end cannot be in the future' 
        }));
        setFieldErrors(prev => {
           const next = { ...prev };
           if (next.period_start === 'Period start cannot be after period end') next.period_start = '';
           return next;
        });
      } else {
        setFieldErrors(prev => {
          const next = { ...prev };
          if (next.period_start === 'Period start cannot be after period end') next.period_start = '';
          if (next.period_end === 'Period end cannot be before start date' || next.period_end === 'Period end cannot be in the future') next.period_end = '';
          return next;
        });
      }
    } else if (form.period_end && form.period_end > today) {
      setFieldErrors(prev => ({ ...prev, period_end: 'Period end cannot be in the future' }));
    } else if (fieldErrors.period_end === 'Period end cannot be in the future') {
      setFieldErrors(prev => ({ ...prev, period_end: '' }));
    }
  }, [form.period_start, form.period_end]);

  // Real-time Numeric Validation
  React.useEffect(() => {
    setFieldErrors(prev => {
      const next = { ...prev };
      if (form.trips_completed !== '' && Number(form.trips_completed) < 0) next.trips_completed = 'trips_completed cannot be negative.';
      else if (next.trips_completed === 'trips_completed cannot be negative.') next.trips_completed = '';

      if (form.distance_covered !== '' && Number(form.distance_covered) < 0) next.distance_covered = 'distance_covered cannot be negative.';
      else if (next.distance_covered === 'distance_covered cannot be negative.') next.distance_covered = '';

      if (form.fuel_efficiency !== '' && Number(form.fuel_efficiency) < 0) next.fuel_efficiency = 'fuel_efficiency cannot be negative.';
      else if (next.fuel_efficiency === 'fuel_efficiency cannot be negative.') next.fuel_efficiency = '';

      if (form.on_time_delivery_rate !== '') {
        const rate = Number(form.on_time_delivery_rate);
        if (rate < 0 || rate > 100) next.on_time_delivery_rate = 'on_time_delivery_rate must be between 0 and 100.';
        else if (next.on_time_delivery_rate === 'on_time_delivery_rate must be between 0 and 100.') next.on_time_delivery_rate = '';
      }

      if (form.safety_score !== '') {
        const safety = Number(form.safety_score);
        if (safety < 0 || safety > 100) next.safety_score = 'safety_score must be between 0 and 100.';
        else if (next.safety_score === 'safety_score must be between 0 and 100.') next.safety_score = '';
      }

      if (form.customer_rating !== '') {
        const rating = Number(form.customer_rating);
        if (rating < 0 || rating > 5) next.customer_rating = 'customer_rating must be between 0 and 5.';
        else if (next.customer_rating === 'customer_rating must be between 0 and 5.') next.customer_rating = '';
      }
      return next;
    });
  }, [form.trips_completed, form.distance_covered, form.fuel_efficiency, form.on_time_delivery_rate, form.safety_score, form.customer_rating]);

  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateMetric = useUpdatePerformanceMetric(driverId, metric.id);
  const deleteMetric = useDeletePerformanceMetric(driverId);

  const handleSubmit = () => {
    setError('');
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!form.period_start) newErrors.period_start = 'This field is required';
    if (!form.period_end) newErrors.period_end = 'This field is required';

    if (form.period_start && form.period_end && form.period_start > form.period_end) {
      newErrors.period_start = 'Period start cannot be after period end';
      newErrors.period_end = 'Period end cannot be before start date';
    } else if (form.period_end && form.period_end > today) {
      newErrors.period_end = 'Period end cannot be in the future';
    }

    if (form.trips_completed !== '' && Number(form.trips_completed) < 0) {
      newErrors.trips_completed = 'trips_completed cannot be negative.';
    }
    if (form.distance_covered !== '' && Number(form.distance_covered) < 0) {
      newErrors.distance_covered = 'distance_covered cannot be negative.';
    }
    if (form.fuel_efficiency !== '' && Number(form.fuel_efficiency) < 0) {
      newErrors.fuel_efficiency = 'fuel_efficiency cannot be negative.';
    }
    if (form.on_time_delivery_rate !== '') {
      const rate = Number(form.on_time_delivery_rate);
      if (rate < 0 || rate > 100) newErrors.on_time_delivery_rate = 'on_time_delivery_rate must be between 0 and 100.';
    }
    if (form.safety_score !== '') {
      const safety = Number(form.safety_score);
      if (safety < 0 || safety > 100) newErrors.safety_score = 'safety_score must be between 0 and 100.';
    }
    if (form.customer_rating !== '') {
      const rating = Number(form.customer_rating);
      if (rating < 0 || rating > 5) newErrors.customer_rating = 'customer_rating must be between 0 and 5.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    const submissionData = cleanObject(form);
    
    ['trips_completed', 'distance_covered', 'on_time_delivery_rate'].forEach(field => {
      if (submissionData[field] === null || submissionData[field] === '') {
        delete submissionData[field];
      }
    });

    updateMetric.mutate(submissionData, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Performance Metric"
      description={<span>Editing: <span className="font-semibold text-gray-600">{metric.period_start} → {metric.period_end}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Metric
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={updateMetric.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateMetric.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Record</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Performance Metric?"
          description="This performance metric will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteMetric.mutate(metric.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteMetric.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>}
        <PerformanceFormFields form={form} setForm={setForm} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />
      </div>
    </ModalWrapper>
  );
};

export const DeletePerformanceDialog = ({ metric, driverId, onClose }) => {
  const deleteMutation = useDeletePerformanceMetric(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(metric.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Performance Metric?"
      description={<p>Period <span className="font-semibold text-gray-600">{metric.period_start} → {metric.period_end}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};

export const ViewPerformanceModal = ({ record, driverName, employeeId, onClose }) => {
  const LabelValue = ({ label, value, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <ModalWrapper
      title="Performance Details"
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
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0052CC] shadow-sm border border-blue-100">
            <BarChart3 size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#172B4D] leading-none tracking-tight">{driverName || record.driver_name || '-'}</h3>
            </div>
            <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <User size={12} /> Employee ID: {employeeId || record.employee_id || '—'}
            </div>
          </div>
        </div>

        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 border-b border-gray-50 mb-2">
           <LabelValue label="Performance Period" value={`${record.period_start} to ${record.period_end}`} />
           <LabelValue label="Trips Completed" value={record.trips_completed} />
           <LabelValue label="Distance Covered" value={record.distance_covered ? `${Number(record.distance_covered).toLocaleString()} km` : '—'} />
           <LabelValue label="On-Time Delivery Rate" value={record.on_time_delivery_rate != null ? `${record.on_time_delivery_rate}%` : '—'} />
           <LabelValue label="Fuel Efficiency" value={record.fuel_efficiency != null ? `${record.fuel_efficiency} km/L` : '—'} />
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 pt-2">
           <LabelValue 
             label="Record Created At" 
             value={record.created_at ? formatDateTime(record.created_at) : '—'} 
           />
           <LabelValue label="Safety Score" value={record.safety_score != null ? `${record.safety_score} / 100` : '—'} />
           <div className="py-3 border-b border-gray-50 last:border-0 flex flex-col gap-1">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Customer Rating</span>
             <div className="flex items-center gap-1">
               <span className="text-[13px] font-bold text-[#172B4D]">{record.customer_rating || '—'}</span>
               {record.customer_rating && <Star size={12} className="text-amber-400 fill-amber-400" />}
             </div>
           </div>
        </div>

        {/* Notes Section */}
        <div className="px-2 pt-4 border-t border-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Internal Performance Notes</span>
          <div className="text-[13px] text-gray-600 italic leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
             {record.notes || 'No performance feedback notes available.'}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
