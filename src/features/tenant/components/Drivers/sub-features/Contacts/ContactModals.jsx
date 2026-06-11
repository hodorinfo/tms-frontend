import React, { useState } from 'react';
import { Loader2, Plus, Edit, User, Phone, MapPin, ShieldCheck, CreditCard, Activity, Briefcase } from 'lucide-react';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateEmergencyContact,
  useUpdateEmergencyContact,
  useDeleteEmergencyContact,
} from '../../../../queries/drivers/driverContactQuery';
import DriverSelect from '../../common/DriverSelect';
import { formatDateTime } from '@/utils/dateFormat';

export const AddContactModal = ({ driverId, onClose }) => {
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    contact_name: '',
    relationship: '',
    phone: '',
    alternate_phone: '',
    address: '',
    is_primary: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const createContact = useCreateEmergencyContact(targetDriverId);
  
  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (fieldErrors[f]) {
      setFieldErrors(p => ({ ...p, [f]: '' }));
    }
  };

  const renderError = (field) => {
    const err = fieldErrors[field];
    if (!err) return null;
    return <div className="text-[10px] text-red-500 font-bold mb-1 tracking-tight">{err}</div>;
  };

  const handleSubmit = () => {
    setError('');
    setFieldErrors({});
    const newErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!targetDriverId) newErrors.driver = 'This field is required';
    if (!form.contact_name) newErrors.contact_name = 'This field is required';
    if (!form.relationship) newErrors.relationship = 'This field is required';
    if (!form.phone) newErrors.phone = 'This field is required';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    let p = form.phone.replace(/\s+/g, '');
    if (p.startsWith('+91')) p = p.slice(3);
    if (!phoneRegex.test(p)) {
      setFieldErrors({ phone: "Enter valid 10-digit phone number" });
      return;
    }

    let ap = form.alternate_phone.replace(/\s+/g, '');
    if (ap) {
      if (ap.startsWith('+91')) ap = ap.slice(3);
      if (!phoneRegex.test(ap)) {
        setFieldErrors({ alternate_phone: "Enter valid alternate phone number" });
        return;
      }
    }

    const payload = {
      ...form,
      phone: `+91${p}`,
      alternate_phone: ap ? `+91${ap}` : '',
    };

    createContact.mutate(cleanObject(payload), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Emergency Contact"
      description="Add a new emergency contact"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createContact.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createContact.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Contact</>}
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
            <DriverSelect value={targetDriverId} onChange={(val) => {
              setTargetDriverId(val);
              if (fieldErrors.driver) setFieldErrors(p => ({ ...p, driver: '' }));
            }} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label required>Full Name</Label>
            {renderError('contact_name')}
            <Input placeholder="e.g. John Doe" value={form.contact_name} onChange={set('contact_name')} />
          </div>
          <div>
            <Label required>Relationship</Label>
            {renderError('relationship')}
            <Input placeholder="e.g. Spouse" value={form.relationship} onChange={set('relationship')} />
          </div>
          <div>
            <Label required>Phone Number</Label>
            {renderError('phone')}
            <Input placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <Label>Alternate Phone</Label>
            {renderError('alternate_phone')}
            <Input placeholder="Optional" value={form.alternate_phone} onChange={set('alternate_phone')} />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" id="is_primary" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" />
            <label htmlFor="is_primary" className="text-sm font-semibold text-gray-700 cursor-pointer">Set as Primary Contact</label>
          </div>
        </div>
        <div><Label>Address</Label>
          <textarea rows={2} placeholder="Home or work address..." value={form.address} onChange={set('address')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const EditContactModal = ({ contact, driverId, onClose }) => {
  const [form, setForm] = useState({
    contact_name: contact.contact_name ?? '',
    relationship: contact.relationship ?? '',
    phone: contact.phone ?? '',
    alternate_phone: contact.alternate_phone ?? '',
    address: contact.address ?? '',
    is_primary: contact.is_primary ?? false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateContact = useUpdateEmergencyContact(driverId, contact.id);
  const deleteContact = useDeleteEmergencyContact(driverId);
  
  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    if (fieldErrors[f]) {
      setFieldErrors(p => ({ ...p, [f]: '' }));
    }
  };

  const renderError = (field) => {
    const err = fieldErrors[field];
    if (!err) return null;
    return <div className="text-[10px] text-red-500 font-bold mb-1 tracking-tight">{err}</div>;
  };

  const handleSubmit = () => {
    setError('');
    setFieldErrors({});
    const newErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!form.contact_name) newErrors.contact_name = 'This field is required';
    if (!form.relationship) newErrors.relationship = 'This field is required';
    if (!form.phone) newErrors.phone = 'This field is required';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    let p = form.phone.replace(/\s+/g, '');
    if (p.startsWith('+91')) p = p.slice(3);
    if (!phoneRegex.test(p)) {
      setFieldErrors({ phone: "Enter valid 10-digit phone number" });
      return;
    }

    let ap = form.alternate_phone.replace(/\s+/g, '');
    if (ap) {
      if (ap.startsWith('+91')) ap = ap.slice(3);
      if (!phoneRegex.test(ap)) {
        setFieldErrors({ alternate_phone: "Enter valid alternate phone number" });
        return;
      }
    }

    const payload = {
      ...form,
      phone: `+91${p}`,
      alternate_phone: ap ? `+91${ap}` : '',
    };

    updateContact.mutate(cleanObject(payload), {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Emergency Contact"
      description={<span>Editing: <span className="font-semibold text-gray-600">{contact.contact_name}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Contact
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={updateContact.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateContact.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Contact</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Contact?"
          description="This contact will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteContact.mutate(contact.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteContact.isPending}
        />
      )}
      <div className="space-y-4">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label required>Full Name</Label>
            {renderError('contact_name')}
            <Input placeholder="e.g. John Doe" value={form.contact_name} onChange={set('contact_name')} />
          </div>
          <div>
            <Label required>Relationship</Label>
            {renderError('relationship')}
            <Input placeholder="e.g. Spouse" value={form.relationship} onChange={set('relationship')} />
          </div>
          <div>
            <Label required>Phone Number</Label>
            {renderError('phone')}
            <Input placeholder="e.g. +91 98765 43210" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <Label>Alternate Phone</Label>
            {renderError('alternate_phone')}
            <Input placeholder="Optional" value={form.alternate_phone} onChange={set('alternate_phone')} />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" id="edit_is_primary" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" />
            <label htmlFor="edit_is_primary" className="text-sm font-semibold text-gray-700 cursor-pointer">Set as Primary Contact</label>
          </div>
        </div>
        <div><Label>Address</Label>
          <textarea rows={2} placeholder="Home or work address..." value={form.address} onChange={set('address')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 resize-none" />
        </div>
      </div>
    </ModalWrapper>
  );
};


export const ViewContactModal = ({ contact, driverName, employeeId, onClose }) => {
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
      title="Contact Information"
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
          <div className="w-12 h-12 rounded-xl bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC] shadow-sm">
            <User size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#172B4D] leading-none tracking-tight">{driverName || '-'}</h3>
              {contact.is_primary && (
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 uppercase">
                  <ShieldCheck size={10} /> Primary Contact
                </span>
              )}
            </div>
            <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <User size={12} /> Employee ID: {employeeId || contact.employee_id || '—'}
            </div>
          </div>
        </div>

        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 border-b border-gray-50 mb-2">
           <LabelValue label="Emergency Contact" value={`${contact.contact_name} (${contact.relationship})`} />
           <LabelValue label="Primary Status" value={contact.is_primary ? 'Default Emergency Contact' : 'Secondary Contact'} />
           <LabelValue label="Mobile Number" value={contact.phone} color="font-mono" />
           <LabelValue label="Alternate Phone" value={contact.alternate_phone} color="font-mono" />
        </div>

        {/* Contact Status & Location */}
        <div className="grid grid-cols-2 gap-x-8 px-2 pt-2">
           <LabelValue 
             label="Record Created At" 
             value={contact.created_at ? formatDateTime(contact.created_at) : '—'} 
           />
        </div>

        {/* Address Section */}
        <div className="px-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Detailed Address</span>
          <div className="p-3 bg-gray-50 rounded-lg text-[13px] text-gray-600 border border-gray-100 italic leading-relaxed">
             {contact.address || 'No address provided.'}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const DeleteContactDialog = ({ contact, driverId, onClose }) => {
  const deleteMutation = useDeleteEmergencyContact(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(contact.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Contact?"
      description={<p><span className="font-semibold text-gray-600">{contact.contact_name}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};
