import React, { useState, useRef, useEffect } from 'react';
import {
  X, Plus, Loader2, ChevronDown,
  Trash2, Save, Info, AlertCircle, Search
} from 'lucide-react';
import { useVehicles } from '../../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../../queries/vehicles/vehicletypeQuery';
import { useDrivers } from '../../../queries/drivers/driverCoreQuery';
import { formatDateShort } from '@/utils/dateFormat';

// ── Generic Badge ─────────────────────────────────────────────────────
export const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${className}`}>
    {children}
  </span>
);

// ── Style Maps ────────────────────────────────────────────────────────
export const FUEL_COLORS = {
  DIESEL: 'bg-orange-50 text-orange-700 border border-orange-200',
  PETROL: 'bg-sky-50 text-sky-700 border border-sky-200',
  CNG: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  LPG: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  ELECTRIC: 'bg-teal-50 text-teal-700 border border-teal-200',
  HYBRID: 'bg-purple-50 text-purple-700 border border-purple-200',
};

export const STATUS_STYLES = {
  ACTIVE: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
  MAINTENANCE: { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border border-orange-200' },
  RETIRED: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border border-red-200' },
  SOLD: { dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50 border border-gray-200' },
  SCRAPPED: { dot: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-100 border border-gray-200' },
};

export const OWNERSHIP_COLORS = {
  OWNED: 'bg-blue-50 text-blue-600 border border-blue-200',
  LEASED: 'bg-purple-50 text-purple-600 border border-purple-200',
};

// ── Helpers ───────────────────────────────────────────────────────────
export const fmtDate = (iso) => formatDateShort(iso);

export const fmtKm = (n) =>
  n != null ? `${Number(n).toLocaleString('en-IN')} km` : '—';

export const fmtINR = (n, decimals = 0) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : '—';

export const driverName = (d) => {
  if (!d) return '—';
  if (typeof d === 'object') {
    const u = d.user ?? d;
    if (u.first_name || u.last_name) {
      return [u.first_name, u.last_name].filter(Boolean).join(' ');
    }
    return d.full_name ?? d.name ?? d.driver_name ?? d.employee_id ?? 'Driver Assigned';
  }
  return d;
};

// ── Generic Badge ─────────────────────────────────────────────────────
export const StatCard = ({ label, value, icon: Icon, color, loading, className = '' }) => {
  return (
    <div className={`bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-200 w-full max-w-[240px] ${className}`}>
      <p className="text-[10px] font-bold text-gray-400 tracking-wider mb-1.5 uppercase">{label}</p>
      <div className="flex items-baseline gap-2">
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <span className={`text-3xl font-black ${color?.value || 'text-[#172B4D]'}`}>{value}</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5"><span className="text-sm opacity-50">{Icon && <Icon size={12} />}</span> <span>View Details</span></p>
    </div>
  );
};

// ── Info Card (for details view) ──────────────────────────────────────
export const InfoCard = ({ label, value, icon: Icon, accent, noTruncate }) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-1.5 transition-all hover:shadow-sm
    ${accent ? 'bg-[#0052CC]/5 border-[#0052CC]/20' : 'bg-white border-gray-100 hover:border-[#0052CC]/20'}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      {Icon && <Icon size={13} className={accent ? 'text-[#0052CC]/40' : 'text-gray-200'} />}
    </div>
    <span className={`text-sm font-bold ${accent ? 'text-[#0052CC]' : 'text-[#172B4D]'} ${noTruncate ? '' : 'truncate'}`}>
      {value ?? <span className="text-gray-300 font-normal">—</span>}
    </span>
  </div>
);

// ── Section Header (for tabs/subsections) ─────────────────────────────
export const SectionHeader = ({ icon: Icon, title, count, onAdd, addLabel = 'Add' }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
      {Icon && <Icon size={14} className="text-gray-500" />}
    </div>
    <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wide">{title}</h3>
    {count != null && (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{count}</span>
    )}
    {onAdd && (
      <button onClick={onAdd}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0052CC] rounded-lg hover:bg-[#0043A8] transition-all shadow-sm">
        <Plus size={12} /> {addLabel}
      </button>
    )}
  </div>
);

// ── Empty State ─────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, text, onAdd, addLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
      {Icon && <Icon size={24} />}
    </div>
    <p className="text-sm font-semibold text-gray-400">{text}</p>
    {onAdd && (
      <button onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all mt-1">
        <Plus size={14} /> {addLabel ?? 'Add New'}
      </button>
    )}
  </div>
);

// ── Form Components ──────────────────────────────────────────────────
export const Label = ({ children, required }) => (
  <label className="block text-xs font-bold text-gray-600 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

export const Input = ({ className = '', ...props }) => (
  <input {...props}
    className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
      placeholder:text-gray-300 transition-all ${className}`} />
);

export const Sel = ({ children, className = '', ...props }) => (
  <div className="relative">
    <select {...props}
      className={`w-full appearance-none px-3 pr-8 py-2 text-sm border border-gray-200
        rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20
        focus:border-[#0052CC] cursor-pointer transition-all ${className}`}>
      {children}
    </select>
    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

export const Section = ({ title, className = '' }) => (
  <p className={`text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-1 ${className}`}>{title}</p>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea {...props} rows={props.rows || 3}
    className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]
      placeholder:text-gray-300 transition-all ${className}`} />
);

export const Field = ({ label, required, children, error, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    <div className={error ? "rounded-lg ring-2 ring-red-500 border-red-500 overflow-hidden" : ""}>
      {children}
    </div>
    {error && (
      <div className="flex items-center gap-1 mt-0.5 text-red-500">
        <AlertCircle size={12} className="shrink-0" />
        <span className="text-[11px] font-semibold leading-tight">{error}</span>
      </div>
    )}
  </div>
);

// ── Modal Component ──────────────────────────────────────────────────
export const Modal = ({ title, onClose, onSubmit, submitting, isView, children, maxWidth = 'max-w-lg', onDelete, isDeleting, submitDisabled }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 text-left">
        <h2 className="text-base font-black text-[#172B4D]">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X size={16} className="text-gray-500" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4 text-left">{children}</div>
      {!isView && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div>
            {onDelete && (
              <button type="button" onClick={onDelete} disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50">
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={onSubmit} disabled={submitting || submitDisabled}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0052CC] rounded-xl hover:bg-[#0043A8] transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ── Delete Confirmation ──────────────────────────────────────────────
export const DeleteConfirm = ({ title, label, message, onClose, onConfirm, deleting }) => {
  const displayTitle = title || (label ? `Delete ${label}?` : "Are you sure?");
  const displayMessage = message || "This action cannot be undone.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4 text-left border border-gray-100">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#172B4D]">{displayTitle}</h2>
          <p className="text-sm text-gray-400 mt-1">{displayMessage}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Generic Confirmation Modal ───────────────────────────────────────
export const ConfirmModal = ({ title, message, onClose, onConfirm, loading, confirmLabel = "Confirm", variant = "primary", icon: Icon = AlertCircle }) => {
  const variants = {
    primary: "bg-[#0052CC] hover:bg-[#0043A8] text-white shadow-blue-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-red-200",
    warning: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200",
  };

  const iconColors = {
    primary: "bg-blue-50 border-blue-100 text-[#0052CC]",
    danger: "bg-red-50 border-red-100 text-red-500",
    warning: "bg-orange-50 border-orange-100 text-orange-500",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#172B4D]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5 text-left border border-white/20 animate-in zoom-in-95 fade-in duration-200">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${iconColors[variant] || iconColors.primary}`}>
          <Icon size={22} className="shrink-0" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#172B4D] leading-tight">{title}</h2>
          <p className="text-[13px] text-gray-500 mt-1.5 font-medium">{message}</p>
        </div>
        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-[13px] font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 px-4 py-2.5 text-[13px] font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg active:scale-95 ${variants[variant] || variants.primary}`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Item Actions (Edit/Delete) ────────────────────────────────────────
export const ItemActions = ({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }) => (
  <div className="flex items-center gap-2">
    {onEdit && (
      <button onClick={onEdit}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0052CC] bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all">
        <Loader2 size={11} className="hidden" /> {/* Spacer/Placeholder if needed */}
        {editLabel}
      </button>
    )}
    {onDelete && (
      <button onClick={onDelete}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-all">
        {deleteLabel}
      </button>
    )}
  </div>
);

// ── Vehicle Searchable Dropdown ───────────────────────────────────────
export const VehicleSelect = ({ value, onChange, placeholder, disabled }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: vData, isLoading } = useVehicles({ expand: 'assigned_driver' }, { enabled: open || !!value });
  const allVehicles = vData?.results ?? vData ?? [];
  const vehicles = query
    ? allVehicles.filter(v =>
      v.registration_number?.toLowerCase().includes(query.toLowerCase()) ||
      v.make?.toLowerCase().includes(query.toLowerCase())
    )
    : allVehicles;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = allVehicles.find(v => v.id === value);

  return (
    <div className={`relative ${disabled ? "opacity-70 cursor-not-allowed" : ""}`} ref={ref}>
      <div onClick={() => !disabled && setOpen(o => !o)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
          flex items-center justify-between gap-2 transition-all ${disabled ? '' : 'hover:border-[#0052CC]/40 cursor-pointer'}">
        <span className={`font-mono truncate ${selected || placeholder ? 'text-[#172B4D] font-bold' : 'text-gray-300'}`}>
          {selected ? `${selected.registration_number} — ${selected.make ?? ''} ${selected.model ?? ''}`.trim() : (placeholder || 'Select vehicle...')}
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search reg number..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {isLoading && (
              <li className="px-4 py-3 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin text-[#0052CC]" /> Loading...
              </li>
            )}
            {!isLoading && vehicles.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400 text-center">No vehicles found</li>
            )}
            {vehicles.map(v => (
              <li key={v.id}
                onClick={() => { onChange(v.id, v); setOpen(false); setQuery(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors
                  flex items-center justify-between gap-2 ${v.id === value ? 'bg-blue-50' : ''}`}>
                <span className="font-mono font-bold text-[#172B4D] text-sm">{v.registration_number}</span>
                <span className="text-xs text-gray-400">{v.make} {v.model}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Vehicle Type Searchable Dropdown ──────────────────────────────────
export const VehicleTypeSelect = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: vtData, isLoading } = useVehicleTypes({ is_active: true, page_size: 200 }, { enabled: true });
  const allTypes = vtData?.results ?? vtData ?? [];
  const types = query
    ? allTypes.filter(t => (t.type_name ?? t.name)?.toLowerCase().includes(query.toLowerCase()))
    : allTypes;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = allTypes.find(t => String(t.id) === String(value));

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
          cursor-pointer flex items-center justify-between gap-2 transition-all hover:border-[#0052CC]/40">
        <span className={`truncate ${selected ? 'text-[#172B4D] font-semibold' : 'text-gray-300'}`}>
          {selected ? (selected.type_name ?? selected.name) : 'Select vehicle type...'}
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search type name..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            {isLoading && <li className="px-4 py-3 flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin text-[#0052CC]" /> Loading...</li>}
            {!isLoading && types.length === 0 && <li className="px-4 py-3 text-xs text-gray-400 text-center">No types found</li>}
            {types.map(t => (
              <li key={t.id}
                onClick={() => { onChange(String(t.id)); setOpen(false); setQuery(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors
                  flex items-center justify-between gap-2 ${String(t.id) === String(value) ? 'bg-blue-50' : ''}`}>
                <span className="font-semibold text-[#172B4D] text-sm">{t.type_name ?? t.name}</span>
                {t.category && <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t.category}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Driver Searchable Dropdown ────────────────────────────────────────
export const DriverSelect = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: dData, isLoading } = useDrivers({ page_size: 1000, ordering: 'id' });
  const allDrivers = dData?.results ?? [];

  const getDriverName = (d) => {
    const name = `${d.user?.first_name || ''} ${d.user?.last_name || ''}`.trim();
    return name || d.employee_id || 'Unknown Driver';
  };

  const drivers = query
    ? allDrivers.filter(d => {
      const name = getDriverName(d);
      return (
        name.toLowerCase().includes(query.toLowerCase()) ||
        d.employee_id?.toLowerCase().includes(query.toLowerCase())
      );
    })
    : allDrivers;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const selected = allDrivers.find(d => d.id === value);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50
          cursor-pointer flex items-center justify-between gap-2 transition-all hover:border-[#0052CC]/40">
        <span className={`truncate ${selected ? 'text-[#172B4D] font-bold' : 'text-gray-300'}`}>
          {selected
            ? `${getDriverName(selected)}${selected.employee_id ? ' — ' + selected.employee_id : ''}`
            : 'Select driver...'}
        </span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search driver name or ID..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]" />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
            <li
              onClick={() => { onChange(null); setOpen(false); setQuery(''); }}
              className="px-4 py-2 cursor-pointer hover:bg-red-50 transition-colors text-xs text-gray-400 italic">
              — None / Clear —
            </li>
            {isLoading && (
              <li className="px-4 py-3 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin text-[#0052CC]" /> Loading...
              </li>
            )}
            {!isLoading && drivers.length === 0 && (
              <li className="px-4 py-3 text-xs text-gray-400 text-center">No drivers found</li>
            )}
            {drivers.map(d => (
              <li key={d.id}
                onClick={() => { onChange(d.id, d); setOpen(false); setQuery(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors
                  flex items-center justify-between gap-2 ${d.id === value ? 'bg-blue-50' : ''}`}>
                <span className="font-semibold text-[#172B4D] text-sm">{getDriverName(d)}</span>
                <span className="text-xs text-gray-400 font-mono">{d.employee_id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Vehicle Type Multi-Select ──────────────────────────────────────────
export const VehicleTypeMultiSelect = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const { data: vtData, isLoading } = useVehicleTypes({ all: true }, { enabled: open || !!value });
  const allTypes = vtData?.results ?? vtData ?? [];

  const selectedIds = value ? (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : value) : [];

  const filtered = query
    ? allTypes.filter(t => (t.type_name || t.name || '').toLowerCase().includes(query.toLowerCase()))
    : allTypes;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const toggle = (typeName) => {
    let next;
    if (selectedIds.includes(typeName)) {
      next = selectedIds.filter(id => id !== typeName);
    } else {
      next = [...selectedIds, typeName];
    }
    onChange(next.join(', '));
  };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full min-h-[42px] px-3 py-2 border border-gray-200 rounded-xl bg-white flex flex-wrap gap-1.5 items-center transition-all
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[#0052CC]/40 focus-within:ring-2 focus-within:ring-[#0052CC]/10'}`}
      >
        {selectedIds.length === 0 ? (
          <span className="text-sm text-gray-400">Select vehicle types...</span>
        ) : (
          selectedIds.map(id => (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0052CC] text-[11px] font-bold rounded-md border border-blue-100 uppercase tracking-tighter">
              {id}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
        <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search vehicle types..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto p-1 py-2">
            {isLoading ? (
              <li className="px-4 py-6 text-center"><Loader2 size={24} className="animate-spin text-[#0052CC] mx-auto" /></li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-8 text-sm text-gray-400 text-center italic">No vehicle types found</li>
            ) : (
              filtered.map(t => {
                const name = t.type_name || t.name;
                const isSelected = selectedIds.includes(name);
                return (
                  <li
                    key={t.id}
                    onClick={() => toggle(name)}
                    className={`px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group
                      ${isSelected ? 'bg-blue-50 text-[#0052CC]' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>{name}</span>
                      {t.capacity_tons && <span className="text-[10px] text-gray-400 uppercase font-black">Capacity: {t.capacity_tons} tons</span>}
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#0052CC]" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
