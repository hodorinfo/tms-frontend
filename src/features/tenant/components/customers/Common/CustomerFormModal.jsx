import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Loader2, Save, Trash2, X
} from 'lucide-react';
import {
  useCustomers, useCreateCustomer, useUpdateCustomer,
  useConsignors, useConsignees, useBrokers, useAgents
} from '../../../queries/customers/customersQuery';
import { useUsers } from '../../../queries/users/userQuery';
import { useDrivers } from '../../../queries/drivers/driverCoreQuery';
import {
  Modal, Field, Input, Sel, Section,
  RelationshipManagementFields, CreatePortalUserSection
} from './CustomerCommon';
import { flattenValidationErrors } from './customerCreatePayload';

export const EMPTY_FORM = {
  legal_name: '',
  trading_name: '',
  customer_type: 'CONSIGNOR',
  status: 'ACTIVE',
  tax_id: '',
  pan_number: '',
  registration_number: '',
  incorporation_date: '',
  credit_limit: '',
  customer_tier: 'STANDARD',
  payment_terms: '',
  credit_rating: '',
  credit_score: '',
  business_type: '',
  industry_sector: '',
  website: '',
  document_type: '',
  notes: '',
  // sales_person_id: '',
  // account_manager_id: '',
  // parent_customer_id: '',
  user_id: '',
  user: {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    account_type: 'CUSTOMER'
  }
};

export const CustomerFormModal = ({ initial, onClose, onSuccess }) => {
  const { data: customerData } = useCustomers({ page_size: 1000 });
  const { data: consignorData } = useConsignors({ page_size: 1000 });
  const { data: consigneeData } = useConsignees({ page_size: 1000 });
  const { data: brokerData } = useBrokers({ page_size: 1000 });
  const { data: agentData } = useAgents({ page_size: 1000 });
  const { data: driverData } = useDrivers({ page_size: 1000 });

  const allEntities = useMemo(() => {
    const customers = customerData?.results ?? customerData ?? [];
    const consignors = consignorData?.results ?? consignorData ?? [];
    const consignees = consigneeData?.results ?? consigneeData ?? [];
    const brokers = brokerData?.results ?? brokerData ?? [];
    const agents = agentData?.results ?? agentData ?? [];
    const drivers = driverData?.results ?? driverData ?? [];
    return [...customers, ...consignors, ...consignees, ...brokers, ...agents, ...drivers];
  }, [customerData, consignorData, consigneeData, brokerData, agentData, driverData]);

  const userToCustomerMap = useMemo(() => {
    const map = {};
    allEntities.forEach(c => {
      // Check all possible ID paths, including nested ones found in sub-modules
      const uid = c.user?.id ||
        c.user_id ||
        c.portal_user_id ||
        c.portal_user?.id ||
        c.customer?.user?.id ||
        c.customer?.user_id ||
        c.customer?.portal_user_id ||
        (typeof c.user !== 'object' ? c.user : null) ||
        (typeof c.portal_user !== 'object' ? c.portal_user : null);

      if (uid) {
        // Use any available name field, including nested ones
        const name = c.legal_name ||
          c.trading_name ||
          c.name ||
          c.customer?.legal_name ||
          c.customer?.trading_name ||
          'Another Entity';

        map[String(uid)] = name;
      }
    });
    return map;
  }, [allEntities]);

  const { data: userData } = useUsers({ page_size: 1000 });
  const allUsers = userData?.results ?? userData ?? [];

  const portalUsers = useMemo(() => {
    return (allUsers || []).filter(u => u.account_type === 'PORTAL' || u.account_type === 'PORTAL_USER' || u.account_type === 'PORTAL_CLIENT' || u.account_type === 'CUSTOMER' || u.account_type === 'DRIVER');
  }, [allUsers]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const [createPortalUser, setCreatePortalUser] = useState(true);

  const isEdit = !!initial?.id;

  useEffect(() => {
    if (initial) {
      setForm({
        legal_name: initial.legal_name ?? '',
        trading_name: initial.trading_name ?? '',
        customer_type: initial.customer_type ?? 'CONSIGNOR',
        status: initial.status ?? 'ACTIVE',
        tax_id: initial.tax_id ?? '',
        pan_number: initial.pan_number ?? '',
        registration_number: initial.registration_number ?? '',
        incorporation_date: initial.incorporation_date ?? '',
        credit_limit: initial.credit_limit ?? '',
        customer_tier: initial.customer_tier ?? 'STANDARD',
        payment_terms: initial.payment_terms ?? '',
        credit_rating: initial.credit_rating ?? '',
        credit_score: initial.credit_score ?? '',
        business_type: initial.business_type ?? '',
        industry_sector: initial.industry_sector ?? '',
        website: initial.website ?? '',
        document_type: initial.document_type ?? '',
        notes: initial.notes ?? '',
        // sales_person_id: initial.sales_person_id ?? initial.sales_person?.id ?? '',
        // account_manager_id: initial.account_manager_id ?? initial.account_manager?.id ?? '',
        // parent_customer_id: initial.parent_customer_id ?? '',
        user_id: initial.user_id ?? '',
        user: EMPTY_FORM.user
      });
      setCreatePortalUser(false);
    } else {
      setForm(EMPTY_FORM);
      setCreatePortalUser(true);
    }
  }, [initial]);

  const setField = (k, v) => {
    if (k.includes('.')) {
      const [parent, child] = k.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: v }
      }));
    } else {
      setForm(prev => ({ ...prev, [k]: v }));
    }
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    const allCustomers = customerData?.results ?? customerData ?? [];
    if (!form.legal_name.trim()) {
      e.legal_name = 'Legal name is required';
    } else {
      const isDuplicate = allCustomers.some(c =>
        c.legal_name?.toLowerCase() === form.legal_name.trim().toLowerCase() &&
        c.id !== initial?.id
      );
      if (isDuplicate) e.legal_name = 'This legal name is already taken';
    }
    if (!form.customer_type) e.customer_type = 'Select a type';

    if (!form.tax_id?.trim()) {
      e.tax_id = 'Tax ID is required';
    } else {
      const isDuplicate = allCustomers.some(c =>
        c.tax_id?.toLowerCase() === form.tax_id.trim().toLowerCase() &&
        c.id !== initial?.id
      );
      if (isDuplicate) e.tax_id = 'This Tax ID is already taken by another customer';
    }

    if (!form.pan_number?.trim()) {
      e.pan_number = 'PAN number is required';
    } else {
      const isDuplicate = allCustomers.some(c =>
        c.pan_number?.toLowerCase() === form.pan_number.trim().toLowerCase() &&
        c.id !== initial?.id
      );
      if (isDuplicate) e.pan_number = 'This PAN number is already taken by another customer';
    }

    if (createPortalUser && !isEdit) {
      if (!form.user.email) e['user.email'] = 'Email is required';
      if (!form.user.username) e['user.username'] = 'Username is required';
      if (!form.user.password) e['user.password'] = 'Password is required';
      if (form.user.password !== form.user.password_confirm) e['user.password_confirm'] = 'Passwords must match';
      if (!form.user.first_name) e['user.first_name'] = 'First name is required';
      if (!form.user.phone) {
        e['user.phone'] = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(form.user.phone)) {
        e['user.phone'] = 'Enter a valid 10-digit Indian mobile number (starting with 6–9)';
      }
    }

    if (!isEdit && !createPortalUser && !form.user_id) {
      e.user_id = 'Select an existing user or enable portal user creation';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...form };

    if (payload.credit_limit === '' || payload.credit_limit == null) delete payload.credit_limit;
    else payload.credit_limit = String(payload.credit_limit);

    if (payload.credit_score === '' || payload.credit_score == null) delete payload.credit_score;
    else payload.credit_score = Number(payload.credit_score);

    ['credit_rating', 'payment_terms', 'registration_number', 'website', 'notes', 'business_type', 'industry_sector', 'trading_name'].forEach((key) => {
      if (payload[key] === '' || payload[key] == null) delete payload[key];
    });

    ['user_id', 'sales_person_id', 'account_manager_id', 'parent_customer_id', 'incorporation_date'].forEach(key => {
      if (typeof payload[key] === 'string' && !payload[key].trim()) payload[key] = null;
    });

    // customer_code is system-generated
    delete payload.customer_code;

    // Handle nested user object — backend accepts either user_id OR user, never both
    if (!createPortalUser || isEdit) {
      delete payload.user;
    } else {
      delete payload.user_id;
      Object.keys(payload.user).forEach((k) => {
        if (typeof payload.user[k] === 'string') payload.user[k] = payload.user[k].trim();
      });
    }

    if (!isEdit) {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          const fieldErrors = flattenValidationErrors(err.response?.data);
          if (fieldErrors) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      });
    } else {
      updateMutation.mutate({ id: initial.id, data: payload }, {
        onSuccess: () => {
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          const fieldErrors = flattenValidationErrors(err.response?.data);
          if (fieldErrors) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      });
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={!isEdit ? 'Add New Customer' : `Edit — ${initial?.legal_name}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Portal User creation at the very beginning as requested */}
        {!isEdit && (
          <CreatePortalUserSection
            createPortalUser={createPortalUser}
            setCreatePortalUser={setCreatePortalUser}
            form={form}
            setField={setField}
            errors={errors}
            moduleName="Customer"
          />
        )}

        {/* Relationship fields moved and commented out */}
        <RelationshipManagementFields
          form={form}
          setField={setField}
          allUsers={allUsers}
          errors={errors}
          portalUsers={portalUsers}
          userToCustomerMap={userToCustomerMap}
          initial={initial}
          createPortalUser={createPortalUser}
          disabled={false}
        />

        <Section title="Basic Information" className="col-span-2" />

        <Field label="Legal Name" required error={errors.legal_name} info="Must be unique across all customers">
          <Input value={form.legal_name} onChange={e => setField('legal_name', e.target.value)}
            placeholder="Full legal name" />
        </Field>
        <Field label="Trading Name">
          <Input value={form.trading_name} onChange={e => setField('trading_name', e.target.value)}
            placeholder="Short / trading name" />
        </Field>
        <Field label="Customer Type" required error={errors.customer_type}>
          <Sel value={form.customer_type} onChange={e => setField('customer_type', e.target.value)}>
            <option value="CONSIGNOR">CONSIGNOR</option>
            <option value="CONSIGNEE">CONSIGNEE</option>
            <option value="BOTH">BOTH</option>
            <option value="BROKER">BROKER</option>
            <option value="AGENT">AGENT</option>
            <option value="OTHER">OTHER</option>
          </Sel>
        </Field>

        <Field label="Status">
          <Sel value={form.status} onChange={e => setField('status', e.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLACKLISTED">BLACKLISTED</option>
          </Sel>
        </Field>

        <Section title="Tax & Registration" className="col-span-2" />

        <Field label="Tax ID (GSTIN)" required error={errors.tax_id}>
          <Input value={form.tax_id} onChange={e => setField('tax_id', e.target.value)}
            placeholder="e.g. 27AAACR5055K1ZV" />
        </Field>
        <Field label="PAN Number" required error={errors.pan_number}>
          <Input value={form.pan_number} onChange={e => setField('pan_number', e.target.value)}
            placeholder="e.g. AAACR5055K" />
        </Field>
        <Field label="Registration No.">
          <Input value={form.registration_number} onChange={e => setField('registration_number', e.target.value)}
            placeholder="e.g. U52100DL..." />
        </Field>
        <Field label="Incorporation Date">
          <Input type="date" value={form.incorporation_date} onChange={e => setField('incorporation_date', e.target.value)} />
        </Field>

        <Section title="Financial Details" className="col-span-2" />

        <Field label="Credit Limit (₹)">
          <Input type="number" value={form.credit_limit || ''} onChange={e => setField('credit_limit', e.target.value)}
            placeholder="Optional — e.g. 1000000" />
        </Field>
        <Field label="Customer Tier">
          <Sel value={form.customer_tier} onChange={e => setField('customer_tier', e.target.value)}>
            <option value="PLATINUM">PLATINUM</option>
            <option value="GOLD">GOLD</option>
            <option value="SILVER">SILVER</option>
            <option value="STANDARD">STANDARD</option>
          </Sel>
        </Field>
        <Field label="Payment Terms">
          <Input value={form.payment_terms || ''} onChange={e => setField('payment_terms', e.target.value)}
            placeholder="Optional — e.g. Net 30" />
        </Field>
        <Field label="Credit Rating">
          <Input value={form.credit_rating || ''} onChange={e => setField('credit_rating', e.target.value)}
            placeholder="Optional — e.g. A+, BBB" />
        </Field>
        <Field label="Credit Score">
          <Input type="number" value={form.credit_score || ''} onChange={e => setField('credit_score', e.target.value)}
            placeholder="Optional — e.g. 780" />
        </Field>

        <Section title="Additional Info" className="col-span-2" />

        <Field label="Business Type">
          <Input value={form.business_type} onChange={e => setField('business_type', e.target.value)}
            placeholder="e.g. Pvt Ltd" />
        </Field>
        <Field label="Industry Sector">
          <Input value={form.industry_sector} onChange={e => setField('industry_sector', e.target.value)}
            placeholder="e.g. Logistics" />
        </Field>
        <Field label="Website" className="col-span-2">
          <div className="flex gap-2">
            <Sel className="w-1/3" value={form.document_type || ''} onChange={e => setField('document_type', e.target.value)}>
              <option value="">Select Document Type</option>
              <option value="GST_CERTIFICATE">GST Certificate</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="CIN">CIN</option>
              <option value="REGISTRATION">Registration</option>
              <option value="AADHAR">Aadhar</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="TAX_EXEMPTION">Tax Exemption</option>
              <option value="OTHER">Other</option>
            </Sel>
            <Input className="flex-1" value={form.website} onChange={e => setField('website', e.target.value)}
              placeholder="Website URL (https://...)" />
          </div>
        </Field>

        <Field label="Notes" className="col-span-2">
          <Input value={form.notes} onChange={e => setField('notes', e.target.value)}
            placeholder="Additional notes..." />
        </Field>
      </div>
    </Modal>
  );
};
