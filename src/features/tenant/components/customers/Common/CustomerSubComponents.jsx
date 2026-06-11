import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, MapPin, Phone, FileText, ClipboardList, Info as LucideInfo, 
  History, Wallet, Pencil, Eye, Loader2, MessageSquare, Briefcase, User, Upload
} from 'lucide-react';
import { 
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments, 
  useCustomerContracts, useCustomerCreditHistory, useCustomerNotes,
  useCreateCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress,
  useCreateCustomerContact, useUpdateCustomerContact, useDeleteCustomerContact,
  useCreateCustomerDocument, useUpdateCustomerDocument, useDeleteCustomerDocument,
  useCreateCustomerContract, useUpdateCustomerContract, useDeleteCustomerContract,
  useCreateCustomerNote, useUpdateCustomerNote, useDeleteCustomerNote
} from '../../../queries/customers/customersQuery';
import { useCurrentUser } from '../../../queries/users/userActionQuery';
import { Badge, InfoCard, SectionHeader, EmptyState, Section, Modal, Field, Input, Sel, DeleteConfirm, ItemActions } from '../../Vehicles/Common/VehicleCommon';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

// ── Tab: Overview ────────────────────────────────────────────────────
export const CustomerOverview = ({ customer: c, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-between group transition-all hover:border-blue-200">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-inner">
            {(c?.portal_user?.first_name?.[0] || c?.portal_user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#172B4D]">
              {c?.portal_user?.full_name || c?.portal_user?.username || 'No Login Account Linked'}
            </h3>
            {c?.portal_user && <Badge className="bg-blue-50 text-[#0052CC] border-blue-100 text-[10px] font-bold px-2 py-0.5">Active</Badge>}
          </div>
          <p className="text-sm text-gray-500 font-medium">{c?.portal_user?.email || 'No email associated'}</p>
          {c?.portal_user && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {c.portal_user.account_type || 'Customer'} Access
            </p>
          )}
        </div>
      </div>

      {c?.portal_user && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Dashboard Access Enabled</span>
        </div>
      )}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={c?.legal_name} accent />
      <InfoCard label="Customer Code" value={c?.customer_code} />
      <InfoCard label="Trading Name" value={c?.trading_name} />
      <InfoCard label="Type" value={c?.customer_type} />
      <InfoCard label="Business Type" value={c?.business_type} />
      <InfoCard label="Industry Sector" value={c?.industry_sector} />
      <InfoCard label={c?.document_type ? c.document_type.replace('_', ' ') : 'Website'} value={c?.website} />
      <InfoCard label="Notes" value={c?.notes} />
    </div>


    <Section title="Tax & Registration" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Tax ID (GSTIN)" value={c?.tax_id} />
      <InfoCard label="PAN Number" value={c?.pan_number} />
      <InfoCard label="Registration No." value={c?.registration_number} />
      <InfoCard label="Incorporation Date" value={c?.incorporation_date ? formatDate(c.incorporation_date) : null} />
    </div>

    <Section title="Financial Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Credit Limit" value={c?.credit_limit ? `₹${Number(c.credit_limit).toLocaleString('en-IN')}` : null} />
      <InfoCard label="Customer Tier" value={c?.customer_tier} />
      <InfoCard label="Payment Terms" value={c?.payment_terms} />
      <InfoCard label="Status" value={c?.status} />
    </div>

    {onEdit && (
      <div className="pt-3 border-t border-gray-100 flex justify-end">
        <button onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all shadow-sm">
          <Pencil size={14} /> Edit Customer
        </button>
      </div>
    )}
  </div>
);

// ── Tab: Addresses ──────────────────────────────────────────────────
export const CustomerAddresses = ({ customerId }) => {
  const [modal, setModal] = useState(null); // 'ADD' | 'EDIT' | 'DELETE'
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerAddresses(customerId);
  const createMutation = useCreateCustomerAddress(customerId);
  const updateMutation = useUpdateCustomerAddress(customerId);
  const deleteMutation = useDeleteCustomerAddress(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const addresses = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Stored Addresses" 
        count={addresses.length} 
        icon={MapPin} 
        onAdd={() => setModal('ADD')}
        addLabel="Add Address"
      />
      
      {addresses.length === 0 ? (
        <EmptyState text="No addresses found" icon={MapPin} onAdd={() => setModal('ADD')} addLabel="Add First Address" />
      ) : (
        <div className="grid gap-3">
          {addresses.map(addr => (
            <div key={addr.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-start group">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <MapPin size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0052CC]">{addr.address_type}</span>
                    {addr.is_default && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#172B4D] leading-tight">{addr.address_line1}</p>
                  {addr.address_line2 && <p className="text-xs text-gray-500 mt-0.5">{addr.address_line2}</p>}
                  <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tight">
                    {addr.city}, {addr.state} — {addr.postal_code}
                  </p>
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions 
                  onEdit={() => { setSelected(addr); setModal('EDIT'); }}
                  onDelete={() => { setSelected(addr); setModal('DELETE'); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <AddressFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(data) => {
            if (modal === 'ADD') createMutation.mutate(data, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Address"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const AddressFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || {
    address_line1: '', address_line2: '', city: '', state: '',
    country: 'India', postal_code: '', landmark: '', address_type: 'REGISTERED', is_default: false
  });

  return (
    <Modal title={initial ? 'Edit Address' : 'Add New Address'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Address Line 1" className="col-span-2" required>
          <Input value={form.address_line1} onChange={e => setForm({...form, address_line1: e.target.value})} />
        </Field>
        <Field label="Address Line 2" className="col-span-2">
          <Input value={form.address_line2} onChange={e => setForm({...form, address_line2: e.target.value})} />
        </Field>
        <Field label="City" required>
          <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
        </Field>
        <Field label="State" required>
          <Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
        </Field>
        <Field label="Postal Code" required>
          <Input value={form.postal_code} onChange={e => setForm({...form, postal_code: e.target.value})} />
        </Field>
        <Field label="Landmark">
          <Input value={form.landmark || ''} onChange={e => setForm({...form, landmark: e.target.value})} placeholder="e.g. Near City Center" />
        </Field>
        <Field label="Address Type">
          <Sel value={form.address_type} onChange={e => setForm({...form, address_type: e.target.value})}>
            <option value="REGISTERED">REGISTERED</option>
            <option value="BILLING">BILLING</option>
            <option value="SHIPPING">SHIPPING</option>
            <option value="WAREHOUSE">WAREHOUSE</option>
            <option value="OTHER">OTHER</option>
          </Sel>
        </Field>
        <label className="flex items-center gap-2 col-span-2 cursor-pointer mt-2">
          <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})} className="w-4 h-4 text-[#0052CC] rounded" />
          <span className="text-xs font-bold text-gray-600">Set as default address</span>
        </label>
      </div>
    </Modal>
  );
};

// ── Tab: Contacts ───────────────────────────────────────────────────
export const CustomerContacts = ({ customerId, portalUser }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerContacts(customerId);
  const createMutation = useCreateCustomerContact(customerId);
  const updateMutation = useUpdateCustomerContact(customerId);
  const deleteMutation = useDeleteCustomerContact(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const contacts = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Contact Directory" 
        count={contacts.length} 
        icon={Phone} 
        onAdd={() => setModal('ADD')}
        addLabel="Add Contact"
      />

      {contacts.length === 0 ? (
        <EmptyState text="No contacts found" icon={Phone} onAdd={() => setModal('ADD')} addLabel="Add First Contact" />
      ) : (
        <div className="grid gap-3">
          {contacts.map(contact => (
            <div key={contact.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#172B4D] font-black text-sm border border-gray-100">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-[#172B4D]">{contact.first_name} {contact.last_name}</p>
                    <div className="flex gap-1">
                      {contact.is_primary && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Primary</Badge>}
                      {contact.status && (
                        <Badge className={`${contact.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {contact.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{contact.designation || contact.contact_type || 'Staff'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {contact.email && <span className="text-[11px] text-[#0052CC] font-mono flex items-center gap-1"><FileText size={10} /> {contact.email}</span>}
                    {contact.mobile && <span className="text-[11px] text-gray-500 font-bold flex items-center gap-1"><Phone size={10} /> {contact.mobile}</span>}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions 
                  onEdit={() => { setSelected(contact); setModal('EDIT'); }}
                  onDelete={() => { setSelected(contact); setModal('DELETE'); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <ContactFormModal 
          initial={modal === 'EDIT' ? selected : null}
          portalUser={portalUser}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(data) => {
            if (modal === 'ADD') createMutation.mutate(data, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Contact"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const ContactFormModal = ({ initial, onClose, onSubmit, submitting, portalUser }) => {
  const [form, setForm] = useState(initial || {
    salutation: '', first_name: '', last_name: '', email: '', 
    mobile: '', phone: '', fax: '', designation: '', 
    department: '', contact_type: 'PRIMARY', is_primary: false,
    status: 'ACTIVE'
  });
  const [phoneErrors, setPhoneErrors] = useState({});

  const PHONE_REGEX = /^[6-9]\d{9}$/;

  const handlePhoneChange = (field, rawVal) => {
    const digits = rawVal.replace(/\D/g, '').slice(0, 10);
    setForm(prev => ({ ...prev, [field]: digits }));
    if (digits && !PHONE_REGEX.test(digits)) {
      setPhoneErrors(prev => ({ ...prev, [field]: 'Must be 10 digits starting with 6, 7, 8, or 9' }));
    } else {
      setPhoneErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleContactSubmit = () => {
    const e = {};
    if (form.mobile && !PHONE_REGEX.test(form.mobile)) e.mobile = 'Enter a valid 10-digit Indian mobile number (starting with 6–9)';
    if (form.phone && !PHONE_REGEX.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number (starting with 6–9)';
    if (Object.keys(e).length > 0) { setPhoneErrors(e); return; }
    onSubmit(form);
  };

  // Auto-fill from portal user on create
  useEffect(() => {
    if (!initial && portalUser) {
      setForm(prev => ({
        ...prev,
        first_name: portalUser.first_name || portalUser.full_name?.split(' ')[0] || '',
        last_name: portalUser.last_name || portalUser.full_name?.split(' ').slice(1).join(' ') || '',
        email: portalUser.email || '',
      }));
    }
  }, [portalUser]);

  return (
    <Modal title={initial ? 'Edit Contact' : 'Add New Contact'} onClose={onClose} onSubmit={handleContactSubmit} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Salutation">
          <Input value={form.salutation} onChange={e => setForm({...form, salutation: e.target.value})} placeholder="Mr. / Ms. / Dr." />
        </Field>
        <Field label="First Name" required>
          <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
        </Field>
        <Field label="Last Name" required>
          <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </Field>
        <Field label="Mobile Number" required error={phoneErrors.mobile}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold select-none pointer-events-none">+91</span>
            <Input
              value={form.mobile}
              onChange={e => handlePhoneChange('mobile', e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              inputMode="numeric"
              className="pl-12"
            />
          </div>
          {phoneErrors.mobile && <p className="text-[11px] text-red-500 mt-1 font-medium">{phoneErrors.mobile}</p>}
        </Field>
        <Field label="Phone (Alt)" error={phoneErrors.phone}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold select-none pointer-events-none">+91</span>
            <Input
              value={form.phone}
              onChange={e => handlePhoneChange('phone', e.target.value)}
              placeholder="9876543210"
              maxLength={10}
              inputMode="numeric"
              className="pl-12"
            />
          </div>
          {phoneErrors.phone && <p className="text-[11px] text-red-500 mt-1 font-medium">{phoneErrors.phone}</p>}
        </Field>
        <Field label="Fax">
          <Input value={form.fax} onChange={e => setForm({...form, fax: e.target.value})} />
        </Field>
        <Field label="Department">
          <Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Finance" />
        </Field>
        <Field label="Designation">
          <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Operations Manager" />
        </Field>
        <Field label="Contact Type">
          <Sel value={form.contact_type} onChange={e => setForm({...form, contact_type: e.target.value})}>
            <option value="PRIMARY">PRIMARY</option>
            <option value="ACCOUNTS">ACCOUNTS</option>
            <option value="OPERATIONS">OPERATIONS</option>
            <option value="SALES">SALES</option>
            <option value="OTHER">OTHER</option>
          </Sel>
        </Field>
        <Field label="Status">
          <Sel value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Sel>
        </Field>
        <label className="flex items-center gap-2 col-span-2 cursor-pointer mt-2">
          <input type="checkbox" checked={form.is_primary} onChange={e => setForm({...form, is_primary: e.target.checked})} className="w-4 h-4 text-[#0052CC] rounded" />
          <span className="text-xs font-bold text-gray-600">Primary contact person</span>
        </label>
      </div>
    </Modal>
  );
};

// ── Tab: Documents ──────────────────────────────────────────────────
export const CustomerDocuments = ({ customerId }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useCustomerDocuments(customerId);
  const createMutation = useCreateCustomerDocument(customerId);
  const updateMutation = useUpdateCustomerDocument(customerId);
  const deleteMutation = useDeleteCustomerDocument(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const docs = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Compliance Documents" 
        count={docs.length} 
        icon={FileText} 
        onAdd={() => setModal('ADD')}
        addLabel="Upload Document"
      />

      {docs.length === 0 ? (
        <EmptyState text="No documents uploaded" icon={FileText} onAdd={() => setModal('ADD')} addLabel="Upload First Document" />
      ) : (
        <div className="grid gap-3">
          {docs.map(doc => (
            <div key={doc.id} className="p-3 pr-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#172B4D]">{doc.document_type}</p>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">{doc.document_number}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge className={
                      doc.verified_status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' :
                      doc.verified_status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                      doc.verified_status === 'PENDING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }>
                      {doc.verified_status || 'NOT_SET'}
                    </Badge>
                    {doc.expiry_date && (
                      <span className="text-[10px] font-bold text-gray-400">Expires: {formatDate(doc.expiry_date)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all">
                  <Eye size={14} />
                </a>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemActions 
                    onEdit={() => { setSelected(doc); setModal('EDIT'); }}
                    onDelete={() => { setSelected(doc); setModal('DELETE'); }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <DocumentFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); setErrors({}); }}
          onSubmit={(payload) => {
            const options = {
              onSuccess: () => { setModal(null); setErrors({}); },
              onError: (err) => {
                if (err.response?.status === 400 && err.response.data?.details) {
                  setErrors(err.response.data.details);
                }
              }
            };
            if (modal === 'ADD') createMutation.mutate(payload, options);
            else updateMutation.mutate({ id: selected.id, data: payload }, options);
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
          externalErrors={errors}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Document"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const DocumentFormModal = ({ initial, onClose, onSubmit, submitting, externalErrors }) => {
  const fileRef = useRef(null);
  const { data: currentUser } = useCurrentUser();
  const [form, setForm] = useState({
    document_type: 'GST_CERTIFICATE',
    document_name: '',
    document_number: '',
    file_url: '',
    issue_date: '',
    expiry_date: '',
    remarks: '',
    verified_status: 'PENDING',
    verification_status: 'PENDING',
    status: 'VALID',
    verified_by: null,
    verified_date: null,
    ...initial,
    file: null
  });

  const [localErrors, setLocalErrors] = useState({});
  const errors = { ...externalErrors, ...localErrors };

  const setField = (k, v) => {
    setForm(prev => {
      const updates = { [k]: v };
      // Sync all status variations
      if (k === 'verified_status' || k === 'verification_status' || k === 'status') {
        const statusVal = v;
        updates.verified_status = statusVal;
        updates.verification_status = statusVal;
        updates.status = statusVal === 'VERIFIED' ? 'VALID' : 'PENDING';
        
        if (statusVal === 'VERIFIED') {
          const now = new Date().toISOString();
          updates.verified_by = currentUser?.id || prev.verified_by;
          updates.verified_date = now;
          updates.verified_at = now;
        } else if (statusVal === 'REJECTED' || statusVal === 'PENDING') {
          updates.verified_by = null;
          updates.verified_date = null;
          updates.verified_at = null;
        }
      }
      return { ...prev, ...updates };
    });
    if (localErrors[k]) setLocalErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const TYPES = ['GST_CERTIFICATE', 'PAN_CARD', 'CIN', 'REGISTRATION', 'AADHAR', 'VOTER_ID', 'PASSPORT', 'TAX_EXEMPTION', 'OTHER'];
  const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'INCOMPLETE', label: 'Incomplete' },
    { value: 'EXPIRED', label: 'Expired' },
  ];

  const handleSubmit = () => {
    const e = {};
    if (form.issue_date && form.expiry_date) {
      if (new Date(form.issue_date) >= new Date(form.expiry_date)) {
        e.expiry_date = 'Expiry date must be strictly after the issue date';
        e.issue_date = 'Issue date must be strictly before the expiry date';
      }
    }
    setLocalErrors(e);
    if (Object.keys(e).length > 0) return;

    // Clean up payload for backend
    const payload = { ...form };
    
    if (payload.file_url && payload.file_url.startsWith('/')) {
      payload.file_url = window.location.origin + payload.file_url;
    }

    payload.issue_date = payload.issue_date || null;
    payload.expiry_date = payload.expiry_date || null;

    // Use FormData only if a new file is present, otherwise send JSON for better compatibility with choice fields
    if (payload.file) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (k === 'file' && !v) return;
        if (v !== null && v !== undefined) {
          formData.append(k, v);
        }
      });
      onSubmit(formData);
    } else {
      // Remove file key for JSON submission
      const { file, ...jsonPayload } = payload;
      onSubmit(jsonPayload);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const cleanName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      setForm(prev => ({
        ...prev,
        file: file,
        file_url: `/temp_docs/${cleanName}`,
        document_name: prev.document_name || cleanName.split('.')[0].substring(0, 50).replace(/[-_]/g, ' ')
      }));
      if (localErrors.file_url) setLocalErrors(prev => { const { file_url, ...rest } = prev; return rest; });
    }
  };

  return (
    <Modal title={initial ? 'Edit Document' : 'Upload Document'} onClose={onClose} onSubmit={handleSubmit} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Document Type" required>
          <Sel value={form.document_type} onChange={e => setField('document_type', e.target.value)}>
            {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Sel>
        </Field>
        <Field label="Document Name" error={errors.document_name}>
          <Input value={form.document_name} onChange={e => setField('document_name', e.target.value)} placeholder="e.g. GST Registration Copy" />
        </Field>
        <Field label="Document Number" required error={errors.document_number}>
          <Input value={form.document_number} onChange={e => setField('document_number', e.target.value)} />
        </Field>
        <Field label="Status">
          <Sel value={form.verified_status} onChange={e => setField('verified_status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Sel>
        </Field>
        <Field label="File URL" required error={errors.file_url}>
          <Input value={form.file_url} onChange={e => setField('file_url', e.target.value)} placeholder="Direct link to file (e.g. S3/Storage URL)" />
        </Field>
        <Field label="Issue Date" error={errors.issue_date}>
          <Input type="date" value={form.issue_date || ''} onChange={e => setField('issue_date', e.target.value)} />
        </Field>
        <Field label="Expiry Date" error={errors.expiry_date}>
          <Input type="date" value={form.expiry_date || ''} onChange={e => setField('expiry_date', e.target.value)} />
        </Field>
        <Field label="Remarks" className="col-span-2" error={errors.remarks}>
          <Input value={form.remarks} onChange={e => setField('remarks', e.target.value)} />
        </Field>
        <div className="col-span-2">
          <input 
            type="file" 
            ref={fileRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          <div 
            onClick={() => fileRef.current?.click()}
            className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center justify-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all mb-3 shadow-sm">
              <Upload size={20} />
            </div>
            <p className="text-sm font-bold text-[#172B4D] mb-1">
              {form.file_url ? 'Change Document' : 'Select Document'}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {form.file_url ? form.file_url.split('/').pop() : 'Click to browse files'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── Tab: Contracts ──────────────────────────────────────────────────
export const CustomerContracts = ({ customerId }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerContracts(customerId);
  const createMutation = useCreateCustomerContract(customerId);
  const updateMutation = useUpdateCustomerContract(customerId);
  const deleteMutation = useDeleteCustomerContract(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const contracts = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Service Contracts" 
        count={contracts.length} 
        icon={Briefcase} 
        onAdd={() => setModal('ADD')}
        addLabel="Create Contract"
      />

      {contracts.length === 0 ? (
        <EmptyState text="No contracts found" icon={Briefcase} onAdd={() => setModal('ADD')} addLabel="Create First Contract" />
      ) : (
        <div className="grid gap-3">
          {contracts.map(contract => (
            <div key={contract.id} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-all flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Type</span>
                  <span className="text-xs font-black text-[#172B4D]">{contract.contract_type?.[0] || 'C'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-black text-[#172B4D]">{contract.contract_type} — {contract.contract_number || 'N/A'}</p>
                    <Badge className={contract.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700'}>{contract.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Starts: {formatDate(contract.start_date)}</span>
                    {contract.end_date && <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Ends: {formatDate(contract.end_date)}</span>}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ItemActions 
                  onEdit={() => { setSelected(contract); setModal('EDIT'); }}
                  onDelete={() => { setSelected(contract); setModal('DELETE'); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <ContractFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(payload) => {
            if (modal === 'ADD') createMutation.mutate(payload, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Contract"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const ContractFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || {
    contract_type: 'ANNUAL', start_date: '', end_date: '', 
    status: 'ACTIVE', terms: '', contract_number: ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const e = {};
    if (form.start_date && form.end_date) {
      if (new Date(form.start_date) >= new Date(form.end_date)) {
        e.start_date = 'Start date must be strictly before the end date';
        e.end_date = 'End date must be strictly after the start date';
      }
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit(form);
  };

  return (
    <Modal title={initial ? 'Edit Contract' : 'Create Contract'} onClose={onClose} onSubmit={handleSubmit} submitting={submitting}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contract Number" className="col-span-2">
          <Input value={form.contract_number} onChange={e => setForm({...form, contract_number: e.target.value})} placeholder="e.g. CON-2024-001" />
        </Field>
        <Field label="Contract Type" required>
          <Sel value={form.contract_type} onChange={e => setForm({...form, contract_type: e.target.value})}>
            <option value="ANNUAL">ANNUAL</option>
            <option value="QUARTERLY">QUARTERLY</option>
            <option value="MONTHLY">MONTHLY</option>
            <option value="PROJECT_BASED">PROJECT_BASED</option>
          </Sel>
        </Field>
        <Field label="Status">
          <Sel value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="TERMINATED">TERMINATED</option>
          </Sel>
        </Field>
        <Field label="Start Date" required error={errors.start_date}>
          <Input type="date" value={form.start_date} onChange={e => {
            setForm({...form, start_date: e.target.value});
            setErrors(prev => ({ ...prev, start_date: null }));
          }} />
        </Field>
        <Field label="End Date" error={errors.end_date}>
          <Input type="date" value={form.end_date} onChange={e => {
            setForm({...form, end_date: e.target.value});
            setErrors(prev => ({ ...prev, end_date: null }));
          }} />
        </Field>
        <Field label="Terms & Conditions" className="col-span-2">
          <textarea 
            className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/10 focus:border-[#0052CC] transition-all resize-none"
            value={form.terms}
            onChange={e => setForm({...form, terms: e.target.value})}
            placeholder="Contractual terms..."
          />
        </Field>
      </div>
    </Modal>
  );
};

// ── Tab: Notes ──────────────────────────────────────────────────────
export const CustomerNotes = ({ customerId }) => {
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useCustomerNotes(customerId);
  const createMutation = useCreateCustomerNote(customerId);
  const updateMutation = useUpdateCustomerNote(customerId);
  const deleteMutation = useDeleteCustomerNote(customerId);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const notes = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Internal Notes" 
        count={notes.length} 
        icon={MessageSquare} 
        onAdd={() => setModal('ADD')}
        addLabel="Add Note"
      />

      {notes.length === 0 ? (
        <EmptyState text="No notes found" icon={MessageSquare} onAdd={() => setModal('ADD')} addLabel="Add First Note" />
      ) : (
        <div className="grid gap-4">
          {notes.map(note => (
            <div key={note.id} className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 transition-all group relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0052CC]">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#172B4D]">{note.created_by_name || 'System User'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{formatDateTime(note.created_at)}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemActions 
                    onEdit={() => { setSelected(note); setModal('EDIT'); }}
                    onDelete={() => { setSelected(note); setModal('DELETE'); }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{note.content || note.note}</p>
              {note.note_type && (
                <Badge className="mt-4 bg-gray-50 text-gray-500 border-gray-200 tracking-widest uppercase">{note.note_type}</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {(modal === 'ADD' || modal === 'EDIT') && (
        <NoteFormModal 
          initial={modal === 'EDIT' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSubmit={(payload) => {
            if (modal === 'ADD') createMutation.mutate(payload, { onSuccess: () => setModal(null) });
            else updateMutation.mutate({ id: selected.id, data: payload }, { onSuccess: () => setModal(null) });
          }}
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {modal === 'DELETE' && (
        <DeleteConfirm 
          label="Note"
          onClose={() => setModal(null)}
          onConfirm={() => deleteMutation.mutate(selected.id, { onSuccess: () => setModal(null) })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

const NoteFormModal = ({ initial, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState(initial || { note: '', note_type: 'GENERAL' });

  return (
    <Modal title={initial ? 'Edit Note' : 'Add Note'} onClose={onClose} onSubmit={() => onSubmit(form)} submitting={submitting}>
      <div className="space-y-4">
        <Field label="Note Content">
          <textarea 
            className="w-full min-h-[120px] p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0052CC]/10 focus:border-[#0052CC] transition-all resize-none"
            value={form.note || ''}
            onChange={e => setForm({...form, note: e.target.value})}
            placeholder="Write your internal note here..."
          />
        </Field>
        <Field label="Note Type">
          <Sel value={form.note_type} onChange={e => setForm({...form, note_type: e.target.value})}>
            <option value="GENERAL">GENERAL</option>
            <option value="COMPLAINT">COMPLAINT</option>
            <option value="COMPLIMENT">COMPLIMENT</option>
            <option value="REQUEST">REQUEST</option>
            <option value="FOLLOW_UP">FOLLOW_UP</option>
          </Sel>
        </Field>
      </div>
    </Modal>
  );
};

// ── Tab: Credit History ─────────────────────────────────────────────
export const CustomerCreditHistoryView = ({ customerId, currentLimit }) => {
  const { data, isLoading } = useCustomerCreditHistory(customerId);
  if (isLoading) return <div className="flex justify-center p-12"><Loader2 size={24} className="animate-spin text-[#0052CC]" /></div>;

  const history = data?.results ?? data ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <SectionHeader title="Credit Limit History" count={history.length} icon={History} />
      <div className="p-4 bg-[#EBF3FF] rounded-xl border border-[#0052CC]/10 mb-6">
        <p className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-1 text-center">Current Active Limit</p>
        <p className="text-3xl font-black text-[#172B4D] text-center">₹{Number(currentLimit || 0).toLocaleString('en-IN')}</p>
      </div>
      
      {history.length === 0 ? (
        <EmptyState text="No history entries" icon={History} />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
          {history.map(entry => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[2.15rem] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#0052CC]" />
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-black text-[#172B4D]">₹{Number(entry.credit_limit).toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{formatDate(entry.effective_date)}</span>
              </div>
              {entry.reason && <p className="text-xs text-gray-400 leading-tight italic">Reason: {entry.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
