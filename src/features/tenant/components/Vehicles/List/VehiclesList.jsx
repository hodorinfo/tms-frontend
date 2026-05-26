import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Download, Upload, RefreshCw, Eye, PauseCircle,
  PlayCircle, Truck,
  ChevronDown, Loader2, RotateCcw,
  Pencil, LayoutGrid, FileSpreadsheet
} from 'lucide-react';
import { useVehicles, useVehicle, useUpdateVehicle, useRestoreVehicle, useVehicleStats } from '../../../queries/vehicles/vehicleQuery';
import { vehiclesApi } from '../../../api/vehicles/vehicleEndpoint';
import { downloadBlob, filenameFromContentDisposition } from '../../../../../utils/csvExport';
import { toast } from 'react-hot-toast';

import {
  VehicleFormModal
} from '../Common/VehicleFormModal';
import {
  StatCard, FUEL_COLORS, STATUS_STYLES, OWNERSHIP_COLORS, fmtKm, ConfirmModal
} from '../Common/VehicleCommon';
import { TableShimmer, CardShimmer, ErrorState } from '../Common/StateFeedback';

// ── Edit Button with full data fetch ─────────────────────────────────
const EditVehicleButton = ({ vehicleId, onEdit }) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const { data, isLoading } = useVehicle(vehicleId, { enabled: shouldFetch });

  useEffect(() => {
    if (data && shouldFetch) {
      setShouldFetch(false);
      onEdit(data);
    }
  }, [data, shouldFetch]);

  const handleClick = () => setShouldFetch(true);

  return (
    <button onClick={handleClick} disabled={isLoading}
      className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50">
      {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
      Edit
    </button>
  );
};

const ACTION_CONFIRM = {
  refresh: {
    title: 'Refresh list?',
    message: 'Reload vehicles and summary counts from the server.',
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
    title: 'Import vehicles?',
    message: 'Upload a CSV file. Rows match by vehicle registration number.',
    confirmLabel: 'Choose file',
    icon: Upload,
  },
  export: {
    title: 'Export vehicles?',
    message: 'Download a CSV using your current filters.',
    confirmLabel: 'Export',
    icon: Download,
  },
};

// ── Main Component ────────────────────────────────────────────────────
const Vehicles = () => {
  const PAGE_SIZE = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [fuelFilter, setFuel] = useState('');
  const [ownerFilter, setOwner] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('active'); // active | deleted | all
  const [currentPage, setCurrentPage] = useState(1);
  const [formModal, setFormModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [suspendConfirm, setSuspendConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionConfirm, setActionConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listFilterParams = {
    ...(visibilityFilter !== 'deleted' && statusFilter && { status: statusFilter }),
    ...(visibilityFilter !== 'deleted' && fuelFilter && { fuel_type: fuelFilter }),
    ...(visibilityFilter !== 'deleted' && ownerFilter && { ownership_type: ownerFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(visibilityFilter === 'deleted' && { deleted_only: true }),
    ...(visibilityFilter === 'all' && { include_deleted: true }),
  };

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isError, error, refetch } = useVehicles({
    page: currentPage,
    page_size: PAGE_SIZE,
    ...listFilterParams,
  });

  const updateVehicle = useUpdateVehicle();
  const restoreVehicle = useRestoreVehicle();
  const { data: statsData, refetch: refetchStats } = useVehicleStats();
  const vehicles = data?.results ?? data ?? [];
  const filteredTotal = data?.count ?? vehicles.length;
  const total = statsData?.total ?? data?.count ?? vehicles.length;
  const active = statsData?.active ?? vehicles.filter(v => !v.is_deleted && v.status === 'ACTIVE').length;
  const maintenance = statsData?.maintenance ?? vehicles.filter(v => !v.is_deleted && v.status === 'MAINTENANCE').length;
  const retired = statsData?.retired ?? vehicles.filter(v => !v.is_deleted && ['RETIRED', 'SOLD', 'SCRAPPED'].includes(v.status)).length;
  const deleted = statsData?.deleted ?? vehicles.filter(v => v.is_deleted).length;
  const statsLoading = !statsData;

  const handleStatusToggle = (v) => {
    if (v.status === 'ACTIVE') {
      setSuspendConfirm(v);
    } else {
      updateVehicle.mutate({ id: v.id, data: { status: 'ACTIVE' } });
    }
  };

  const confirmSuspend = () => {
    if (!suspendConfirm) return;
    updateVehicle.mutate(
      { id: suspendConfirm.id, data: { status: 'MAINTENANCE' } },
      { onSuccess: () => setSuspendConfirm(null) }
    );
  };

  const invalidateVehicleQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    await queryClient.invalidateQueries({ queryKey: ['vehicle-stats'] });
  };

  const runRefresh = async () => {
    setRefreshing(true);
    try {
      await invalidateVehicleQueries();
      await Promise.all([refetch(), refetchStats()]);
      toast.success('List refreshed');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
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

  const handleDownloadTemplate = async () => {
    try {
      const response = await vehiclesApi.importTemplate();
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, 'vehicles_import_template.csv');
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
      const result = await vehiclesApi.importCsv(file);
      const { created = 0, updated = 0, failed = 0, errors = [] } = result || {};
      if (failed > 0 && errors.length) {
        toast.error(`Import finished: ${created} created, ${updated} updated, ${failed} failed. ${errors[0]}`);
      } else {
        toast.success(`Import complete: ${created} created, ${updated} updated`);
      }
      await invalidateVehicleQueries();
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
      const response = await vehiclesApi.exportCsv(listFilterParams);
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const fallback = `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filename = filenameFromContentDisposition(
        response.headers?.['content-disposition'],
        fallback
      );
      downloadBlob(blob, filename);
      toast.success('Vehicle list exported');
    } catch (err) {
      const message = err?.response?.data instanceof Blob
        ? 'Export failed'
        : (err?.response?.data?.detail || err?.message || 'Export failed');
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatus('');
    setFuel('');
    setOwner('');
    setVisibilityFilter('active');
    setCurrentPage(1);
  };

  // If filters change and current page becomes empty, move back one page.
  useEffect(() => {
    if (!isLoading && currentPage > 1 && filteredTotal > 0 && vehicles.length === 0) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  }, [isLoading, currentPage, filteredTotal, vehicles.length]);

  const COLUMNS = [
    {
      header: 'Registration',
      render: v => (
        <div className="text-left whitespace-nowrap">
          <button onClick={() => setViewModal(v)}
            className="font-bold text-[#172B4D] font-mono text-[14px] hover:text-[#0052CC] transition-all text-left block hover:underline decoration-blue-400/30 underline-offset-4">
            {v.registration_number ?? '—'}
          </button>
        </div>
      ),
    },
    {
      header: 'Make',
      render: v => (
        <div>
          <span className="text-[13px] font-semibold text-gray-800">{v.make ?? '—'}</span>
        </div>
      ),
    },
    {
      header: 'Vehicle Type',
      render: v => (
        <span className="text-[13px] font-semibold text-gray-700">
          {v.vehicle_type_name ?? v.vehicle_type?.type_name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Fuel Type',
      render: v => (
        <span className={`px-2 py-0.5 rounded-md text-[13px] font-bold w-fit ${FUEL_COLORS[v.fuel_type] ?? 'bg-gray-100 text-gray-600'}`}>
          {v.fuel_type_display ?? v.fuel_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Odometer',
      render: v => (
        <span className="text-gray-600 font-mono text-[12px] whitespace-nowrap">
          {fmtKm(v.current_odometer)}
        </span>
      ),
    },
    {
      header: 'Ownership',
      render: v => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${OWNERSHIP_COLORS[v.ownership_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {v.ownership_type_display ?? v.ownership_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: v => {
        if (v.is_deleted) {
          return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap bg-red-50 border border-red-200 text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Deleted
            </span>
          );
        }
        const st = STATUS_STYLES[v.status] ?? STATUS_STYLES.RETIRED;
        return (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit whitespace-nowrap ${st.bg} ${st.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {v.status_display ?? v.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: v => {
        if (v.is_deleted) {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/tenant/dashboard/vehicles/${v.id}`)}
                className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all font-sans">
                <Eye size={12} /> View
              </button>
              <button
                onClick={() => restoreVehicle.mutate(v.id)}
                disabled={restoreVehicle.isPending}
                className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50 font-sans"
              >
                {restoreVehicle.isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Restore
              </button>
            </div>
          );
        }

        const isActive = v.status === 'ACTIVE';
        const isMaint = v.status === 'MAINTENANCE';
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/tenant/dashboard/vehicles/${v.id}`)}
              className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all font-sans">
              <Eye size={12} /> View
            </button>
            {isActive && (
              <button onClick={() => handleStatusToggle(v)} disabled={updateVehicle.isPending}
                className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 font-sans">
                <PauseCircle size={12} /> Suspend
              </button>
            )}
            {isMaint && (
              <button onClick={() => handleStatusToggle(v)} disabled={updateVehicle.isPending}
                className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50 font-sans">
                <PlayCircle size={12} /> Activate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <main className="p-6 bg-[#F4F5F7] flex-1 flex flex-col min-h-0 overflow-hidden relative">

      {formModal && (
        <VehicleFormModal
          initial={formModal === 'add' ? null : formModal}
          onClose={() => setFormModal(null)}
        />
      )}
      {viewModal && (
        <VehicleFormModal
          initial={viewModal}
          isView
          onClose={() => setViewModal(null)}
        />
      )}

      {suspendConfirm && (
        <ConfirmModal
          title="Suspend Vehicle"
          message={`Are you sure you want to suspend vehicle ${suspendConfirm.registration_number}? This will change its status to Maintenance.`}
          confirmLabel="Suspend Vehicle"
          variant="danger"
          icon={PauseCircle}
          loading={updateVehicle.isPending}
          onClose={() => setSuspendConfirm(null)}
          onConfirm={confirmSuspend}
        />
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

      {/* Page Title & Search Section */}
      <div className="flex items-center">
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Vehicles</h2>
          <p className="text-gray-500 text-sm tracking-tight">All registered vehicles — click <span className="text-[#0052CC] font-semibold">View</span></p>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search registration, make, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
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
              onClick={() => navigate('/tenant/dashboard/vehicles/types')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
            >
              <LayoutGrid size={14} /> Types
            </button>
            <button
              type="button"
              onClick={() => setActionConfirm({ kind: 'refresh' })}
              disabled={refreshing || importing || exporting}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActionConfirm({ kind: 'template' })}
              disabled={importing || exporting || refreshing}
              title="Download CSV import template"
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />
              <span>Template</span>
            </button>
            <button
              type="button"
              onClick={() => setActionConfirm({ kind: 'import' })}
              disabled={importing || isLoading || refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => setActionConfirm({ kind: 'export' })}
              disabled={exporting || isLoading || importing || refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{exporting ? 'Exporting…' : 'Export'}</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {/* Stats Row */}
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
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-green-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Maintenance:</span>
                <span className="text-[18px] font-black text-orange-500">{maintenance}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Retired/Sold:</span>
                <span className="text-[18px] font-black text-red-500">{retired}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Deleted:</span>
                <span className="text-[18px] font-black text-red-600">{deleted}</span>
              </div>
            </>
          )}
          <div className="ml-auto w-1/4 flex justify-end">
            <button
              onClick={() => setFormModal('add')}
              className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> New Vehicle
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-6 ml-auto justify-between h-15 border-b border-gray-50">
            {/* Quick Filters in Pagination Row */}
            <div className="flex items-center gap-3 px-5 py-2">
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
                { val: statusFilter, set: setStatus, opts: ['ACTIVE', 'MAINTENANCE', 'RETIRED', 'SOLD', 'SCRAPPED'], ph: 'All Status' },
                { val: fuelFilter, set: setFuel, opts: ['DIESEL', 'PETROL', 'CNG', 'LPG', 'ELECTRIC', 'HYBRID'], ph: 'All Fuel' },
                { val: ownerFilter, set: setOwner, opts: ['OWNED', 'LEASED', 'RENTED'], ph: 'All Ownership' },
              ].map(({ val, set, opts, ph }) => (
                <div key={ph} className="relative">
                  <select value={val} onChange={e => { set(e.target.value); setCurrentPage(1); }}
                    disabled={visibilityFilter === 'deleted' && ph === 'All Status'}
                    className="appearance-none pl-3 pr-8 py-1.5 text-s  text-[#172B4D] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none cursor-pointer">
                    <option value="">{ph}</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              ))}

              {(statusFilter || fuelFilter || ownerFilter || visibilityFilter !== 'active') && (
                <button
                  onClick={resetFilters}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear Filters"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            <div className="justify-between h-10 w-px bg-gray-100 hidden sm:block" />

            <div className="flex items-center justify-between gap-3 px-5 py-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>

              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {currentPage}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!data?.next || isLoading}
                className="px-4 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>
          <div className="px-5 py-2 border-b border-gray-50 bg-blue-50/40">
            <p className="text-[11px] text-gray-600">
              <span className="font-bold text-[#172B4D]">Note:</span> Active/Maintenance/Retired are live vehicle states. Deleted means archived (soft-deleted).
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="p-4">
            <TableShimmer rows={8} cols={COLUMNS.length} />
          </div>
        )}

        {isError && (
          <ErrorState
            message="Failed to load vehicles"
            error={error?.response?.data?.detail || error?.message}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && (
          <div className="flex-1 min-h-0 overflow-auto bg-white">
            <table className="w-full text-left relative">
              <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {COLUMNS.map(c => (
                    <th key={c.header} className="px-3 py-4">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors group">
                    {COLUMNS.map(c => (
                      <td key={c.header} className="px-3 py-4 align-middle">{c.render(v)}</td>
                    ))}
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-6 py-10 text-center text-gray-500 font-medium">
                      <Truck size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No vehicles found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {!isLoading && !isError && (
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Showing <span className="font-bold text-[#172B4D]">{vehicles.length}</span> of <span className="font-bold text-[#172B4D]">{filteredTotal}</span> vehicles
              </div>
            </div>
          </div>
        )}
      </div>

    </main>
  );
};

export default Vehicles;
