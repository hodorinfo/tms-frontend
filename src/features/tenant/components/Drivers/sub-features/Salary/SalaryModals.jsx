import React, { useState } from 'react';
import { Loader2, Plus, Edit, IndianRupee, User } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import StatusBadge from '../../common/StatusBadge';
import { FREQUENCY_STYLES } from '../../common/constants';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useDeleteSalaryStructure,
  useSalaryStructures,
} from '../../../../queries/drivers/salaryStructureQuery';
import { useMemo } from 'react';
import { formatDateTime } from '@/utils/dateFormat';

export const PAYMENT_FREQUENCIES = ['MONTHLY', 'BIWEEKLY', 'WEEKLY'];

export const formatCurrency = (val) => {
  if (val == null) return '—';
  const numericVal = typeof val === 'object' ? sumObjectValues(val) : Number(val);
  if (isNaN(numericVal)) return '—';
  return `₹${numericVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const sumObjectValues = (obj) => {
  if (!obj) return 0;
  if (typeof obj !== 'object') return parseFloat(obj) || 0;
  return Object.values(obj).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
};

const valueToObject = (val) => {
  if (!val) return {};
  if (typeof val === 'object') return val;
  return { "Total": parseFloat(val) || 0 };
};

// Net Salary Preview component
export const NetSalaryPreview = ({ base, allowances, deductions }) => {
  const b = parseFloat(base) || 0;
  const a = typeof allowances === 'object' ? sumObjectValues(allowances) : (parseFloat(allowances) || 0);
  const d = typeof deductions === 'object' ? sumObjectValues(deductions) : (parseFloat(deductions) || 0);
  const net = b + a - d;
  return (
    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
      <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-1">Calculated Net Salary</p>
      <p className="text-xl font-black text-[#0052CC]">
        {net > 0 ? `₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
      </p>
      <p className="text-[10px] text-blue-400 mt-0.5">Base + Allowances − Deductions</p>
    </div>
  );
};
import DriverSelect from '../../common/DriverSelect';

export const AddSalaryModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    base_salary: '',
    per_trip_rate: '',
    per_km_rate: '',
    overtime_rate: '',
    allowances: '',
    deductions: '',
    payment_frequency: 'MONTHLY',
    effective_from: '',
    effective_to: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const createSalary = useCreateSalaryStructure(targetDriverId);
  
  const { data: allSalariesData } = useSalaryStructures({ page_size: 1000 });
  const existingDriverIds = useMemo(() => {
    if (!allSalariesData?.results) return [];
    return allSalariesData.results.map(s => String(s.driver));
  }, [allSalariesData]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    const errors = {};
    if (!targetDriverId) errors.driver = 'This field is required';
    if (!form.base_salary) errors.base_salary = 'This field is required';
    if (!form.effective_from) errors.effective_from = 'This field is required';

    if (targetDriverId && !driverId && existingDriverIds.includes(String(targetDriverId))) {
      errors.driver = 'Driver already has a salary structure';
    }

    if (form.effective_to && form.effective_from && form.effective_to < form.effective_from) {
      errors.effective_to = 'Effective To date cannot be before Effective From date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const submissionData = {
      ...form,
      per_trip_rate: form.per_trip_rate || 0,
      per_km_rate: form.per_km_rate || 0,
      overtime_rate: form.overtime_rate || 0,
      allowances: valueToObject(form.allowances),
      deductions: valueToObject(form.deductions),
    };

    createSalary.mutate(cleanObject(submissionData), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Salary Structure"
      description="Set salary details"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createSalary.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createSalary.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Salary</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        
        {!driverId && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label required>Driver</Label>
              {fieldErrors.driver && <span className="text-[10px] font-bold text-red-500 tracking-tighter animate-in fade-in slide-in-from-right-2">{fieldErrors.driver}</span>}
            </div>
            <DriverSelect value={targetDriverId} onChange={(val) => { setTargetDriverId(val); setFieldErrors(p => ({ ...p, driver: '' })); }} disabledDriverIds={existingDriverIds} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div><div className="flex items-center justify-between mb-1"><Label required>base_salary (₹)</Label>{fieldErrors.base_salary && <span className="text-[10px] font-bold text-red-500 tracking-tighter animate-in fade-in slide-in-from-right-2">{fieldErrors.base_salary}</span>}</div><Input type="number" placeholder="monthly base" value={form.base_salary} onChange={(e) => { set('base_salary')(e); setFieldErrors(p => ({ ...p, base_salary: '' })); }} /></div>
          <div><Label>per_trip_rate (₹)</Label><Input type="number" placeholder="rate per trip" value={form.per_trip_rate} onChange={set('per_trip_rate')} /></div>
          <div><Label>per_km_rate (₹)</Label><Input type="number" placeholder="rate per km" value={form.per_km_rate} onChange={set('per_km_rate')} /></div>
          <div><Label>overtime_rate (₹/hr)</Label><Input type="number" placeholder="hourly rate" value={form.overtime_rate} onChange={set('overtime_rate')} /></div>
          <div><Label>payment_frequency</Label>
            <Select value={form.payment_frequency} onChange={set('payment_frequency')}>
              {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div><Label>allowances (₹)</Label><Input type="number" placeholder="total allowances" value={form.allowances} onChange={set('allowances')} /></div>
          <div><Label>deductions (₹)</Label><Input type="number" placeholder="total deductions" value={form.deductions} onChange={set('deductions')} /></div>
          <div><div className="flex items-center justify-between mb-1"><Label required>effective_from</Label>{fieldErrors.effective_from && <span className="text-[10px] font-bold text-red-500 tracking-tighter animate-in fade-in slide-in-from-right-2">{fieldErrors.effective_from}</span>}</div><Input type="date" value={form.effective_from} onChange={(e) => { set('effective_from')(e); setFieldErrors(p => ({ ...p, effective_from: '' })); }} /></div>
          <div><Label>effective_to</Label><Input type="date" value={form.effective_to} onChange={set('effective_to')} /></div>
        </div>
        <NetSalaryPreview base={form.base_salary} allowances={form.allowances} deductions={form.deductions} />
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditSalaryModal = ({ salary, driverId, onClose }) => {
  const [form, setForm] = useState({
    base_salary: salary.base_salary ?? '',
    per_trip_rate: salary.per_trip_rate ?? '',
    per_km_rate: salary.per_km_rate ?? '',
    overtime_rate: salary.overtime_rate ?? '',
    allowances: typeof salary.allowances === 'object' ? sumObjectValues(salary.allowances) : (salary.allowances ?? ''),
    deductions: typeof salary.deductions === 'object' ? sumObjectValues(salary.deductions) : (salary.deductions ?? ''),
    payment_frequency: salary.payment_frequency ?? 'MONTHLY',
    effective_from: salary.effective_from ?? '',
    effective_to: salary.effective_to ?? '',
    notes: salary.notes ?? '',
  });
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateSalary = useUpdateSalaryStructure(driverId, salary.id);
  const deleteSalary = useDeleteSalaryStructure(driverId);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    setFieldErrors({});
    const errors = {};
    if (!form.base_salary) errors.base_salary = 'This field is required';
    if (!form.effective_from) errors.effective_from = 'This field is required';

    if (form.effective_to && form.effective_from && form.effective_to < form.effective_from) {
      errors.effective_to = 'Effective To date cannot be before Effective From date.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const submissionData = {
      ...form,
      per_trip_rate: form.per_trip_rate || 0,
      per_km_rate: form.per_km_rate || 0,
      overtime_rate: form.overtime_rate || 0,
      allowances: valueToObject(form.allowances),
      deductions: valueToObject(form.deductions),
    };

    updateSalary.mutate(cleanObject(submissionData), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Salary Structure"
      description={<span>Effective from: <span className="font-semibold text-gray-600">{salary.effective_from}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Structure
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={updateSalary.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateSalary.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Salary</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Salary Structure?"
          description="Everything for this salary structure will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteSalary.mutate(salary.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteSalary.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
               <Label required>base_salary (₹)</Label>
               {fieldErrors.base_salary && <span className="text-[10px] font-bold text-red-500 tracking-tighter animate-in fade-in slide-in-from-right-2">{fieldErrors.base_salary}</span>}
            </div>
            <Input type="number" placeholder="monthly base" value={form.base_salary} onChange={(e) => { set('base_salary')(e); setFieldErrors(p => ({ ...p, base_salary: '' })); }} />
          </div>
          <div><Label>per_trip_rate (₹)</Label><Input type="number" placeholder="rate per trip" value={form.per_trip_rate} onChange={set('per_trip_rate')} /></div>
          <div><Label>per_km_rate (₹)</Label><Input type="number" placeholder="rate per km" value={form.per_km_rate} onChange={set('per_km_rate')} /></div>
          <div><Label>overtime_rate (₹/hr)</Label><Input type="number" placeholder="hourly rate" value={form.overtime_rate} onChange={set('overtime_rate')} /></div>
          <div><Label>payment_frequency</Label>
            <Select value={form.payment_frequency} onChange={set('payment_frequency')}>
              {PAYMENT_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div><Label>allowances (₹)</Label><Input type="number" placeholder="total allowances" value={form.allowances} onChange={set('allowances')} /></div>
          <div><Label>deductions (₹) </Label><Input type="number" placeholder="total deductions" value={form.deductions} onChange={set('deductions')} /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label required>effective_from</Label>
              {fieldErrors.effective_from && <span className="text-[10px] font-bold text-red-500 tracking-tighter animate-in fade-in slide-in-from-right-2">{fieldErrors.effective_from}</span>}
            </div>
            <Input type="date" value={form.effective_from} onChange={(e) => { set('effective_from')(e); setFieldErrors(p => ({ ...p, effective_from: '' })); }} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>effective_to</Label>
              {fieldErrors.effective_to && <span className="text-[10px] font-bold text-red-500 tracking-tighter animate-in fade-in slide-in-from-right-2">{fieldErrors.effective_to}</span>}
            </div>
            <Input type="date" value={form.effective_to} onChange={(e) => { set('effective_to')(e); setFieldErrors(p => ({ ...p, effective_to: '' })); }} />
          </div>
        </div>
        <NetSalaryPreview base={form.base_salary} allowances={form.allowances} deductions={form.deductions} />
        <div><Label>Notes</Label>
          <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const ViewSalaryModal = ({ salary, driverName, employeeId, onClose }) => {
  const b = parseFloat(salary.base_salary) || 0;
  
  const getArr = (val) => {
    if (!val) return [];
    if (typeof val === 'object' && !Array.isArray(val)) return Object.entries(val);
    return [['Total', val]];
  };

  const allowancesArr = getArr(salary.allowances);
  const deductionsArr = getArr(salary.deductions);
  const aTotal = sumObjectValues(salary.allowances);
  const dTotal = sumObjectValues(salary.deductions);
  const net = b + aTotal - dTotal;

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
      title="Salary Structure Details"
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
              <IndianRupee size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#172B4D] leading-none tracking-tight">{driverName || salary.driver_name || '-'}</h3>
                <StatusBadge 
                  label={salary.payment_frequency_display ?? salary.payment_frequency} 
                  styles={FREQUENCY_STYLES[salary.payment_frequency]} 
                />
              </div>
              <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                 <User size={12} /> Employee ID: {employeeId || salary.employee_id || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Details Content - Direct on White */}
        <div className="px-1">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <LabelValue label="base_salary (₹)" value={formatCurrency(b)} />
            <LabelValue label="allowances (₹)" value={aTotal ? formatCurrency(aTotal) : '—'} />
            <LabelValue label="deductions (₹)" value={dTotal ? formatCurrency(dTotal) : '—'} />
            <div className="py-2 border-b border-gray-50 flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700">net_salary (₹)</span>
              <span className="font-semibold text-[13px] text-[#0052CC]">
                {formatCurrency(salary.net_salary || net)}
              </span>
            </div>

            <LabelValue label="per_trip_rate (₹)" value={formatCurrency(salary.per_trip_rate)} />
            <LabelValue label="per_km_rate (₹)" value={formatCurrency(salary.per_km_rate)} />
            <LabelValue label="overtime_rate (₹/hr)" value={`${formatCurrency(salary.overtime_rate)}/hr`} />
            <LabelValue label="effective_dates" value={`${salary.effective_from} → ${salary.effective_to || 'Current'}`} />
            
            <LabelValue 
              label="record_created_at" 
              value={salary.created_at ? formatDateTime(salary.created_at) : '—'} 
            />
          </div>

          {/* Notes Section */}
          <div className="mt-4 pt-4 border-t border-gray-50 uppercase">
             <span className="text-[10px] font-bold text-gray-400 tracking-widest ">Notes & Remarks</span>
             <div className="mt-2 bg-gray-50/50 rounded-lg p-3 border border-gray-100/50">
                <p className="text-[12px] text-gray-600 leading-relaxed italic">
                  {salary.notes || 'No additional notes provided for this salary structure.'}
                </p>
             </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteSalaryDialog = ({ salary, driverId, onClose }) => {
  const deleteMutation = useDeleteSalaryStructure(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(salary.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Salary Structure?"
      description={<p>Structure from <span className="font-semibold text-gray-600">{salary.effective_from}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
