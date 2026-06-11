import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown, Loader2, AlertTriangle, UserMinus, Pencil, RotateCcw,
  MapPin, Phone, FileText, ClipboardList, Wallet, History, Building2, Info as LucideInfo,
  Search, Plus, RefreshCw, Users, CheckCircle, PauseCircle, AlertCircle, Eye, Download
} from 'lucide-react';
import {
  Modal, Field, Input, Sel, Section, DeleteConfirm, Badge,
  InfoCard, SectionHeader, EmptyState, VehicleTypeMultiSelect,
  RelationshipManagementFields, CreatePortalUserSection, RelationshipOverviewSection
} from './Common/CustomerCommon';
import {
  useCustomerAddresses, useCustomerContacts, useCustomerDocuments,
  useCustomerContracts, useCustomerNotes, useCustomerCreditHistory,
  useConsignees, useCustomers, useCreateConsignee, useUpdateConsignee, useDeleteConsignee,
  useConsignors, useBrokers, useAgents
} from '../../queries/customers/customersQuery';
import { useUsers } from '../../queries/users/userQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { TableShimmer, ErrorState } from '../Vehicles/Common/StateFeedback';
import CustomerListFilterBar from './Common/CustomerListFilterBar';
import { flattenValidationErrors, sanitizeProfileCreatePayload } from './Common/customerCreatePayload';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const EMPTY_FORM = {
  customer_id: '',
  legal_name: '',
  tax_id: '',
  pan_number: '',
  consignee_code: '',
  hazardous_material_handling: false,
  temperature_controlled: false,
  business_volume_tons_per_month: '',
  business_volume_value_per_month: '',
  dock_count: '',
  storage_capacity_sqft: '',
  avg_unloading_time_minutes: '',
  preferred_vehicle_types: '',
  unloading_instructions: '',
  documentation_requirements: '',
  delivery_time_slot_start: '',
  delivery_time_slot_end: '',
  receiving_hours_start: '',
  receiving_hours_end: '',
  warehouse_address: '',
  dock_available: false,
  forklift_available: false,
  sales_person_id: '',
  account_manager_id: '',
  user_id: '',
  status: 'ACTIVE',
  user: {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: ''
  }
};

const STATUS_STYLES = {
  'ACTIVE': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Active': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'INACTIVE': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Inactive': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'SUSPENDED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Suspended': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'DELETED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const getStatusStyle = (status) => STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const ConsigneesDashboard = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [ordering, setOrdering] = useState('customer__legal_name');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useConsignees({
    ...(statusFilter === 'DELETED' && { deleted_only: true }),
    ...(statusFilter && statusFilter !== 'DELETED' && { customer__status: statusFilter }),
    ...(search && { search }),
    ...(ordering && { ordering }),
    page: currentPage,
  });

  const { data: customerData } = useCustomers({ page_size: 1000 });
  const { data: consigneeData } = useConsignees({ page_size: 1000 });
  const { data: brokerData } = useBrokers({ page_size: 1000 });
  const { data: agentData } = useAgents({ page_size: 1000 });
  const { data: consignorData } = useConsignors({ page_size: 1000 });
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

  const allCustomers = customerData?.results ?? customerData ?? [];
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);
  const [createPortalUser, setCreatePortalUser] = useState(true);

  const { data: userData } = useUsers({ page_size: 1000 });
  const allUsers = userData?.results ?? userData ?? [];

  const portalUsers = useMemo(() => {
    return (allUsers || []).filter(u => u.account_type === 'PORTAL' || u.account_type === 'PORTAL_USER' || u.account_type === 'PORTAL_CLIENT' || u.account_type === 'CUSTOMER' || u.account_type === 'DRIVER');
  }, [allUsers]);

  const eligibleCustomers = allCustomers.filter(c =>
    c.customer_type === 'CONSIGNEE' ||
    c.customer_type === 'BOTH' ||
    c.customer_type === 'OTHER' ||
    c.id === form.customer_id
  );

  const createMutation = useCreateConsignee();
  const updateMutation = useUpdateConsignee();
  const deleteMutation = useDeleteConsignee();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ type: 'create' });
    setCreatePortalUser(true);
  };

  const openEdit = (c) => {
    const { customer: cust = {}, ...cons } = c;
    setForm({
      ...EMPTY_FORM,
      customer_id: cons.customer_id ?? '',
      legal_name: cust.legal_name ?? '',
      tax_id: cust.tax_id ?? '',
      pan_number: cust.pan_number ?? '',
      consignee_code: cons.consignee_code ?? '',
      business_volume_tons_per_month: cons.business_volume_tons_per_month ?? '',
      business_volume_value_per_month: cons.business_volume_value_per_month ?? '',
      hazardous_material_handling: cons.hazardous_material_handling ?? false,
      temperature_controlled: cons.temperature_controlled ?? false,
      dock_count: cons.dock_count ?? '',
      storage_capacity_sqft: cons.storage_capacity_sqft ?? '',
      avg_unloading_time_minutes: cons.avg_unloading_time_minutes ?? '',
      preferred_vehicle_types: cons.preferred_vehicle_types?.join(', ') || '',
      unloading_instructions: cons.unloading_instructions ?? '',
      documentation_requirements: cons.documentation_requirements?.join(', ') || '',
      delivery_time_slot_start: cons.delivery_time_slot_start ?? '',
      delivery_time_slot_end: cons.delivery_time_slot_end ?? '',
      receiving_hours_start: cons.receiving_hours_start ?? '',
      receiving_hours_end: cons.receiving_hours_end ?? '',
      warehouse_address: cons.warehouse_address ?? '',
      sales_person_id: cust.sales_person_id ?? cust.sales_person?.id ?? '',
      account_manager_id: cust.account_manager_id ?? cust.account_manager?.id ?? '',
      user_id: cust.user_id ?? '',
      status: cust.status ?? 'ACTIVE',
    });
    setErrors({});
    setModal({ type: 'edit', id: cons.customer_id || cons.id, consignee: c });
  };

  const openView = (c) => {
    openEdit(c);
    setModal({ type: 'view', id: c.customer_id || c.id, consignee: c });
  };

  const closeModal = () => { setModal(null); setErrors({}); };

  // Auto-generate Consignee Code when Legal Name is typed in Create mode
  useEffect(() => {
    if (modal?.type === 'create' && form.legal_name && !form.consignee_code) {
      const initials = (form.legal_name || 'CONE')
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setField('consignee_code', `CONE-${initials}-${randomSuffix}`);
    }
  }, [form.legal_name, modal?.type]);

  const validate = () => {
    const e = {};
    if (!form.legal_name?.trim()) e.legal_name = 'Legal name is required';
    
    if (!form.tax_id?.trim()) {
      e.tax_id = 'Tax ID is required';
    } else {
      const isDuplicate = allCustomers.some(c => 
        c.tax_id?.toLowerCase() === form.tax_id.trim().toLowerCase() && 
        c.id !== (String(form.customer_id) || String(modal?.consignee?.customer?.id))
      );
      if (isDuplicate) e.tax_id = 'This Tax ID is already taken by another customer';
    }

    if (!form.pan_number?.trim()) {
      e.pan_number = 'PAN number is required';
    } else {
      const isDuplicate = allCustomers.some(c => 
        c.pan_number?.toLowerCase() === form.pan_number.trim().toLowerCase() && 
        c.id !== (String(form.customer_id) || String(modal?.consignee?.customer?.id))
      );
      if (isDuplicate) e.pan_number = 'This PAN number is already taken by another customer';
    }
    if (!form.consignee_code?.trim()) {
      const initials = (form.legal_name || 'CONE').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      form.consignee_code = `CONE-${initials}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (createPortalUser && modal?.type === 'create') {
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
    if (modal?.type === 'create' && !createPortalUser && !form.user_id) {
      e.user_id = 'Select an existing linked user or create a portal user';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [key]: value }));
    }
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = sanitizeProfileCreatePayload(form, {
      createPortalUser,
      isCreate: modal.type === 'create',
    });

    // Process documentation requirements
    if (typeof payload.documentation_requirements === 'string') {
      payload.documentation_requirements = payload.documentation_requirements.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(payload.documentation_requirements)) {
      payload.documentation_requirements = [];
    }

    // Explicitly set null for empty fields
    const nullFields = [
      'sales_person_id', 'account_manager_id', 'user_id', 'warehouse_address',
      'dock_count', 'storage_capacity_sqft', 'avg_unloading_time_minutes',
      'delivery_time_slot_start', 'delivery_time_slot_end',
      'receiving_hours_start', 'receiving_hours_end'
    ];
    nullFields.forEach(key => {
      if (payload[key] === '' || (typeof payload[key] === 'string' && !payload[key].trim())) {
        payload[key] = null;
      }
    });

    if (modal.type === 'create') {
      createMutation.mutate(payload, {
        onError: (err) => {
          const fieldErrors = flattenValidationErrors(err.response?.data);
          if (err.response?.status === 400 && fieldErrors) {
            setErrors(fieldErrors);
          } else {
            setErrors(prev => ({ ...prev, _generic: `Create Failed: ${err.response?.data?.detail || err.message}` }));
          }
        }
      });
    } else {
      updateMutation.mutate({ id: modal.id, data: payload }, {
        onSuccess: () => closeModal(),
        onError: (err) => {
          const fieldErrors = flattenValidationErrors(err.response?.data);
          if (err.response?.status === 400 && fieldErrors) {
            setErrors(fieldErrors);
          } else {
            setErrors(prev => ({ ...prev, _generic: `Update Failed: ${err.response?.data?.detail || err.message}` }));
          }
        }
      });
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const consignees = data?.results ?? data ?? [];
  const total = data?.count ?? consignees.length;
  const active = consignees.filter(c => c.customer?.status === 'ACTIVE' || c.customer?.status === 'Active').length;
  const inactive = consignees.filter(c => c.customer?.status === 'INACTIVE' || c.customer?.status === 'Inactive').length;
  const suspended = consignees.filter(c => c.customer?.status === 'SUSPENDED' || c.customer?.status === 'Suspended').length;

  const resetFilters = () => { setSearch(''); setStatus(''); setOrdering('customer__legal_name'); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Customer Code',
      render: c => (
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <span className="font-mono text-[13px] font-black text-[#172B4D] block uppercase">
            {c.customer?.customer_code ?? '—'}
          </span>
          <span className="text-[9px] font-mono text-blue-500/60 tracking-tighter uppercase font-bold block">
            Cone: {c.consignee_code ?? '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Legal Name',
      render: c => (
        <div className="text-left py-1">
          <span className="font-bold text-[#172B4D] text-[13px] block leading-tight">
            {c.customer?.legal_name || c.legal_name || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Operations',
      render: c => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">Dock: <span className={c.dock_available ? "text-green-600" : "text-gray-500"}>{c.dock_available ? 'Available' : 'Not Available'}</span></span>
          <span className="font-semibold text-gray-600">Forklift: <span className={c.forklift_available ? "text-green-600" : "text-gray-500"}>{c.forklift_available ? 'Available' : 'Not Available'}</span></span>
        </div>
      ),
    },
    {
      header: 'Capacity',
      render: c => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">Dock Count: {c.dock_count || '—'}</span>
          <span className="font-semibold text-gray-600">Storage: {c.storage_capacity_sqft ? `${c.storage_capacity_sqft} sqft` : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: c => {
        const status = c.customer?.is_deleted ? 'DELETED' : (c.customer?.status || 'ACTIVE');
        const st = getStatusStyle(status);
        return (
          <Badge className={`${st.bg} ${st.text} border-transparent`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: c => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(c); }}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all active:scale-95 shadow-sm"
          >
            <Pencil size={12} /> Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* Page Title & Search Section */}
      <div className="flex items-center mb-8">
        {/* Title Block */}
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Consignees</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage consignee profiles and logistics</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search consignee name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50  transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              title="Refresh Data"
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 group"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span>Refresh</span>
            </button>
            <button
              title="Export Consignees"
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
                <span className="text-[18px] font-black text-orange-500">{inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Suspended:</span>
                <span className="text-[18px] font-black text-red-500">{suspended}</span>
              </div>
            </>
          )}
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={openCreate}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Consignee
            </button>
          </div>
        </div>

        <CustomerListFilterBar
          statusFilter={statusFilter}
          onStatusChange={(value) => { setStatus(value); setCurrentPage(1); }}
          statusOptions={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'BLACKLISTED', label: 'Blacklisted' },
            { value: 'DELETED', label: 'Deleted' },
          ]}
          ordering={ordering}
          onOrderingChange={(value) => { setOrdering(value); setCurrentPage(1); }}
          orderingOptions={[
            { value: 'customer__legal_name', label: 'Name A-Z' },
            { value: '-customer__legal_name', label: 'Name Z-A' },
            { value: '-created_at', label: 'Newest' },
            { value: 'created_at', label: 'Oldest' },
          ]}
          clearVisible={statusFilter || ordering !== 'customer__legal_name'}
          onClearFilters={resetFilters}
          currentPage={currentPage}
          onPrevPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNextPage={() => setCurrentPage(prev => prev + 1)}
          hasNextPage={!!data?.next}
          isLoading={isLoading}
        />

        {isLoading && <TableShimmer rows={8} cols={5} />}

        {isError && (
          <ErrorState message="Failed to load consignees" error={error?.response?.data?.detail || error?.message} onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="px-4 py-4">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {consignees.map(c => (
                  <tr
                    key={c.id || (c.customer?.customer_code + '-' + c.consignee_code)}
                    onClick={() => openView(c)}
                    className="hover:bg-blue-50/40 transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-[#0052CC] group/row"
                  >
                    {COLUMNS.map(col => (
                      <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(c)}</td>
                    ))}
                  </tr>
                ))}
                {consignees.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-8">
                      <EmptyState icon={UserMinus} text="No consignees found" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Row */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
              Showing <span className="font-bold text-[#172B4D]">{consignees.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> consignees
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirm label="Consignee"
          message={deleteError}
          onClose={() => { setDelete(null); setDeleteError(null); }}
          onConfirm={() => {
            setDeleteError(null);
            deleteMutation.mutate(deleteTarget.customer_id || deleteTarget.id, {
              onSuccess: () => { setDelete(null); setDeleteError(null); },
              onError: (err) => {
                setDeleteError(`Delete Failed: ${err.response?.data?.detail || err.message}`);
              }
            });
          }}
          deleting={deleteMutation.isPending} />
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Consignee' : `Edit — ${modal.consignee?.customer?.legal_name || modal.consignee?.consignee_code}`}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.consignee); } : null}
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            {errors._generic && (
              <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} /> {errors._generic}
              </div>
            )}

            {/* Portal Account prioritization */}
            {modal.type === 'create' && (
              <CreatePortalUserSection
                createPortalUser={createPortalUser}
                setCreatePortalUser={setCreatePortalUser}
                form={form}
                setField={setField}
                errors={errors}
                moduleName="Consignee"
              />
            )}

            <RelationshipManagementFields
              form={form}
              setField={setField}
              allUsers={allUsers}
              errors={errors}
              portalUsers={portalUsers}
              userToCustomerMap={userToCustomerMap}
              initial={modal.consignee}
              createPortalUser={createPortalUser}
              disabled={modal.type === 'view'}
            />

            <Section title="Consignee Details" className="col-span-2" />
            <Field label="Legal Name" required error={errors.legal_name}>
              <Input
                value={form.legal_name || ''}
                onChange={e => setField('legal_name', e.target.value)}
                disabled={modal.type === 'edit' || modal.type === 'view'}
                placeholder="Enter customer legal name..."
                className="bg-white"
              />
            </Field>
            <Field label="Tax ID (GSTIN)" required error={errors.tax_id}>
              <Input
                value={form.tax_id || ''}
                onChange={e => setField('tax_id', e.target.value)}
                disabled={modal.type === 'view'}
                placeholder="e.g. 27AAACR5055K1ZV"
                className="bg-white"
              />
            </Field>
            <Field label="PAN Number" required error={errors.pan_number}>
              <Input
                value={form.pan_number || ''}
                onChange={e => setField('pan_number', e.target.value)}
                disabled={modal.type === 'view'}
                placeholder="e.g. AAACR5055K"
                className="bg-white"
              />
            </Field>
            <Field label="Status">
              <Sel value={form.status} onChange={e => setField('status', e.target.value)} disabled={modal.type === 'view'}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLACKLISTED">Blacklisted</option>
              </Sel>
            </Field>

            <Section title="Operations" className="col-span-2" />
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#172B4D] bg-gray-50 border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" disabled={modal.type === 'view'}
                  checked={form.dock_available} onChange={e => setField('dock_available', e.target.checked)} />
                <span className="flex-1">Dock Available</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#172B4D] bg-gray-50 border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" disabled={modal.type === 'view'}
                  checked={form.forklift_available} onChange={e => setField('forklift_available', e.target.checked)} />
                <span className="flex-1">Forklift Available</span>
              </label>
            </div>

            <Section title="Delivery & Receiving Schedule" className="col-span-2" />
            <Field label="Delivery Slot Start">
              <Input type="time" value={form.delivery_time_slot_start || ''} disabled={modal.type === 'view'} onChange={e => setField('delivery_time_slot_start', e.target.value)} />
            </Field>
            <Field label="Delivery Slot End">
              <Input type="time" value={form.delivery_time_slot_end || ''} disabled={modal.type === 'view'} onChange={e => setField('delivery_time_slot_end', e.target.value)} />
            </Field>
            <Field label="Receiving Hours Start">
              <Input type="time" value={form.receiving_hours_start || ''} disabled={modal.type === 'view'} onChange={e => setField('receiving_hours_start', e.target.value)} />
            </Field>
            <Field label="Receiving Hours End">
              <Input type="time" value={form.receiving_hours_end || ''} disabled={modal.type === 'view'} onChange={e => setField('receiving_hours_end', e.target.value)} />
            </Field>
            <Field label="Dock Count">
              <Input type="number" value={form.dock_count || ''} disabled={modal.type === 'view'} onChange={e => setField('dock_count', e.target.value)} />
            </Field>
            <Field label="Storage Capacity (sqft)">
              <Input type="number" value={form.storage_capacity_sqft || ''} disabled={modal.type === 'view'} onChange={e => setField('storage_capacity_sqft', e.target.value)} />
            </Field>
            <Field label="Avg Unloading Time (mins)">
              <Input type="number" value={form.avg_unloading_time_minutes || ''} disabled={modal.type === 'view'} onChange={e => setField('avg_unloading_time_minutes', e.target.value)} />
            </Field>
            <Field label="Documentation Requirements" className="col-span-2">
              <Input value={form.documentation_requirements || ''} onChange={e => setField('documentation_requirements', e.target.value)} disabled={modal.type === 'view'}
                placeholder="Invoice, E-Way Bill, Gate Pass" />
            </Field>
            <Field label="Unloading Instructions" className="col-span-2">
              <Input value={form.unloading_instructions} onChange={e => setField('unloading_instructions', e.target.value)} disabled={modal.type === 'view'} />
            </Field>




          </div>
        </Modal>
      )}

      {modal?.type === 'view' && (
        <Modal
          title={`View — ${modal.consignee?.customer?.legal_name || modal.consignee?.consignee_code}`}
          onClose={closeModal}
          maxWidth="max-w-4xl"
          isView={true}
        >
          <ConsigneeOverview
            consignee={modal.consignee}
            onEdit={() => {
              const c = modal.consignee;
              closeModal();
              setTimeout(() => openEdit(c), 100);
            }}
          />
        </Modal>
      )}
    </div>
  );
};





const ConsigneeOverview = ({ consignee: c, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    {/* Shared Relationship Info at the very TOP */}
    <RelationshipOverviewSection item={c} showWarehouse={false} />

    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={c.customer?.legal_name} accent />
      <InfoCard label="Customer Code" value={c.customer?.customer_code} />
      <InfoCard label="Consignee Code" value={c.consignee_code} />
      <InfoCard label="Hazardous Handling" value={c.hazardous_material_handling ? 'Yes' : 'No'} />
      <InfoCard label="Temp Controlled" value={c.temperature_controlled ? 'Yes' : 'No'} />
    </div>

    <Section title="Receiving Capacity" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Dock Count" value={c.dock_count} />
      <InfoCard label="Storage Capacity" value={c.storage_capacity_sqft ? `${c.storage_capacity_sqft} sqft` : null} />
      <InfoCard label="Avg Unloading Time" value={c.avg_unloading_time_minutes ? `${c.avg_unloading_time_minutes} mins` : null} />
    </div>

    <Section title="Schedule & Instructions" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Delivery Slot" value={c.delivery_time_slot_start && c.delivery_time_slot_end ? `${c.delivery_time_slot_start} - ${c.delivery_time_slot_end}` : null} />
      <InfoCard label="Receiving Hours" value={c.receiving_hours_start && c.receiving_hours_end ? `${c.receiving_hours_start} - ${c.receiving_hours_end}` : null} />
      <InfoCard label="Docs Required" value={c.documentation_requirements?.join(', ')} />

      <InfoCard label="Unloading Instructions" value={c.unloading_instructions} />
    </div>



    <div className="pt-3 border-t border-gray-100 flex justify-end items-center gap-4">
      <p className="text-[10px] text-gray-400 font-mono italic mr-auto">Created: {c.created_at ? formatDateTime(c.created_at) : '—'}</p>
    </div>
  </div>
);


export default ConsigneesDashboard;
