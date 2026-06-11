import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown, Loader2, AlertTriangle, UserPlus, Pencil, RotateCcw,
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
  useConsignors, useCustomers, useCreateConsignor, useUpdateConsignor, useDeleteConsignor,
  useConsignees, useBrokers, useAgents
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
  consignor_code: '',
  hazardous_material_handling: false,
  temperature_controlled: false,
  business_volume_tons_per_month: '',
  business_volume_value_per_month: '',
  loading_bay_count: '',
  avg_loading_time_minutes: '',
  preferred_vehicle_types: '',
  warehouse_address: '',
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
    phone: '',
    account_type: 'CUSTOMER'
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

const Consignors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [ordering, setOrdering] = useState('customer__legal_name');
  const [currentPage, setCurrentPage] = useState(1);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useConsignors({
    page: currentPage,
    ...(statusFilter === 'DELETED' && { deleted_only: true }),
    ...(statusFilter && statusFilter !== 'DELETED' && { customer__status: statusFilter }),
    ...(ordering && { ordering }),
    ...(debouncedSearch && { search: debouncedSearch }),
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

  // For Consignor-specific `warehouse_address` FK selection.
  const { data: customerAddressData, isLoading: isCustomerAddressesLoading } = useCustomerAddresses(form.customer_id);
  const customerAddresses = customerAddressData?.results ?? customerAddressData ?? [];

  const warehouseAddressCandidates = (Array.isArray(customerAddresses) ? customerAddresses : []).filter(a => a.address_type === 'WAREHOUSE');
  const warehouseAddressOptions = warehouseAddressCandidates.length > 0 ? warehouseAddressCandidates : (Array.isArray(customerAddresses) ? customerAddresses : []);

  const eligibleCustomers = allCustomers.filter(c =>
    c.customer_type === 'CONSIGNOR' ||
    c.customer_type === 'BOTH' ||
    c.customer_type === 'OTHER' ||
    c.id === form.customer_id
  );

  // Auto-generate Consignor Code when Customer is selected in Create mode
  useEffect(() => {
    if (modal?.type === 'create' && form.customer_id && !form.consignor_code) {
      const customer = eligibleCustomers.find(c => c.id === form.customer_id);
      if (customer) {
        const initials = (customer.legal_name || 'CONS')
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 3);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        setField('consignor_code', `CONS-${initials}-${randomSuffix}`);
      }
    }
  }, [form.customer_id, modal?.type]);

  const selectedWarehouseAddress = useMemo(() => {
    const targetId = modal?.consignor?.warehouse_address;
    if (!targetId) return null;
    if (isCustomerAddressesLoading) return "Loading Address...";
    const addr = customerAddresses.find(a => String(a.id) === String(targetId) || String(a.uuid) === String(targetId));
    return addr ? `${addr.address_line_1}${addr.city ? `, ${addr.city}` : ''}` : targetId;
  }, [customerAddresses, modal?.consignor?.warehouse_address, isCustomerAddressesLoading]);

  const createMutation = useCreateConsignor();
  const updateMutation = useUpdateConsignor();
  const deleteMutation = useDeleteConsignor();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ type: 'create' });
    setCreatePortalUser(true);
  };

  const openEdit = (cl) => {
    const { customer: cust = {}, ...consi } = cl;
    setForm({
      customer_id: consi.customer_id ?? '',
      legal_name: cust.legal_name ?? '',
      tax_id: cust.tax_id ?? '',
      pan_number: cust.pan_number ?? '',
      consignor_code: consi.consignor_code ?? '',
      business_volume_tons_per_month: consi.business_volume_tons_per_month ?? '',
      business_volume_value_per_month: consi.business_volume_value_per_month ?? '',
      hazardous_material_handling: consi.hazardous_material_handling ?? false,
      temperature_controlled: consi.temperature_controlled ?? false,
      loading_bay_count: consi.loading_bay_count ?? '',
      avg_loading_time_minutes: consi.avg_loading_time_minutes ?? '',
      preferred_vehicle_types: consi.preferred_vehicle_types?.join(', ') || '',
      warehouse_address: consi.warehouse_address ?? '',
      sales_person_id: cust.sales_person_id ?? cust.sales_person?.id ?? '',
      account_manager_id: cust.account_manager_id ?? cust.account_manager?.id ?? '',
      user_id: cust.user_id ?? '',
      status: cust.status ?? 'ACTIVE',
    });
    setErrors({});
    // URL is /api/v1/consignors/<customer_id>/ — same as consignees & delete (customer_id first)
    setModal({ type: 'edit', id: consi.customer_id || consi.id, consignor: cl });
  };

  const openView = (c) => {
    openEdit(c);
    setModal({ type: 'view', id: c.customer_id || c.id, consignor: c });
  };

  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.legal_name?.trim()) e.legal_name = 'Legal name is required';
    
    if (!form.tax_id?.trim()) {
      e.tax_id = 'Tax ID is required';
    } else {
      const isDuplicate = allCustomers.some(c => 
        c.tax_id?.toLowerCase() === form.tax_id.trim().toLowerCase() && 
        c.id !== (String(form.customer_id) || String(modal?.consignor?.customer?.id))
      );
      if (isDuplicate) e.tax_id = 'This Tax ID is already taken by another customer';
    }

    if (!form.pan_number?.trim()) {
      e.pan_number = 'PAN number is required';
    } else {
      const isDuplicate = allCustomers.some(c => 
        c.pan_number?.toLowerCase() === form.pan_number.trim().toLowerCase() && 
        c.id !== (String(form.customer_id) || String(modal?.consignor?.customer?.id))
      );
      if (isDuplicate) e.pan_number = 'This PAN number is already taken by another customer';
    }
    if (!form.consignor_code?.trim()) e.consignor_code = 'Consignor code is required';

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

    // Process preferred vehicle types
    if (typeof payload.preferred_vehicle_types === 'string') {
      payload.preferred_vehicle_types = payload.preferred_vehicle_types.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(payload.preferred_vehicle_types)) {
      payload.preferred_vehicle_types = [];
    }

    // Explicitly set null for empty fields to avoid backend validation errors
    ['sales_person_id', 'account_manager_id', 'user_id', 'warehouse_address'].forEach(key => {
      if (typeof payload[key] === 'string' && !payload[key].trim()) payload[key] = null;
    });

    if (modal.type === 'create') {
      createMutation.mutate(payload, {
        onSuccess: () => closeModal(),
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
      const customerId =
        form.customer_id ||
        modal.consignor?.customer_id ||
        modal.consignor?.customer?.id ||
        modal.id;
      updateMutation.mutate(
        { id: modal.id, customerId, data: payload },
        {
          onSuccess: () => closeModal(),
          onError: (err) => {
            const fieldErrors = flattenValidationErrors(err.response?.data);
            if (err.response?.status === 400 && fieldErrors) {
              setErrors(fieldErrors);
            } else {
              setErrors(prev => ({ ...prev, _generic: `Update Failed: ${err.response?.data?.detail || err.message}` }));
            }
          },
        }
      );
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  const consignors = data?.results ?? data ?? [];
  const total = data?.count ?? consignors.length;
  const active = consignors.filter(c => c.customer?.status === 'ACTIVE' || c.customer?.status === 'Active').length;
  const inactive = consignors.filter(c => c.customer?.status === 'INACTIVE' || c.customer?.status === 'Inactive').length;
  const suspended = consignors.filter(c => c.customer?.status === 'SUSPENDED' || c.customer?.status === 'Suspended').length;

  const resetFilters = () => { setSearchTerm(''); setStatus(''); setOrdering('customer__legal_name'); setCurrentPage(1); };

  const COLUMNS = [
    {
      header: 'Customer Code',
      render: c => (
        <div className="flex flex-col items-start gap-0.5 leading-none">
          <span className="font-mono text-[13px] font-black text-[#172B4D] block">
            {c.customer?.customer_code ?? '—'}
          </span>
          <span className="text-[9px] font-mono text-blue-500/60 tracking-tighter uppercase font-bold block">
            Cons: {c.consignor_code ?? '—'}
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
          <span className="font-semibold text-gray-600">Hazardous: <span className={c.hazardous_material_handling ? "text-red-500" : "text-green-600"}>{c.hazardous_material_handling ? 'Yes' : 'No'}</span></span>
          <span className="font-semibold text-gray-600">Temp Ctrl: <span className={c.temperature_controlled ? "text-blue-500" : "text-gray-500"}>{c.temperature_controlled ? 'Yes' : 'No'}</span></span>
        </div>
      ),
    },
    {
      header: 'Business Volume',
      render: c => (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-gray-600">Tons/M: {c.business_volume_tons_per_month || '—'}</span>
          <span className="font-semibold text-gray-600">Value/M: {c.business_volume_value_per_month ? `₹${Number(c.business_volume_value_per_month).toLocaleString('en-IN')}` : '—'}</span>
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
          <h2 className="text-2xl font-bold text-[#172B4D]">Consignors</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage consignor profiles and logistics</p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search consignor name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50  transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
              title="Export Consignors"
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
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Consignor
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
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-400">
            <AlertTriangle size={32} />
            <p className="text-sm font-medium">Failed to load consignors</p>
            <p className="text-xs text-gray-400">{error?.response?.data?.detail || error?.message}</p>
            <button onClick={() => refetch()} className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8]">Try Again</button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
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
                  {consignors.map(c => (
                    <tr
                      key={c.id || (c.customer?.customer_code + '-' + c.consignor_code)}
                      onClick={() => openView(c)}
                      className="hover:bg-blue-50/40 transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-[#0052CC] group/row"
                    >
                      {COLUMNS.map(col => (
                        <td key={col.header} className="px-4 py-3 whitespace-nowrap align-middle">{col.render(c)}</td>
                      ))}
                    </tr>
                  ))}
                  {consignors.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-gray-400">
                        <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No consignors found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Info Row */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D]">{consignors.length}</span> of <span className="font-bold text-[#172B4D]">{total}</span> consignors
              </div>
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirm
          label="Consignor Profile"
          message={deleteError}
          onClose={() => { setDelete(null); setDeleteError(null); }}
          onConfirm={() => {
            const delId = deleteTarget.customer_id || deleteTarget.id;
            setDeleteError(null);
            deleteMutation.mutate(delId, {
              onSuccess: () => { setDelete(null); setDeleteError(null); },
              onError: (err) => {
                setDeleteError(`Delete Failed: ${err.response?.data?.detail || err.message}`);
              }
            });
          }}
          deleting={deleteMutation.isPending}
        />
      )}

      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <Modal
          title={modal.type === 'create' ? 'Add New Consignor' : `Edit — ${modal.consignor?.customer?.legal_name || modal.consignor?.consignor_code}`}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          onDelete={modal.type === 'edit' ? () => { closeModal(); setDelete(modal.consignor); } : null}
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
                moduleName="Consignor"
              />
            )}

            <RelationshipManagementFields
              form={form}
              setField={setField}
              allUsers={allUsers}
              errors={errors}
              portalUsers={portalUsers}
              userToCustomerMap={userToCustomerMap}
              initial={modal.consignor}
              createPortalUser={createPortalUser}
              disabled={modal.type === 'view'}
            />

            <Section title="Consignor Details" className="col-span-2" />
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
                  checked={form.hazardous_material_handling} onChange={e => setField('hazardous_material_handling', e.target.checked)} />
                <span className="flex-1">Hazardous Material Handling</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#172B4D] bg-gray-50 border border-gray-200 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]" disabled={modal.type === 'view'}
                  checked={form.temperature_controlled} onChange={e => setField('temperature_controlled', e.target.checked)} />
                <span className="flex-1">Temperature Controlled</span>
              </label>
            </div>

            <Section title="Business Volume & Logistics" className="col-span-2" />
            <Field label="Business Volume (Tons/Mo)">
              <Input type="number" value={form.business_volume_tons_per_month || ''} disabled={modal.type === 'view'} onChange={e => setField('business_volume_tons_per_month', e.target.value)} />
            </Field>
            <Field label="Business Volume (Value/Mo)">
              <Input type="number" value={form.business_volume_value_per_month || ''} disabled={modal.type === 'view'} onChange={e => setField('business_volume_value_per_month', e.target.value)} />
            </Field>

            <Field label="Loading Bay Count">
              <Input type="number" value={form.loading_bay_count || ''} disabled={modal.type === 'view'} onChange={e => setField('loading_bay_count', e.target.value)} />
            </Field>
            <Field label="Avg Loading Time (mins)">
              <Input type="number" value={form.avg_loading_time_minutes || ''} disabled={modal.type === 'view'} onChange={e => setField('avg_loading_time_minutes', e.target.value)} />
            </Field>

            <Field label="Preferred Vehicle Types" className="col-span-2">
              <VehicleTypeMultiSelect
                value={form.preferred_vehicle_types}
                onChange={val => setField('preferred_vehicle_types', val)}
                disabled={modal.type === 'view'}
              />
            </Field>
            <Field label="Warehouse Address" className="col-span-2">
              <Sel
                value={form.warehouse_address || ''}
                onChange={(e) => setField('warehouse_address', e.target.value)}
                disabled={modal.type === 'view' || (modal.type === 'create' && !form.customer_id)}
              >
                <option value="">-- Select Warehouse Address --</option>
                {isCustomerAddressesLoading ? (
                  <option value="" disabled>Loading...</option>
                ) : (
                  warehouseAddressOptions.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.address_type}: {addr.address_line1} ({addr.city})
                    </option>
                  ))
                )}
              </Sel>
              <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                Addresses are not typed here. Open <strong>Customers → select customer → Stored Addresses → Add Address</strong> (use type WAREHOUSE), then edit this consignor and pick it from the dropdown.
              </p>
            </Field>

          </div>
        </Modal>
      )}

      {modal?.type === 'view' && (
        <Modal
          title={`View — ${modal.consignor?.customer?.legal_name || modal.consignor?.consignor_code}`}
          onClose={closeModal}
          maxWidth="max-w-4xl"
          isView={true}
        >
          <ConsignorOverview
            consignor={modal.consignor}
            onEdit={() => {
              const c = modal.consignor;
              closeModal();
              setTimeout(() => openEdit(c), 100);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

// TABS removed as per user request to simplify the view



const ConsignorOverview = ({ consignor: c, onEdit }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    {/* Shared Relationship Info at the very TOP */}
    <RelationshipOverviewSection item={c} />

    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Legal Name" value={c.customer?.legal_name} accent />
      <InfoCard label="Customer Code" value={c.customer?.customer_code} />
      <InfoCard label="Consignor Code" value={c.consignor_code} />
      <InfoCard label="Status" value={c.customer?.status} />
    </div>

    <Section title="Tax & Identification" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Tax ID (GSTIN)" value={c.customer?.tax_id} />
      <InfoCard label="PAN Number" value={c.customer?.pan_number} />
    </div>

    <Section title="Operations" />
    <div className="grid grid-cols-2 gap-4">
      <InfoCard label="Hazardous Handling" value={c.hazardous_material_handling ? 'Yes' : 'No'} />
      <InfoCard label="Temp Controlled" value={c.temperature_controlled ? 'Yes' : 'No'} />
    </div>

    <Section title="Logistics Details" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Loading Bays" value={c.loading_bay_count} />
      <InfoCard label="Avg Loading Time" value={c.avg_loading_time_minutes ? `${c.avg_loading_time_minutes} mins` : null} />
      <InfoCard label="Preferred Vehicles" value={c.preferred_vehicle_types?.join(', ')} />
    </div>

    <Section title="Business Volume" />
    <div className="grid grid-cols-2 gap-3">
      <InfoCard label="Monthly Tons" value={c.business_volume_tons_per_month} />
      <InfoCard label="Monthly Value" value={c.business_volume_value_per_month ? `₹${Number(c.business_volume_value_per_month).toLocaleString('en-IN')}` : null} />
    </div>


    <div className="pt-3 border-t border-gray-100 flex justify-end items-center gap-4">
      <p className="text-[10px] text-gray-400 font-mono italic mr-auto">Created: {c.created_at ? formatDateTime(c.created_at) : '—'}</p>
    </div>
  </div>
);








// CustomerAutocomplete removed as per user request for a plain text field

export default Consignors;
