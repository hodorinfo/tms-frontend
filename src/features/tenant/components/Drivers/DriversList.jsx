import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Search, Plus, Download, Upload, RefreshCw, RotateCcw, Eye, EyeOff,
  ChevronDown, Loader2, AlertCircle,
  IdCard, ArrowUpDown, ArrowUp, ArrowDown,
  X, User, Car, FileSpreadsheet,
} from 'lucide-react';
import driverApi from '../../api/drivers/driverEndpoint';
import { downloadBlob } from '../../../../utils/csvExport';
import { useDrivers, useRegisterDriver, useRestoreDriver, useDriverStats } from '../../queries/drivers/driverCoreQuery';
import { ConfirmModal } from '../Vehicles/Common/VehicleCommon';

import Label from './common/Label';
import Input from './common/Input';
import Select from './common/Select';
import ModalWrapper from './common/ModalWrapper';
import StatusBadge from './common/StatusBadge';
import { LoadingState, ErrorState, EmptyState, GenericTableShimmer } from './common/StateFeedback';

import {
  LICENSE_TYPES,
  DRIVER_TYPES,
  DRIVER_STATUS_OPTIONS as DRIVER_STATUS,
  GENDER_OPTIONS,
  STATUS_STYLES,
  LICENSE_COLORS,
  DRIVER_TYPE_COLORS,
} from './common/constants';
import { getDriverName, cleanObject, getExpiryColor, formatError, getInitials, getAvatarColor } from './common/utils';

// ── Constants handled via centralized common/constants.js ─────────────

// getDriverName handled via common/utils.js

const SortIcon = ({ field, ordering }) => {
  if (ordering === field) return <ArrowUp size={12} className="text-[#0052CC]" />;
  if (ordering === `-${field}`) return <ArrowDown size={12} className="text-[#0052CC]" />;
  return <ArrowUpDown size={12} className="text-gray-300" />;
};

const SectionTitle = ({ Icon, title, subtitle }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-[#0052CC]/10 flex items-center justify-center">
      <Icon size={14} className="text-[#0052CC]" />
    </div>
    <div>
      <p className="text-sm font-black text-[#172B4D]">{title}</p>
      {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// ── ADD DRIVER MODAL START ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
const AddDriverModal = ({ onClose }) => {
  const [userForm, setUserForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    phone: '', middle_name: '', date_of_birth: '', gender: '',
  });
  const [driverForm, setDriverForm] = useState({
    license_number: '', license_type: '', license_expiry: '',
    license_issuing_authority: '', driver_type: 'PERMANENT',
    years_of_experience: '', joined_date: '', status: 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const registerDriver = useRegisterDriver();
  const setUser = (f) => (e) => setUserForm(p => ({ ...p, [f]: e.target.value }));
  const setDriver = (f) => (e) => setDriverForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    setError('');
    const phoneRegex = /^[6-9]\d{9}$/;

    // 1. Basic Required Fields
    if (!userForm.first_name || !userForm.last_name) return setError('First and last name are required.');
    if (!userForm.email) return setError('Email is required.');
    if (!userForm.password) return setError('Password is required.');

    // 2. Name Length Validation (Max 100)
    if (userForm.first_name.length > 100) return setError('First name cannot exceed 100 characters.');
    if (userForm.last_name.length > 100) return setError('Last name cannot exceed 100 characters.');
    if (userForm.middle_name && userForm.middle_name.length > 100) return setError('Middle name cannot exceed 100 characters.');

    // 3. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) return setError('Please enter a valid email address.');

    // 4. Phone Validation (Optional but validate if filled)
    let p = userForm.phone.replace(/\s+/g, '');
    if (p) {
      if (p.startsWith('+91')) p = p.slice(3);
      if (!phoneRegex.test(p)) return setError("Enter valid 10-digit phone number");
      p = `+91${p}`;
    }

    // 5. Age Validation (18+)
    if (userForm.date_of_birth) {
      const birthDate = new Date(userForm.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) return setError('Driver must be at least 18 years old.');
    }

    if (!driverForm.license_number) return setError('License number is required.');
    if (!driverForm.license_type) return setError('License type is required.');
    if (!driverForm.license_expiry) return setError('License expiry date is required.');
    if (!driverForm.joined_date) return setError('Joined date is required.');

    // Auto-generate username from email prefix + short unique suffix
    const emailPrefix = userForm.email.split('@')[0];
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const generatedUsername = `${emailPrefix}_${uniqueSuffix}`.substring(0, 100);

    registerDriver.mutate({
      driver: cleanObject({
        ...driverForm,
        years_of_experience: driverForm.years_of_experience === '' ? 0 : parseInt(driverForm.years_of_experience, 10)
      }),
      user: cleanObject({ ...userForm, phone: p, username: generatedUsername }),
    }, {
      onSuccess: onClose,
      onError: (err) => setError(formatError(err)),
    });
  };

  return (
    <ModalWrapper
      title="Register New Driver"
      description="Creates user account + driver profile in one step"
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={registerDriver.isPending}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#4f46e5] rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {registerDriver.isPending ? <><Loader2 size={14} className="animate-spin" /> Registering...</> : <><Plus size={14} /> Register Driver</>}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        {/* User Info */}
        <div>
          <SectionTitle Icon={User} title="User Information" subtitle="Login credentials and personal details" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>First Name</Label><Input placeholder="e.g. John" value={userForm.first_name} onChange={setUser('first_name')} /></div>
            <div><Label required>Last Name</Label><Input placeholder="e.g. Smith" value={userForm.last_name} onChange={setUser('last_name')} /></div>
            <div><Label>Middle Name</Label><Input placeholder="e.g. Kumar" value={userForm.middle_name} onChange={setUser('middle_name')} /></div>
            <div><Label required>Email</Label><Input type="email" placeholder="e.g. john@company.com" value={userForm.email} onChange={setUser('email')} /></div>
            <div><Label required>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={userForm.password}
                  onChange={setUser('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div><Label>Phone</Label><Input placeholder="e.g. 9876543210 (Optional)" value={userForm.phone} onChange={setUser('phone')} /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={userForm.date_of_birth} onChange={setUser('date_of_birth')} /></div>
            <div><Label>Gender</Label>
              <Select value={userForm.gender} onChange={setUser('gender')}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g.replaceAll('_', ' ')}</option>)}
              </Select>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100" />
        {/* Driver Info */}
        <div>
          <SectionTitle Icon={Car} title="Driver Information" subtitle="License and employment details" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label required>License Number</Label><Input placeholder="e.g. MH-01-20200012345" value={driverForm.license_number} onChange={setDriver('license_number')} /></div>
            <div><Label required>License Type</Label>
              <Select value={driverForm.license_type} onChange={setDriver('license_type')}>
                <option value="">Select type</option>
                {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label required>Expiry Date</Label><Input type="date" value={driverForm.license_expiry} onChange={setDriver('license_expiry')} /></div>
            <div className="col-span-2"><Label>Issuing Authority</Label><Input placeholder="e.g. RTO Delhi (Optional)" value={driverForm.license_issuing_authority} onChange={setDriver('license_issuing_authority')} /></div>
            <div><Label>Driver Type</Label>
              <Select value={driverForm.driver_type} onChange={setDriver('driver_type')}>
                {DRIVER_TYPES.map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
              </Select>
            </div>
            <div><Label>Years of Experience</Label><Input type="number" min="0" placeholder="e.g. 5" value={driverForm.years_of_experience} onChange={setDriver('years_of_experience')} /></div>
            <div><Label required>Joined Date</Label><Input type="date" value={driverForm.joined_date} onChange={setDriver('joined_date')} /></div>
            <div><Label>Status</Label>
              <Select value={driverForm.status} onChange={setDriver('status')}>
                {DRIVER_STATUS.map(s => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
// ─────────────────────────────────────────────────────────────────────
// ── ADD DRIVER MODAL END ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────

const ACTION_CONFIRM = {
  refresh: {
    title: 'Refresh list?',
    message: 'Reload drivers and summary counts from the server.',
    confirmLabel: 'Refresh',
    icon: RefreshCw,
  },
  template: {
    title: 'Download template?',
    message: 'Get the CSV file with required column headers.',
    confirmLabel: 'Download',
    icon: FileSpreadsheet,
  },
  import: {
    title: 'Import drivers?',
    message: 'Upload a CSV file. Rows match by Employee ID, License No., or Email.',
    confirmLabel: 'Choose file',
    icon: Upload,
  },
  export: {
    title: 'Export drivers?',
    message: 'Download a CSV using your current filters.',
    confirmLabel: 'Export',
    icon: Download,
  },
};

// ── Main Component ────────────────────────────────────────────────────
const DriversList = () => {
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType] = useState('');
  const [licFilter, setLic] = useState('');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [ordering, setOrdering] = useState('-id');
  const [visibilityFilter, setVisibilityFilter] = useState('active'); // active | deleted | all
  const [currentPage, setCurrentPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionConfirm, setActionConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search Debouncing
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const listFilterParams = {
    page: currentPage,
    page_size: PAGE_SIZE,
    ...(visibilityFilter !== 'deleted' && statusFilter && { status: statusFilter }),
    ...(typeFilter && { driver_type: typeFilter }),
    ...(licFilter && { license_type: licFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(joinedFrom && { joined_date__gte: joinedFrom }),
    ...(joinedTo && { joined_date__lte: joinedTo }),
    ...(ordering && { ordering }),
    ...(visibilityFilter === 'deleted' && { deleted_only: true }),
    ...(visibilityFilter === 'all' && { include_deleted: true }),
  };

  const { data, isLoading, isError, error, refetch } = useDrivers(listFilterParams);
  const { data: statsData, refetch: refetchStats } = useDriverStats();
  const restoreDriver = useRestoreDriver();

  const drivers = data?.results ?? [];
  const filteredTotal = data?.count ?? drivers.length;

  const total = statsData?.total ?? drivers.length;
  const active = statsData?.active ?? drivers.filter(d => !d.is_deleted && d.status === 'ACTIVE').length;
  const inactive = statsData?.inactive ?? drivers.filter(d => !d.is_deleted && d.status === 'INACTIVE').length;
  const suspended = statsData?.suspended ?? drivers.filter(d => !d.is_deleted && d.status === 'SUSPENDED').length;
  const deleted = statsData?.deleted ?? drivers.filter(d => d.is_deleted).length;
  const statsLoading = !statsData;

  const handleSort = (field) => {
    setOrdering(prev => prev === field ? `-${field}` : field);
  };

  const resetFilters = () => {
    setSearch(''); setStatus(''); setType(''); setLic('');
    setJoinedFrom(''); setJoinedTo(''); setOrdering(''); setVisibilityFilter('active'); setCurrentPage(1);
  };

  const invalidateDriverQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['drivers'] });
  };

  const runRefresh = async () => {
    setRefreshing(true);
    try {
      await invalidateDriverQueries();
      await Promise.all([refetch(), refetchStats()]);
      toast.success('List refreshed');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await driverApi.importTemplate();
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, 'drivers_import_template.csv');
      toast.success('Template downloaded');
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to download template');
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    setImporting(true);
    try {
      const result = await driverApi.importCsv(file);
      const { created = 0, updated = 0, failed = 0, errors = [] } = result || {};
      if (failed > 0 && errors.length) {
        toast.error(`Import finished: ${created} created, ${updated} updated, ${failed} failed. ${errors[0]}`);
      } else {
        toast.success(`Import complete: ${created} created, ${updated} updated`);
      }
      await invalidateDriverQueries();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.errors?.[0];
      toast.error(detail || err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { page, page_size, ordering, ...exportParams } = listFilterParams;
      const response = await driverApi.exportCsv(exportParams);
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const fallback = `drivers_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadBlob(blob, fallback);
      toast.success('Driver list exported');
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleActionConfirm = async () => {
    const kind = actionConfirm?.kind;
    setActionConfirm(null);
    if (kind === 'refresh') await runRefresh();
    else if (kind === 'template') await handleDownloadTemplate();
    else if (kind === 'import') fileInputRef.current?.click();
    else if (kind === 'export') await handleExport();
  };

  // If filters change and current page becomes empty, move back one page.
  React.useEffect(() => {
    if (!isLoading && currentPage > 1 && filteredTotal > 0 && drivers.length === 0) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  }, [isLoading, currentPage, filteredTotal, drivers.length]);

  const SortableTH = ({ label, field }) => (
    <th
      onClick={() => handleSort(field)}
      className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-[#0052CC] select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon field={field} ordering={ordering} />
      </div>
    </th>
  );

  const COLUMNS = [
    {
      header: 'Driver',
      sortField: 'employee_id',
      render: d => {
        const name = getDriverName(d);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] tracking-wider bg-blue-50 text-[#0052CC] border border-blue-100 font-syne">
              {getInitials(name)}
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-[13px] leading-none">{name}</div>
              <div className="text-[11px] text-gray-400 font-mono mt-1 uppercase">{d.employee_id}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'License No.',
      render: d => (
        <span className="font-mono text-[12px] text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
          {d.license_number ?? '—'}
        </span>
      ),
    },
    {
      header: 'License Type',
      render: d => (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-100">
          {d.license_type_display ?? d.license_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Driver Type',
      render: d => (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200">
          {d.driver_type_display ?? d.driver_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'License Expiry',
      render: d => {
        const daysToExpiry = d.license_expiry ? Math.ceil((new Date(d.license_expiry) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 0;
        const isExpired = d.license_expiry && new Date(d.license_expiry) < new Date();

        return (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-gray-600 font-medium">
              {d.license_expiry ?? '—'}
            </span>
            {(isExpiringSoon || isExpired) && (
              <div className="relative group/tooltip">
                <AlertCircle size={14} className={isExpired ? "text-red-500" : "text-red-500 animate-pulse"} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                  <div className="bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl border border-gray-700 font-sans">
                    {isExpired ? `Expired ${Math.abs(daysToExpiry)} days ago!` : `Expiring in ${daysToExpiry} days!`}
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Experience',
      render: d => (
        <span className="text-gray-600 font-medium text-[12px]">
          {d.years_of_experience != null ? `${d.years_of_experience} yrs` : '—'}
        </span>
      ),
    },
    {
      header: 'Joined',
      sortField: 'joined_date',
      render: d => (
        <span className="text-gray-600 font-medium text-[12px]">{d.joined_date ?? '—'}</span>
      ),
    },
    {
      header: 'Status',
      render: d => d.is_deleted ? (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap bg-red-50 border border-red-200 text-red-700">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Deleted
        </span>
      ) : (
        <StatusBadge
          label={d.status_display ?? d.status}
          styles={STATUS_STYLES[d.status]}
        />
      ),
    },
    {
      header: 'Actions',
      render: d => (
        <div className="flex items-center gap-2">
          {!d.is_deleted && (
            <button
              onClick={() => navigate(`/tenant/dashboard/drivers/${d.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all font-sans"
            >
              <Eye size={12} /> View
            </button>
          )}
          {d.is_deleted && (
            <button
              onClick={() => restoreDriver.mutate(d.id)}
              disabled={restoreDriver.isPending}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
            >
              {restoreDriver.isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Restore
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {/* ── Add Driver Modal ── */}
      {addOpen && (
        <AddDriverModal onClose={() => setAddOpen(false)} />
      )}

      {actionConfirm && (
        <ConfirmModal
          title={ACTION_CONFIRM[actionConfirm.kind].title}
          message={ACTION_CONFIRM[actionConfirm.kind].message}
          confirmLabel={ACTION_CONFIRM[actionConfirm.kind].confirmLabel}
          icon={ACTION_CONFIRM[actionConfirm.kind].icon}
          loading={refreshing || exporting || importing}
          onClose={() => setActionConfirm(null)}
          onConfirm={handleActionConfirm}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center">
        {/* Title Block */}
        <div className="w-1/4">
          <h1 className="text-2xl font-black text-[#172B4D] uppercase tracking-tight">Drivers</h1>
          <p className="text-gray-500 text-sm tracking-tight mt-0.5">
            Manage all registered drivers
          </p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search by Employee ID or License No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-2 text-gray-400 hover:text-red-500 transition-all duration-500 hover:rotate-180 p-1.5 rounded-full hover:bg-red-50 flex items-center justify-center group/reset"
                title="Clear search"
              >
                <X size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              type="button"
              title="Refresh Data"
              onClick={() => setActionConfirm({ kind: 'refresh' })}
              disabled={refreshing || importing || exporting}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 group"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              title="Download CSV import template"
              onClick={() => setActionConfirm({ kind: 'template' })}
              disabled={refreshing || importing || exporting}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />
              <span>Template</span>
            </button>
            <button
              type="button"
              title="Import Drivers"
              onClick={() => setActionConfirm({ kind: 'import' })}
              disabled={importing || isLoading || refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{importing ? 'Importing…' : 'Import'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              type="button"
              title="Export Drivers"
              onClick={() => setActionConfirm({ kind: 'export' })}
              disabled={exporting || isLoading || importing || refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{exporting ? 'Exporting…' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">

        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {statsLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Drivers:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive (Live):</span>
                <span className="text-[18px] font-black text-orange-500">{inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Suspended (Live):</span>
                <span className="text-[18px] font-black text-red-500">{suspended}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Deleted:</span>
                <span className="text-[18px] font-black text-red-600">{deleted}</span>
              </div>
            </>
          )}
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={() => setAddOpen(true)}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Driver
            </button>
          </div>
        </div>

        {/* ── Filters Bar ── */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between min-h-[56px] px-5 py-2">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
              <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                {[
                  { id: 'active', label: 'Active' },
                  { id: 'deleted', label: 'Deleted' },
                  { id: 'all', label: 'All' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setVisibilityFilter(opt.id);
                      if (opt.id === 'deleted') {
                        setStatus('');
                      }
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${visibilityFilter === opt.id
                      ? 'bg-[#0052CC] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            {[
              { val: statusFilter, set: setStatus, opts: DRIVER_STATUS, ph: 'All Status' },
              { val: typeFilter, set: setType, opts: DRIVER_TYPES, ph: 'All Types' },
              { val: licFilter, set: setLic, opts: LICENSE_TYPES, ph: 'All Licenses' },
            ].map(({ val, set, opts, ph }) => (
              <select
                key={ph}
                value={val}
                onChange={e => { set(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:bg-[#EDF1F7] cursor-pointer"
              >
                <option value="">{ph}</option>
                {opts.map(o => <option key={o} value={o}>{o.replaceAll('_', ' ')}</option>)}
              </select>
            ))}

            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-lg hover:bg-[#EDF1F7] transition-colors">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight whitespace-nowrap">Joined:</span>
              <input
                type="date"
                value={joinedFrom}
                onChange={e => { setJoinedFrom(e.target.value); setCurrentPage(1); }}
                className="px-1 py-0.5 text-xs bg-transparent border-none focus:ring-0 text-[#172B4D] font-bold cursor-pointer"
              />
              <span className="text-gray-400 text-[10px] font-bold leading-none">to</span>
              <input
                type="date"
                value={joinedTo}
                onChange={e => { setJoinedTo(e.target.value); setCurrentPage(1); }}
                className="px-1 py-0.5 text-xs bg-transparent border-none focus:ring-0 text-[#172B4D] font-bold cursor-pointer"
              />
            </div>

            {(statusFilter || typeFilter || licFilter || joinedFrom || joinedTo || visibilityFilter !== 'active' || search) && (
              <button
                onClick={resetFilters}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

            <div className="flex items-center gap-3 ml-4 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Prev
            </button>
            <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-black shadow-md shadow-blue-100">
              {currentPage}
            </div>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!data?.next || isLoading}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
            </div>
          </div>
          <div className="px-5 py-2 border-t border-gray-50 bg-blue-50/40">
            <p className="text-[11px] text-gray-600">
              <span className="font-bold text-[#172B4D]">Note:</span> Inactive/Suspended are live driver states. Deleted means archived (soft-deleted).
            </p>
          </div>
        </div>

        {/* Loading / Table / Error Area */}
        <div className="flex-1 overflow-auto min-h-0 bg-white">
          {isLoading ? (
            <GenericTableShimmer
              rows={10}
              columns={[
                { headerWidth: 'w-24', cellWidth: 'w-32', width: 'w-40', type: 'multiline', subWidth: 'w-16' },
                { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32', type: 'badge' },
                { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-28', type: 'badge' },
                { headerWidth: 'w-20', cellWidth: 'w-24', width: 'w-28', type: 'badge' },
                { headerWidth: 'w-24', cellWidth: 'w-28', width: 'w-32' },
                { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' },
                { headerWidth: 'w-16', cellWidth: 'w-16', width: 'w-24' },
                { headerWidth: 'w-16', cellWidth: 'w-20', width: 'w-24', type: 'badge' },
                { headerWidth: 'w-10', cellWidth: 'w-14', width: 'w-24', align: 'right', type: 'action' },
              ]}
            />
          ) : isError ? (
            <ErrorState message="Failed to load drivers" error={error?.message} onRetry={() => refetch()} />
          ) : drivers.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {COLUMNS.map(c => (
                    c.sortField
                      ? <SortableTH key={c.header} label={c.header} field={c.sortField} />
                      : <th key={c.header} className="px-4 py-4">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-[#f7f9ff] transition-colors group">
                    {COLUMNS.map(c => (
                      <td key={c.header} className="px-4 py-3 whitespace-nowrap align-middle">
                        {c.render(d)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              icon={IdCard}
              title="No drivers found"
              description="Click Add Driver to register a new one"
            />
          )}
        </div>

        {/* Footer */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white shrink-0">
            <div className="text-sm text-gray-500">
              Showing <span className="font-bold text-[#172B4D]">{drivers.length}</span> of <span className="font-bold text-[#172B4D]">{filteredTotal}</span> drivers
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default DriversList;