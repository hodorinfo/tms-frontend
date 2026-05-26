// Forced rebuild to resolve possible HMR/Caching issues
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus, RotateCcw, Loader2, AlertCircle, X, RefreshCw,
  ChevronDown, Truck, Package, Weight,
  ToggleLeft, ToggleRight, Pencil, Trash2, Search,
} from 'lucide-react';
import {
  useVehicleTypes,
  useCreateVehicleType,
  useUpdateVehicleType,
  useDeleteVehicleType,
} from '../../../queries/vehicles/vehicletypeQuery';
import {
  StatCard, Badge, EmptyState, Modal, DeleteConfirm, ItemActions,
  Label, Input, Sel, Field, Section, Textarea, VehicleSelect, ConfirmModal
} from '../Common/VehicleCommon';
import { TableShimmer, CardShimmer, ErrorState } from '../Common/StateFeedback';

const CATEGORIES = ['Truck', 'LCV', 'HCV', 'Pickup', 'Tanker', 'Bus', 'Trailer', 'Container', 'Other'];

const CATEGORY_COLORS = {
  Truck: 'bg-blue-50 text-blue-600 border-blue-200',
  LCV: 'bg-green-50 text-green-600 border-green-200',
  HCV: 'bg-purple-50 text-purple-600 border-purple-200',
  Pickup: 'bg-orange-50 text-orange-600 border-orange-200',
  Tanker: 'bg-teal-50 text-teal-600 border-teal-200',
  Bus: 'bg-pink-50 text-pink-600 border-pink-200',
  Trailer: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  Container: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  Other: 'bg-gray-50 text-gray-500 border-gray-200',
};

const EMPTY_FORM = {
  type_code: '',
  type_name: '',
  category: '',
  typical_capacity_tonnage: '',
  is_active: true,
};


// ─── Detail View ─────────────────────────────────────────────────────────────
const TypeDetailView = ({ data, onClose }) => {
  const catColor = CATEGORY_COLORS[data.category] ?? CATEGORY_COLORS.Other;

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type Code</p>
          <p className="text-[14px] font-bold text-[#172B4D] font-mono">{data.type_code}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit
            ${data.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${data.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            {data.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type Name</p>
          <p className="text-sm font-bold text-[#172B4D]">{data.type_name}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${catColor}`}>{data.category}</span>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Typical Capacity</p>
        <span className="flex items-center gap-2 text-sm text-gray-700 font-bold">
          <Weight size={15} className="text-gray-400" />
          {data.typical_capacity_tonnage ? `${parseFloat(data.typical_capacity_tonnage)} Tons` : '—'}
        </span>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0052CC] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
          Close
        </button>
      </div>
    </div>
  );
};

const TypeModal = ({ initial, onClose, isView, onDeleteRequest }) => {
  const [form, setForm] = useState(
    initial ? {
      type_code: initial.type_code ?? '',
      type_name: initial.type_name ?? '',
      category: initial.category ?? '',
      typical_capacity_tonnage: initial.typical_capacity_tonnage != null
        ? String(parseFloat(initial.typical_capacity_tonnage)) : '',
      is_active: initial.is_active ?? true,
    } : EMPTY_FORM
  );

  const isEdit = !!initial?.id && !isView;
  const create = useCreateVehicleType();
  const update = useUpdateVehicleType();
  const isPending = create.isPending || update.isPending;
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = () => {
    const clean = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
    );
    if (isEdit) update.mutate({ id: initial.id, data: clean }, { onSuccess: onClose });
    else create.mutate(clean, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isView ? 'Type Details' : isEdit ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      isView={isView}
      onDelete={isEdit ? onDeleteRequest : null}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {isView ? (
          <TypeDetailView data={initial} onClose={onClose} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type Code" required><Input placeholder="e.g. TRUCK_10T" value={form.type_code} onChange={set('type_code')} /></Field>
              <Field label="Type Name" required><Input placeholder="e.g. 10 Ton Truck" value={form.type_name} onChange={set('type_name')} /></Field>
            </div>

            <Field label="Category" required>
              <Sel value={form.category} onChange={set('category')}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Sel>
            </Field>

            <Field label="Typical Capacity (Tonnage)">
              <Input type="number" step="0.01" placeholder="e.g. 10"
                value={form.typical_capacity_tonnage} onChange={set('typical_capacity_tonnage')} />
            </Field>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-700">Active Status</p>
                <p className="text-xs text-gray-400">Inactive types won't appear in vehicle creation</p>
              </div>
              <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${form.is_active
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}>
                {form.is_active ? <><ToggleRight size={16} /> Active</> : <><ToggleLeft size={16} /> Inactive</>}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};


// ── Main Page ─────────────────────────────────────────────────────────
const VehicleTypes = () => {
  const [search, setSearch] = useState('');
  const [catFilter, setCat] = useState('');
  const [activeFilter, setActive] = useState('');
  const [modal, setModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [deleteTarget, setDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshConfirm, setRefreshConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const del = useDeleteVehicleType();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useVehicleTypes({
    ...(catFilter && { category: catFilter }),
    ...(activeFilter !== '' && { is_active: activeFilter }),
    ...(search && { search }),
    page: currentPage,
  });

  const types = data?.results ?? data ?? [];
  const total = data?.count ?? types.length;
  const active = types.filter(t => t.is_active).length;
  const inactive = types.filter(t => !t.is_active).length;
  const cats = [...new Set(types.map(t => t.category).filter(Boolean))].length;

  const runRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['vehicleTypes'] });
      await refetch();
      toast.success('List refreshed');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
      setRefreshConfirm(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#F8FAFC] flex-1 min-h-0 overflow-hidden relative">

      {(modal === 'add' || (modal && modal !== 'add')) && (
        <TypeModal initial={modal === 'add' ? null : modal} onClose={() => setModal(null)} onDeleteRequest={() => { setModal(null); setDelete(modal); }} />
      )}
      {viewModal && (
        <TypeModal initial={viewModal} isView onClose={() => setViewModal(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirm label="Vehicle Type" onClose={() => setDelete(null)}
          onConfirm={() => del.mutate(deleteTarget.id, { onSuccess: () => setDelete(null) })}
          deleting={del.isPending} />
      )}
      {refreshConfirm && (
        <ConfirmModal
          title="Refresh list?"
          message="Reload vehicle types from the server."
          confirmLabel="Refresh"
          icon={RefreshCw}
          loading={refreshing}
          onClose={() => setRefreshConfirm(false)}
          onConfirm={runRefresh}
        />
      )}

      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="w-1/4">
          <h2 className="text-2xl font-bold text-[#172B4D]">Vehicle Types</h2>
          <p className="text-gray-500 text-sm tracking-tight">Manage categories and capacity configs</p>
        </div>
        <div className="flex-1 max-w-2xl px-8">
          <div className="relative group/search">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within/search:text-[#0052CC] transition-all duration-300 group-focus-within/search:scale-110" size={20} />
            <input
              type="text"
              placeholder="Search type code or name..."
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
                <RotateCcw size={18} className="animate-in fade-in zoom-in spin-in-180 duration-500 group-hover/reset:scale-110" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 ml-auto">
          <div className="flex items-center gap-2 mr-2">
            <button
              type="button"
              onClick={() => setRefreshConfirm(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all duration-300 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50 group"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200 mx-1" />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 mt-2 overflow-hidden">
        {/* Compact Stats Row */}
        <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex gap-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Types:</span>
                <span className="text-[18px] font-black text-[#172B4D]">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                <span className="text-[18px] font-black text-emerald-600">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Inactive:</span>
                <span className="text-[18px] font-black text-gray-500">{inactive}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Categories:</span>
                <span className="text-[18px] font-black text-purple-600">{cats}</span>
              </div>
              <div className="ml-auto w-1/4 flex justify-end">
                <button
                  onClick={() => setModal('add')}
                  className="mr-0 bg-[#0052CC] text-white px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-[#0747A6] transition-all shadow-lg hover:shadow-blue-200 active:scale-95 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>Add Type</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Filters & Pagination Row */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-50 h-[60px]">
          <div className="flex items-center gap-6">
            <div className="relative">
              <select
                value={catFilter}
                onChange={e => setCat(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={activeFilter}
                onChange={e => setActive(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-200 cursor-pointer shadow-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {(catFilter || activeFilter !== '') && (
              <button
                onClick={() => { setCat(''); setActive(''); }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
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

        {isLoading && (
          <div className="p-4">
            <TableShimmer rows={8} cols={5} />
          </div>
        )}

        {isError && (
          <ErrorState
            message="Failed to load vehicle types"
            error={error?.response?.data?.detail || error?.message}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm relative">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  {['Type Code', 'Type Name', 'Category', 'Tonnage', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {types.map(t => {
                  const catColor = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.Other;
                  return (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-left">
                        <button onClick={() => setViewModal(t)}
                          className="font-bold text-[#172B4D] font-mono text-[13px] hover:text-[#0052CC] transition-all hover:scale-105 active:scale-95 text-left">
                          {t.type_code}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">{t.type_name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${catColor}`}>{t.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.typical_capacity_tonnage
                          ? <span className="flex items-center gap-1 text-gray-700 font-semibold text-[13px]">
                            <Weight size={13} className="text-gray-400" />
                            {parseFloat(t.typical_capacity_tonnage)}T
                          </span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit
                          ${t.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal(t)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#0052CC] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {types.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No vehicle types found</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing <span className="font-bold text-gray-600">{types.length}</span>{data?.count && data.count !== types.length && <> of <span className="font-bold text-gray-600">{data.count}</span></>} types</span>
            <span className="text-[11px]">Fleet Management System</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleTypes;
