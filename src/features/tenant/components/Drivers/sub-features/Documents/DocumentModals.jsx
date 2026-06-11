import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, User, Clock, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import ModalWrapper from '../../common/ModalWrapper';
import Label from '../../common/Label';
import Input from '../../common/Input';
import Select from '../../common/Select';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { cleanObject, formatError } from '../../common/utils';
import {
  useCreateDriverDocument,
  useUpdateDriverDocument,
  useDeleteDriverDocument,
} from '../../../../queries/drivers/driverDocumentQuery';
import { useUsers } from '../../../../queries/users/userQuery';
import { useCurrentUser } from '../../../../queries/users/userActionQuery';
import DriverSelect from '../../common/DriverSelect';
import { DOCUMENT_TYPES, VERIFICATION_STATUS as VERIFICATION_LIST, STATUS_STYLES as VERIFICATION_STYLES } from '../../common/constants';
import { getExpiryColor, getInitials } from '../../common/utils';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

// Shared Form Fields for Documents
const DocumentFormFields = ({ form, setForm, fieldErrors, setFieldErrors, error, userMap = {}, onStatusChange, currentUser, isLoadingUsers }) => {
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
  
  const handleStatusChange = (e) => {
    if (onStatusChange) {
      onStatusChange(e.target.value);
    } else {
      set('verification_status')(e);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Document Type</Label>
          {renderError('document_type')}
          <Select value={form.document_type} onChange={set('document_type')}>
            <option value="">Select type</option>
            {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label required>Document Number</Label>
          {renderError('document_number')}
          <Input placeholder="e.g. 1234 5678 9012" value={form.document_number} onChange={set('document_number')} />
        </div>
        <div>
          <Label>Issue Date</Label>
          {renderError('issue_date')}
          <Input type="date" value={form.issue_date} onChange={set('issue_date')} />
        </div>
        <div>
          <Label>Expiry Date</Label>
          {renderError('expiry_date')}
          <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
        </div>
        <div>
          <Label>Issuing Authority</Label>
          {renderError('issuing_authority')}
          <Input placeholder="e.g. UIDAI (Optional)" value={form.issuing_authority} onChange={set('issuing_authority')} />
        </div>
        <div>
          <Label>Verification Status</Label>
          <Select value={form.verification_status} onChange={handleStatusChange}>
            {VERIFICATION_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {form.verification_status === 'VERIFIED' && form.verified_by && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 tracking-tight flex items-center gap-1">
              <User size={10} /> Verified By
            </span>
            <div className="text-[12px] font-semibold text-blue-700 min-h-[16px]">
              {isLoadingUsers && !userMap[form.verified_by] ? (
                <div className="h-3 bg-blue-200/50 rounded animate-pulse w-24 mt-0.5" />
              ) : (
                userMap[form.verified_by]?.name || 
                (form.verified_by === currentUser?.id ? `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim() || currentUser?.username : null) || 
                form.verified_by || 
                'System User'
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 tracking-tight flex items-center gap-1">
              <Clock size={10} /> Verified At
            </span>
            <div className="text-[12px] font-semibold text-blue-700 min-h-[16px]">
              {isLoadingUsers && !form.verified_at ? (
                <div className="h-3 bg-blue-200/50 rounded animate-pulse w-32 mt-0.5" />
              ) : (
                form.verified_at ? formatDateTime(form.verified_at) : '—'
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <Label>File URL</Label>
        <Input placeholder="https://example.com/files/doc.pdf" value={form.file_url} onChange={set('file_url')} />
      </div>
      <div>
        <Label>Notes</Label>
        <textarea rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set('notes')}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] placeholder:text-gray-300 transition-all resize-none" />
      </div>
    </div>
  );
};

export const AddDocumentModal = ({ driverId, onClose }) => {
  const { data: currentUser } = useCurrentUser();
  const [targetDriverId, setTargetDriverId] = useState(driverId || '');
  const [form, setForm] = useState({
    document_type: '',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    file_url: '',
    notes: '',
    verification_status: 'PENDING',
    verified_by: null,
    verified_at: null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const createDocument = useCreateDriverDocument(targetDriverId);

  const handleStatusChange = (newStatus) => {
    setForm(p => {
      const updates = { verification_status: newStatus };
      if (newStatus === 'VERIFIED' && currentUser?.id) {
        updates.verified_by = currentUser.id;
        updates.verified_at = new Date().toISOString();
      } else if (newStatus !== 'VERIFIED') {
        updates.verified_by = null;
        updates.verified_at = null;
      }
      return { ...p, ...updates };
    });
    if (fieldErrors.verification_status) setFieldErrors(p => ({ ...p, verification_status: '' }));
  };

  const handleSubmit = () => {
    setError('');
    setFieldErrors({});
    const newErrors = {};
    if (!targetDriverId) newErrors.driver = 'This field is required';
    if (!form.document_type) newErrors.document_type = 'This field is required';
    if (!form.document_number) newErrors.document_number = 'This field is required';
    
    if (form.issue_date && form.expiry_date && form.issue_date > form.expiry_date) {
      newErrors.expiry_date = 'Expiry date cannot be before issue date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    const payload = cleanObject(form);
    console.log('Creating Document with payload:', payload);

    createDocument.mutate(payload, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Add Document"
      description="Upload a new document"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={createDocument.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
            {createDocument.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add Document</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
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
        <DocumentFormFields form={form} setForm={setForm} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} error={error} onStatusChange={handleStatusChange} currentUser={currentUser} />
      </div>
    </ModalWrapper>
  );
};

export const EditDocumentModal = ({ doc, driverId, onClose, userMap = {}, isLoadingUsers }) => {
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState({
    document_type: doc.document_type ?? '',
    document_number: doc.document_number ?? '',
    issue_date: doc.issue_date ?? '',
    expiry_date: doc.expiry_date ?? '',
    issuing_authority: doc.issuing_authority ?? '',
    file_url: doc.file_url ?? '',
    notes: doc.notes ?? '',
    verification_status: doc.verification_status ?? 'PENDING',
    verified_by: doc.verified_by ?? null,
    verified_at: doc.verified_at ?? null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const updateDocument = useUpdateDriverDocument(driverId, doc.id);
  const deleteDocument = useDeleteDriverDocument(driverId);

  const handleStatusChange = (newStatus) => {
    setForm(p => {
      const updates = { verification_status: newStatus };
      if (newStatus === 'VERIFIED' && currentUser?.id) {
        updates.verified_by = currentUser.id;
        updates.verified_at = new Date().toISOString();
      } else if (newStatus !== 'VERIFIED') {
        updates.verified_by = null;
        updates.verified_at = null;
      }
      return { ...p, ...updates };
    });
    if (fieldErrors.verification_status) setFieldErrors(p => ({ ...p, verification_status: '' }));
  };

  const handleSubmit = () => {
    setError('');
    setFieldErrors({});
    const newErrors = {};

    if (!form.document_type) newErrors.document_type = 'This field is required';
    if (!form.document_number) newErrors.document_number = 'This field is required';

    if (form.issue_date && form.expiry_date && form.issue_date > form.expiry_date) {
      newErrors.expiry_date = 'Expiry date cannot be before issue date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    const payload = cleanObject(form);
    console.log('Updating Document with payload:', payload);

    updateDocument.mutate(payload, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Edit Document"
      description={<span>Editing: <span className="font-semibold text-gray-600">{doc.document_type_display ?? doc.document_type}</span></span>}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button 
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            Delete Document
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={updateDocument.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] disabled:opacity-50 disabled:cursor-not-allowed">
              {updateDocument.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit size={14} /> Update Document</>}
            </button>
          </div>
        </div>
      }
    >
      {showDelete && (
        <DeleteConfirmDialog
          title="Delete Document?"
          description="This document will be permanently removed. This action cannot be undone."
          onConfirm={() => deleteDocument.mutate(doc.id, { onSuccess: onClose })}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteDocument.isPending}
        />
      )}
      <DocumentFormFields 
        form={form} 
        setForm={setForm} 
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        error={error}
        userMap={userMap} 
        onStatusChange={handleStatusChange} 
        currentUser={currentUser}
        isLoadingUsers={isLoadingUsers}
      />
    </ModalWrapper>
  );
};

export const DeleteDocumentDialog = ({ doc, driverId, onClose }) => {
  const deleteMutation = useDeleteDriverDocument(driverId);
  const handleDelete = () => {
    deleteMutation.mutate(doc.id, {
      onSuccess: onClose,
    });
  };

  return (
    <DeleteConfirmDialog
      title="Delete Document?"
      description={<p><span className="font-semibold text-gray-600">{doc.document_type_display || doc.document_type}</span> will be permanently deleted.</p>}
      onConfirm={handleDelete}
      onCancel={onClose}
      isDeleting={deleteMutation.isPending}
    />
  );
};

export const ViewDocumentModal = ({ doc, onClose, userMap = {}, driverMap = {} }) => {
  const LabelValue = ({ label, value, isLink, isDate, color }) => (
    <div className="py-2 border-b border-gray-50 last:border-0 flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[#0052CC] hover:underline flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100 w-fit">
          <ExternalLink size={12} /> Open File
        </a>
      ) : (
        <span className={`text-[13px] font-medium text-[#172B4D] ${color || ''}`}>
          {isDate && value ? formatDateShort(value) : (value || '—')}
        </span>
      )}
    </div>
  );

  const verifier = userMap[doc.verified_by]?.name || doc.verified_by_name || doc.verified_by || '—';
  const driver = driverMap[doc.driver]?.name || doc.driver_name || '—';
  const employeeId = driverMap[doc.driver]?.employee_id || doc.employee_id || '—';

  const daysToExpiry = doc.expiry_date ? Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 0;
  const isExpired = daysToExpiry !== null && daysToExpiry <= 0;

  return (
    <ModalWrapper
      title="Document Information"
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
            <FileText size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#172B4D] leading-none tracking-tight">{driver}</h3>
              <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase flex items-center gap-1
                ${doc.verification_status === 'VERIFIED' ? 'bg-green-50 text-green-600 border-green-100' : 
                  doc.verification_status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {doc.verification_status_display || doc.verification_status}
              </div>
            </div>
            <div className="text-gray-400 text-[10px] font-mono font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
               <User size={12} /> Employee ID: {employeeId}
            </div>
          </div>
        </div>

        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2 border-b border-gray-50 mb-2">
          <LabelValue label="Document Type" value={doc.document_type_display || doc.document_type} />
          <LabelValue label="Document Number" value={doc.document_number} color="font-mono" />
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-x-8 px-2">
          <LabelValue label="Issue Date" value={doc.issue_date} isDate />
          <div className="flex items-center gap-3">
            <LabelValue label="Expiry Date" value={doc.expiry_date} isDate />
            {isExpiringSoon && (
              <div className="flex items-center gap-1 mt-4 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100 animate-pulse">
                <Info size={12} className="text-red-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase whitespace-nowrap">Expires in {daysToExpiry} days</span>
              </div>
            )}
            {isExpired && (
              <div className="flex items-center gap-1 mt-4 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100 animate-pulse">
                <AlertCircle size={12} />
                <span className="text-[10px] font-bold uppercase whitespace-nowrap">Expired {Math.abs(daysToExpiry)} days ago</span>
              </div>
            )}
          </div>
          <LabelValue label="Issuing Authority" value={doc.issuing_authority} />
          <LabelValue label="Verification Status" value={doc.verification_status_display || doc.verification_status} />
          <LabelValue label="Verified By" value={verifier} />
          <LabelValue label="Verified At" value={doc.verified_at} isDate />
          <LabelValue label="File Attachment" value={doc.file_url} isLink />
          <LabelValue 
            label="Record Created At" 
            value={doc.created_at ? formatDateTime(doc.created_at) : '—'} 
          />
        </div>

        {/* Notes Section - Full Width */}
        <div className="px-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Notes & Remarks</span>
          <div className="p-3 bg-gray-50 rounded-lg text-[13px] text-gray-600 border border-gray-100 italic leading-relaxed">
            {doc.notes || 'No additional notes provided.'}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};


