import React, { useState } from 'react';
import { Loader2, Plus, Edit, HeartPulse, User, Clock, ShieldCheck, ExternalLink, Activity, FileText, AlertCircle } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
} from '../../../../queries/drivers/trainingAndMedicalQuery';
import DriverSelect from '../../common/DriverSelect';
import { formatDateTime } from '@/utils/dateFormat';
import { VERIFICATION_STATUS } from '../../common/constants';

// Shared Form Fields for Medical
const MedicalFormFields = ({ form, setForm, fieldErrors, setFieldErrors }) => {
  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
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
          <Label required>Examination Date</Label>
          {renderError('examination_date')}
          <Input type="date" value={form.examination_date} onChange={set('examination_date')} max={today} />
        </div>
        <div>
          <Label required>Next Due Date</Label>
          {renderError('next_due_date')}
          <Input type="date" value={form.next_due_date} onChange={set('next_due_date')} />
        </div>
        <div><Label>Fitness Status</Label>
          <Select value={form.fitness_status} onChange={set('fitness_status')}>
            {VERIFICATION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Label>Blood Group</Label>
          {renderError('blood_group')}
          <Input placeholder="e.g. O+" value={form.blood_group} onChange={set('blood_group')} />
        </div>
        <div>
          <Label>Certificate Number</Label>
          {renderError('certificate_number')}
          <Input placeholder="MED123456" value={form.certificate_number} onChange={set('certificate_number')} />
        </div>
        <div>
          <Label>Examining Doctor</Label>
          {renderError('examining_doctor')}
          <Input placeholder="Dr. Smith" value={form.examining_doctor} onChange={set('examining_doctor')} />
        </div>
        <div className="col-span-2">
          <Label>Certificate File (URL)</Label>
          {renderError('certificate_url')}
          <Input placeholder="https://example.com/cert.pdf" value={form.certificate_url} onChange={set('certificate_url')} />
        </div>
      </div>
      <div>
        <Label>Restrictions</Label>
        {renderError('restrictions')}
        <textarea rows={2} placeholder="Any medical restrictions..." value={form.restrictions} onChange={e => setForm(p => ({ ...p, restrictions: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
      <div><Label>Notes</Label>
        {renderError('notes')}
        <textarea rows={2} placeholder="Additional observations..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
      </div>
    </div>
  );
};

export const AddMedicalModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    examination_date: '',
    next_due_date: '',
    fitness_status: 'PENDING',
    blood_group: '',
    examining_doctor: '',
    certificate_number: '',
    certificate_url: '',
    restrictions: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const createMedical = useCreateMedicalRecord(targetDriverId);

  // Real-time Date Validation
  React.useEffect(() => {
    if (form.examination_date && form.next_due_date) {
      if (form.examination_date > form.next_due_date) {
        setFieldErrors(prev => ({ 
          ...prev, 
          next_due_date: 'Next due date cannot be before examination date' 
        }));
      } else if (fieldErrors.next_due_date === 'Next due date cannot be before examination date') {
        setFieldErrors(prev => ({ ...prev, next_due_date: '' }));
      }
    }
  }, [form.examination_date, form.next_due_date]);

  const handleSubmit = () => {
    setError('');
    const newErrors = {};

    if (!targetDriverId) newErrors.driver = 'This field is required';
    if (!form.examination_date) newErrors.examination_date = 'This field is required';
    if (!form.next_due_date) newErrors.next_due_date = 'This field is required';

    if (form.examination_date && form.next_due_date && form.examination_date > form.next_due_date) {
      newErrors.next_due_date = 'Next due date cannot be before examination date';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    createMedical.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Medical Record"
      description="Add a new medical checkup record"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createMedical.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createMedical.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Record</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
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
        <MedicalFormFields form={form} setForm={setForm} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />
      </div>
    </ModalWrapper>
  );
};

export const EditMedicalModal = ({ record, driverId, onClose }) => {
  const [form, setForm] = useState({
    examination_date: record.examination_date ?? '',
    next_due_date: record.next_due_date ?? '',
    fitness_status: record.fitness_status ?? 'PENDING',
    blood_group: record.blood_group ?? '',
    examining_doctor: record.examining_doctor ?? '',
    certificate_number: record.certificate_number ?? '',
    certificate_url: record.certificate_url ?? '',
    restrictions: record.restrictions ?? '',
    notes: record.notes ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');

  // Real-time Date Validation
  React.useEffect(() => {
    if (form.examination_date && form.next_due_date) {
      if (form.examination_date > form.next_due_date) {
        setFieldErrors(prev => ({ 
          ...prev, 
          next_due_date: 'Next due date cannot be before examination date' 
        }));
      } else if (fieldErrors.next_due_date === 'Next due date cannot be before examination date') {
        setFieldErrors(prev => ({ ...prev, next_due_date: '' }));
      }
    }
  }, [form.examination_date, form.next_due_date]);

  const [showDelete, setShowDelete] = useState(false);
  const updateMedical = useUpdateMedicalRecord(driverId, record.id);
  const deleteMedical = useDeleteMedicalRecord(driverId);

  const handleSubmit = () => {
    setError('');
    const newErrors = {};

    if (!form.examination_date) newErrors.examination_date = 'This field is required';
    if (!form.next_due_date) newErrors.next_due_date = 'This field is required';

    if (form.examination_date && form.next_due_date && form.examination_date > form.next_due_date) {
      newErrors.next_due_date = 'Next due date cannot be before examination date';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    updateMedical.mutate(cleanObject(form), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Medical Record"
      description={<span>Editing checkup from: <span className="font-semibold text-gray-600">{record.examination_date}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Record
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={updateMedical.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateMedical.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Record</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Medical Record?"
          description="This medical record will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteMedical.mutate(record.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteMedical.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>}
        <MedicalFormFields form={form} setForm={setForm} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />
      </div>
    </ModalWrapper>
  );
};

export const DeleteMedicalDialog = ({ record, driverId, onClose }) => {
  const deleteMutation = useDeleteMedicalRecord(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(record.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Medical Record?"
      description={<p>Record from <span className="font-semibold text-gray-600">{record.examination_date}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};

export const ViewMedicalModal = ({ record, driverName, employeeId, onClose }) => {
  const LabelValue = ({ label, value, isLink, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#0052CC] hover:underline flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100 w-fit">
          <ExternalLink size={12} /> View Certificate
        </a>
      ) : (
        <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
          {value || '—'}
        </span>
      )}
    </div>
  );

  const daysToNextDue = record.next_due_date ? Math.ceil((new Date(record.next_due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isDueSoon = daysToNextDue !== null && daysToNextDue <= 30 && daysToNextDue > 0;
  const isOverdue = daysToNextDue !== null && daysToNextDue <= 0;

  return (
    <ModalWrapper
      title="Medical Information"
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
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
            <HeartPulse size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#172B4D] leading-none tracking-tight">{driverName || record.driver_name || '-'}</h3>
              <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-1
                ${record.fitness_status === 'FIT' ? 'bg-green-50 text-green-600 border-green-100' : 
                  record.fitness_status === 'UNFIT' ? 'bg-red-50 text-red-600 border-red-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {record.fitness_status_display || record.fitness_status}
              </div>
            </div>
            <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <User size={12} /> Employee ID: {employeeId || record.employee_id || '—'}
            </div>
          </div>
        </div>

        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 border-b border-gray-50 mb-2">
           <LabelValue label="Examination Date" value={record.examination_date} />
           <LabelValue label="Fitness Status" value={record.fitness_status} />
           <div className="flex items-center gap-3">
             <LabelValue label="Next Due Date" value={record.next_due_date} />
             {isDueSoon && (
               <div className="flex items-center gap-1 mt-4 px-2 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 animate-pulse">
                 <AlertCircle size={12} />
                 <span className="text-[10px] font-bold uppercase whitespace-nowrap">Due in {daysToNextDue} days</span>
               </div>
             )}
             {isOverdue && (
               <div className="flex items-center gap-1 mt-4 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100 animate-pulse">
                 <AlertCircle size={12} />
                 <span className="text-[10px] font-bold uppercase whitespace-nowrap">Overdue by {Math.abs(daysToNextDue)} days</span>
               </div>
             )}
           </div>
           <LabelValue label="Blood Group" value={record.blood_group} color="font-mono" />
        </div>

        {/* Medical Details */}
        <div className="grid grid-cols-2 gap-x-8 px-2 pt-2">
           <LabelValue label="Examining Doctor" value={record.examining_doctor} />
           <LabelValue label="Certificate No." value={record.certificate_number} />
           <LabelValue label="Certificate File" value={record.certificate_url} isLink />
           <LabelValue 
             label="Record Created At" 
             value={record.created_at ? formatDateTime(record.created_at) : '—'} 
           />
        </div>

        {/* Restrictions Section */}
        <div className="px-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Medical Restrictions</span>
          <div className="p-3 bg-amber-50/30 rounded-lg text-[13px] text-amber-900 border border-amber-100/50 leading-relaxed min-h-[50px]">
             {record.restrictions || 'No medical restrictions noted.'}
          </div>
        </div>

        {/* Notes Section */}
        <div className="px-2 pt-4 border-t border-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Internal Notes</span>
          <div className="text-[13px] text-gray-600 italic leading-relaxed">
             {record.notes || 'No additional internal notes.'}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
