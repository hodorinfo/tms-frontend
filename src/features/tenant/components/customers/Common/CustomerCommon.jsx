import React from 'react';
import {
  Plus, Edit2, Loader2, Save, Trash2, X,
  AlertCircle, ChevronDown, Info as LucideInfo
} from 'lucide-react';

// Central UI components from VehicleCommon
import {
  Badge, InfoCard, SectionHeader, EmptyState, Label,
  Input, Sel, Section, Textarea, Field, Modal, DeleteConfirm,
  VehicleTypeMultiSelect
} from '../../Vehicles/Common/VehicleCommon';

// Re-export for sub-modules
export {
  Badge, InfoCard, SectionHeader, EmptyState, Label,
  Input, Sel, Section, Textarea, Field, Modal, DeleteConfirm,
  VehicleTypeMultiSelect
};

/**
 * Shared section for Sales Person and Account Manager assignment
 */
export const RelationshipManagementFields = ({
  form,
  setField,
  allUsers,
  errors = {},
  portalUsers = [],
  userToCustomerMap = {},
  initial = null,
  createPortalUser = false,
  disabled = false
}) => {
  return (
    <>
      {/* <Section title="Relationship Management" className="col-span-2" />
      <Field label="Sales Person" error={errors.sales_person_id}>
        <Sel
          value={form.sales_person_id || ''}
          onChange={e => setField('sales_person_id', e.target.value)}
          disabled={disabled}
        >
          <option value="">-- No Assignment --</option>
          {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
            <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
          ))}
        </Sel>
      </Field>
      <Field label="Account Manager" error={errors.account_manager_id}>
        <Sel
          value={form.account_manager_id || ''}
          onChange={e => setField('account_manager_id', e.target.value)}
          disabled={disabled}
        >
          <option value="">-- No Assignment --</option>
          {allUsers.filter(u => u.account_type === 'EMPLOYEE' || u.account_type === 'MANAGER').map(u => (
            <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
          ))}
        </Sel>
      </Field> */}

      {!createPortalUser && (
        <Field label="Existing Login Account" className="col-span-2" error={errors.user_id}>
          <Sel
            value={form.user_id || ''}
            onChange={e => setField('user_id', e.target.value)}
            disabled={disabled}
          >
            <option value="">-- No Linked User --</option>
            {portalUsers
              .filter(u => {
                const linkedTo = userToCustomerMap[String(u.id)];
                const currentUserId = initial?.user_id || initial?.customer?.user_id || initial?.customer?.user?.id;
                const isCurrent = String(u.id) === String(currentUserId || '');
                // HIDE if linked to someone else.
                // SHOW if not linked OR linked to the CURRENT entity being edited.
                if (isCurrent) return true;

                // SPECIAL FILTER: User must be of type CUSTOMER but NOT yet assigned to a subtype (linkedTo).
                if (u.account_type !== 'CUSTOMER') return false; 
                if (linkedTo) return false;

                return true;
              })
              .map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.username}{u.full_name ? ` (${u.username})` : ''}
                </option>
              ))}
          </Sel>
        </Field>
      )}
    </>
  );
};

/**
 * Shared section for creating a new portal user directly from the customer form
 */
export const CreatePortalUserSection = ({
  createPortalUser,
  setCreatePortalUser,
  form,
  setField,
  errors = {},
  moduleName = "Customer"
}) => {
  return (
    <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={createPortalUser}
          onChange={e => setCreatePortalUser(e.target.checked)}
          className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-bold text-[#172B4D]">Create New Login Account for this {moduleName}</span>
      </label>

      {createPortalUser && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Field label="Username" required error={errors['user.username']}>
            <Input
              value={form.user.username || ''}
              onChange={e => setField('user.username', e.target.value)}
              placeholder="john_doe"
            />
          </Field>
          <Field label="Email Address" required error={errors['user.email']}>
            <Input
              type="email"
              value={form.user.email || ''}
              onChange={e => setField('user.email', e.target.value)}
              placeholder="john@example.com"
            />
          </Field>
          <Field label="Password" required error={errors['user.password']}>
            <Input
              type="password"
              value={form.user.password || ''}
              onChange={e => setField('user.password', e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm Password" required error={errors['user.password_confirm']}>
            <Input
              type="password"
              value={form.user.password_confirm || ''}
              onChange={e => setField('user.password_confirm', e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="First Name" required error={errors['user.first_name']}>
            <Input
              value={form.user.first_name || ''}
              onChange={e => setField('user.first_name', e.target.value)}
              placeholder="John"
            />
          </Field>
          <Field label="Last Name" error={errors['user.last_name']}>
            <Input
              value={form.user.last_name || ''}
              onChange={e => setField('user.last_name', e.target.value)}
              placeholder="Doe"
            />
          </Field>
          <Field label="Phone Number" required error={errors['user.phone']}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold select-none pointer-events-none">+91</span>
              <Input
                value={form.user.phone || ''}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setField('user.phone', val);
                }}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                className="pl-12"
              />
            </div>
            {form.user.phone && !/^[6-9]\d{9}$/.test(form.user.phone) && (
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                Must be 10 digits starting with 6, 7, 8, or 9
              </p>
            )}
          </Field>
        </div>
      )}
    </div>
  );
};

export const RelationshipOverviewSection = ({ item, showWarehouse = true }) => {
  const cust = item?.customer || item;
  return (
    <>
      <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-between group transition-all hover:border-blue-200 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-inner">
              {(cust?.portal_user?.first_name?.[0] || cust?.user?.first_name?.[0] || cust?.portal_user?.username?.[0] || cust?.user?.username?.[0] || '?').toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#172B4D]">
                {cust?.portal_user?.full_name || cust?.user?.full_name || cust?.portal_user?.username || cust?.user?.username || 'No Access Account Linked'}
              </h3>
              {(cust?.portal_user || cust?.user) && <Badge className="bg-blue-50 text-[#0052CC] border-blue-100 text-[10px] font-bold px-2 py-0.5">Active</Badge>}
            </div>
            <p className="text-sm text-gray-500 font-medium">{cust?.portal_user?.email || cust?.user?.email || 'No email associated'}</p>
            {(cust?.portal_user || cust?.user) && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {(cust?.portal_user?.account_type || cust?.user?.account_type || 'Customer')} Access
              </p>
            )}
          </div>
        </div>

        {(cust?.portal_user || cust?.user) && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Dashboard Access Enabled</span>
          </div>
        )}
      </div>
      {showWarehouse && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <InfoCard label="Warehouse Address" value={item.warehouse_address || 'Not Provided'} />
        </div>
      )}
    </>
  );
};
