import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Truck, MapPin, Calendar,
  Map as MapIcon, ChevronRight, Loader2,
  AlertCircle, Hash, Clock, CheckCircle2,
  User, Shield, FileText, Receipt, Edit3,
  CreditCard, History, Plus, ArrowRight,
  Gauge, Zap, DollarSign, Activity, Package as PackageIcon, Trash2, Save, X, Camera
} from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import {
  useTripDetail, useTripStops, useTripDocuments,
  useTripExpenses, useTripCharges, useTripStatusHistory,
  useOrderDetail, useDeleteTrip, useCreateTripStop,
  useUpdateTripStop, useDeleteTripStop, useTripDeliveries, useUploadTripPod, useUpdateTripDocument, useDeleteTripDocument,
  useUpdateTripExpense, useDeleteTripExpense, useUpdateTripCharge, useDeleteTripCharge, useUpdateTrip,
  useTripCargoItems,
  orderKeys,
} from '../../queries/orders/ordersQuery';
import { ordersApi } from '../../api/orders/ordersEndpoint';
import { useDriverDetail } from '../../queries/drivers/driverCoreQuery';
import { useVehicle } from '../../queries/vehicles/vehicleQuery';
import { EditTripModal, AddStopsModal } from './TripModals';
import { CreateCargoModal } from './CargoModals';
import { useCurrentUser } from '../../queries/users/rolesPermissionsQuery';
import LRTabStrip from './trip/LRTabStrip';
import ScopeBadge from './trip/ScopeBadge';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

// --- Shared Components ---
const Badge = ({ children, className = "", pulse = false }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all shadow-sm ${className} ${pulse ? 'ring-2 ring-current/20' : ''}`}>
    {pulse && <span className="flex h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-5 border-b border-gray-100/50 pb-3">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg bg-blue-50/50 text-[#0052CC]">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <h3 className="text-[11px] font-black text-[#172B4D] uppercase tracking-[0.1em]">{title}</h3>
    </div>
    {action}
  </div>
);

const EditFinanceModal = ({ isOpen, onClose, value, onChange, onSubmit, isPending, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f172a]/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#172B4D]">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <input type="number" required step="0.01" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#4a6cf7]" placeholder="Amount" value={value.amount} onChange={(e) => onChange((p) => ({ ...p, amount: e.target.value }))} />
          <textarea rows="3" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#4a6cf7]" placeholder="Description" value={value.description} onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))} />
          <button type="submit" disabled={isPending} className="w-full py-2.5 rounded-lg bg-[#4a6cf7] text-white font-bold text-sm hover:bg-[#3b59d9] disabled:opacity-50">
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

const LABEL_MAP = {
  status: 'Status',
  trip_number: 'Trip Number',
  lr_number: 'LR Number',
  trip_type: 'Trip Type',
  origin_address: 'Origin',
  destination_address: 'Destination',
  reference_number: 'Reference Number',
  created_date: 'Created Date',
  version: 'Version',
  created_at: 'Created At',
  updated_at: 'Updated At',
  primary_driver_id: 'Primary Driver',
  primary_vehicle_id: 'Primary Vehicle',
  vehicle_owner_name: 'Vehicle Owner',
  vehicle_type_code: 'Vehicle Type',
  alternate_driver_id: 'Alternate Driver',
  alternate_vehicle_id: 'Alternate Vehicle',
  scheduled_pickup_date: 'Scheduled Pickup',
  scheduled_delivery_date: 'Scheduled Delivery',
  actual_pickup_date: 'Actual Pickup',
  actual_delivery_date: 'Actual Delivery',
  start_time: 'Start Time',
  end_time: 'End Time',
  total_distance_km: 'Total Distance',
  start_odometer_km: 'Start Odometer',
  end_odometer_km: 'End Odometer',
  estimated_fuel_liters: 'Estimated Fuel',
  actual_fuel_liters: 'Actual Fuel',
  fuel_rate_per_liter: 'Fuel Rate/L',
  total_bill_amount: 'Total Bill',
  total_freight_charge: 'Freight',
  total_accessorial_charge: 'Accessorial',
  total_tax: 'Tax',
  is_paid: 'Paid',
  is_billed: 'Billed',
  broker_commission: 'Broker Commission',
  booked_price: 'Booked Price',
  part_load_charge: 'Part-load Charge',
  tds_percentage: 'TDS %',
  tds_amount: 'TDS Amount',
  late_fee: 'Late Fee',
  damage_amount: 'Damage Amount',
  incentive_amount: 'Incentive',
  payment_received_amount: 'Payment Received',
  payment_received_date: 'Payment Date',
  pod_turnaround_days: 'POD TAT (days)',
};

const TRIP_TRANSITIONS = {
  CREATED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELAYED', 'ARRIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELAYED: ['IN_TRANSIT', 'CANCELLED'],
  ARRIVED: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const InfoCard = ({ label, value, icon: Icon, accent = false, isLoading = false }) => (
  <div className={`p-4 rounded-2xl border transition-all ${
    accent 
      ? 'bg-blue-50/50 border-blue-100 hover:border-blue-200' 
      : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
  }`}>
    <div className="flex items-center gap-4">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
            : 'bg-gray-50 text-gray-400'
        }`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none mb-1.5">
          {LABEL_MAP[label] || label}
        </p>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-5 w-24 bg-gray-100 animate-pulse rounded-md" />
          ) : (
            <p className={`text-sm font-black tracking-tight truncate ${accent ? 'text-blue-700' : 'text-[#172B4D]'}`}>
              {value || '—'}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const DataRow = ({ label, value, icon: Icon }) => {
  return (
    <div className="group flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-all px-2 rounded-lg">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-gray-50/80 text-gray-400 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-blue-600 transition-all border border-transparent group-hover:border-blue-100 shadow-sm">
            <Icon size={15} strokeWidth={2.5} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
            {LABEL_MAP[label] || label}
          </span>
        </div>
      </div>
      <div className="text-right pl-6 flex-1 min-w-0">
        <p className="text-sm font-black text-[#172B4D] break-words line-clamp-2 leading-tight tracking-tight uppercase">
          {value || '—'}
        </p>
      </div>
    </div>
  );
};

// --- Tabs ---
const LrScopeBanner = ({ activeOrderTab, linkedOrders, stopsCount }) => {
  const meta = linkedOrders?.find((o) => String(o.order_id) === String(activeOrderTab));
  if (!activeOrderTab || !meta) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] text-blue-900">
      <span className="font-black uppercase tracking-wider text-[10px] text-blue-600">LR context</span>
      <span className="font-bold">{meta.lr_number || activeOrderTab}</span>
      {typeof stopsCount === 'number' && (
        <span className="text-blue-600/80">
          · {stopsCount} stop{stopsCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
};

const OverviewMeta = ({ label, value, className = '' }) => (
  <div className={className}>
    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-sm font-medium text-slate-900 break-words">{value ?? '—'}</dd>
  </div>
);

const OverviewTab = ({
  trip,
  order,
  navigate,
  lrRows = [],
  activeOrderTab,
  setActiveOrderTab,
  ordersLoading,
}) => {
  const activeLink =
    lrRows.find((r) => String(r.order_id) === String(activeOrderTab)) || lrRows[0] || null;
  const activeOrder = activeLink?.order || order;
  const origin = (activeOrder?.consignor_address || '').trim() || '—';
  const destination = (activeOrder?.consignee_address || '').trim() || '—';
  const multiLr = lrRows.length > 1;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm border-b border-slate-200 pb-3">
        <span className="font-semibold text-slate-900">{trip.trip_number}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-600">{trip.status}</span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-600">{trip.trip_type || 'FTL'}</span>
        {trip.reference_number && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">Ref {trip.reference_number}</span>
          </>
        )}
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">{lrRows.length} LR{lrRows.length === 1 ? '' : 's'}</span>
      </div>

      {multiLr && (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              LR routes on this trip
            </p>
          </div>
          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 font-semibold">LR</th>
                    <th className="px-3 py-2 font-semibold">Origin</th>
                    <th className="px-3 py-2 w-8" aria-hidden />
                    <th className="px-3 py-2 font-semibold">Destination</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Pickup</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {lrRows.map((row) => {
                    const o = row.order;
                    const isActive = String(row.order_id) === String(activeOrderTab);
                    return (
                      <tr
                        key={row.order_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveOrderTab(row.order_id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveOrderTab(row.order_id);
                          }
                        }}
                        className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                          isActive ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {row.lr_number || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-[200px]">
                          <span className="line-clamp-2">{(o?.consignor_address || '—').trim()}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">
                          <ArrowRight size={14} className="mx-auto" />
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-[200px]">
                          <span className="line-clamp-2">{(o?.consignee_address || '—').trim()}</span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap tabular-nums">
                          {formatDateShort(o?.pickup_date)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap tabular-nums">
                          {formatDateShort(o?.delivery_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {multiLr && activeLink && (
          <p className="text-xs font-semibold text-slate-500 mb-3">
            {activeLink.lr_number}
            {activeOrder?.reference_number ? ` · ${activeOrder.reference_number}` : ''}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Origin</p>
            <p className="text-sm text-slate-900 leading-snug">{origin}</p>
          </div>
          <ArrowRight className="hidden md:block text-slate-300 mt-5 shrink-0" size={18} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Destination</p>
            <p className="text-sm text-slate-900 leading-snug">{destination}</p>
          </div>
        </div>

        <dl className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
          <OverviewMeta label="LR number" value={activeOrder?.lr_number || activeLink?.lr_number} />
          <OverviewMeta label="Customer ref" value={activeOrder?.reference_number || activeLink?.reference_number} />
          <OverviewMeta label="Pickup" value={formatDateShort(activeOrder?.pickup_date)} />
          <OverviewMeta label="Delivery" value={formatDateShort(activeOrder?.delivery_date)} />
        </dl>

        {(activeOrderTab || trip.order_id) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/tenant/dashboard/orders/${activeOrderTab || trip.order_id}`)}
              className="text-xs font-semibold text-[#0052CC] hover:underline"
            >
              Open LR booking →
            </button>
          </div>
        )}
      </div>

      {trip.remarks?.trim() && (
        <p className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-0.5">
            Remarks
          </span>
          {trip.remarks}
        </p>
      )}
    </div>
  );
};

const JourneyTab = ({ trip, driver, vehicle, isLoadingNames, altDriver, altVehicle }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={User} title="Fleet & Crew Allocation" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="primary_driver_id" value={driver} icon={User} />
          <DataRow label="primary_vehicle_id" value={vehicle} icon={Truck} />
          <DataRow label="vehicle_owner_name" value={trip.vehicle_owner_name} icon={User} />
          <DataRow label="vehicle_type_code" value={trip.vehicle_type_code} icon={Truck} />
          <DataRow label="alternate_driver_id" value={altDriver} icon={User} />
          <DataRow label="alternate_vehicle_id" value={altVehicle} icon={Truck} />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
        <SectionHeader icon={Clock} title="Schedule & Timing" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          <DataRow label="scheduled_pickup_date" value={formatDateTime(trip.scheduled_pickup_date)} icon={Calendar} />
          <DataRow label="scheduled_delivery_date" value={formatDateTime(trip.scheduled_delivery_date)} icon={CheckCircle2} />
          <DataRow label="actual_pickup_date" value={formatDateTime(trip.actual_pickup_date)} icon={Clock} />
          <DataRow label="actual_delivery_date" value={formatDateTime(trip.actual_delivery_date)} icon={CheckCircle2} />
          <DataRow label="start_time" value={formatDateTime(trip.start_time)} icon={Zap} />
          <DataRow label="end_time" value={formatDateTime(trip.end_time)} icon={Zap} />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
      <SectionHeader icon={Gauge} title="Performance & Fuel Metrics" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2">
        <DataRow label="total_distance_km" value={trip.total_distance_km ? `${trip.total_distance_km} KM` : '—'} icon={MapIcon} />
        <DataRow label="start_odometer_km" value={trip.start_odometer_km ? `${trip.start_odometer_km} KM` : '—'} icon={Gauge} />
        <DataRow label="end_odometer_km" value={trip.end_odometer_km ? `${trip.end_odometer_km} KM` : '—'} icon={Gauge} />
        <DataRow label="estimated_fuel_liters" value={trip.estimated_fuel_liters ? `${trip.estimated_fuel_liters} L` : '—'} icon={Zap} />
        <DataRow label="actual_fuel_liters" value={trip.actual_fuel_liters ? `${trip.actual_fuel_liters} L` : '—'} icon={Zap} />
        <DataRow label="fuel_rate_per_liter" value={trip.fuel_rate_per_liter ? `${trip.fuel_rate_per_liter} / L` : '—'} icon={DollarSign} />
      </div>
    </div>
  </div>
);

const StopsTab = ({ tripId, stops, isLoading, onCreateStop, onUpdateStopStatus, onDeleteStop }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [stopFilters, setStopFilters] = useState({
    stop_sequence: '',
    stop_type: 'ALL',
    location_address: '',
  });
  const [editingStopId, setEditingStopId] = useState(null);
  const [editingStop, setEditingStop] = useState({ location_address: '', instructions: '' });

  const stopRows = [...(stops || [])];
  
  const filteredStops = stopRows.filter(stop => {
    const matchSeq = !stopFilters.stop_sequence || String(stop.stop_sequence) === String(stopFilters.stop_sequence);
    const matchType = stopFilters.stop_type === 'ALL' || stop.stop_type === stopFilters.stop_type;
    const matchLoc = !stopFilters.location_address || 
      (stop.location_address || '').toLowerCase().includes(stopFilters.location_address.toLowerCase());
    return matchSeq && matchType && matchLoc;
  });

  const sortedStops = filteredStops.sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));
  const incompleteStops = sortedStops.filter((s) => s.stop_status !== 'COMPLETED');
  const completedStops = sortedStops.filter((s) => s.stop_status === 'COMPLETED');
  const nextSeq = stopRows.length > 0 ? Math.max(...stopRows.map(s => s.stop_sequence || 0)) + 1 : 1;

  const startEditStop = (stop) => {
    setEditingStopId(stop.id);
    setEditingStop({
      location_address: stop.location_address || '',
      instructions: stop.instructions || '',
    });
  };

  const saveEditStop = (stopId) => {
    onUpdateStopStatus(stopId, undefined, {
      location_address: editingStop.location_address,
      instructions: editingStop.instructions,
    });
    setEditingStopId(null);
    setEditingStop({ location_address: '', instructions: '' });
  };
  

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={MapPin} 
        title="Trip Sequence (Multi-point)" 
      />

      <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
         <div className="w-16">
            <input 
              type="number" 
              min="1"
              className="w-full p-2 bg-gray-100/50 border border-gray-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400"
              value={stopFilters.stop_sequence} 
              onChange={e => {
                const val = e.target.value;
                if (val !== '' && parseInt(val) < 1) return;
                setStopFilters({...stopFilters, stop_sequence: val});
              }} 
              placeholder="Seq"
            />
         </div>
         <div className="w-28">
            <select 
              className="w-full p-2 bg-gray-100/50 border border-gray-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400"
              value={stopFilters.stop_type} 
              onChange={e => setStopFilters({...stopFilters, stop_type: e.target.value})}
            >
               <option value="ALL">ALL TYPES</option>
               <option value="PICKUP">PICKUP</option>
               <option value="DELIVERY">DELIVERY</option>
               <option value="TRANSIT">TRANSIT</option>
               <option value="FUEL">FUEL</option>
               <option value="BREAK">BREAK</option>
               <option value="OTHER">OTHER</option>
            </select>
         </div>
         <div className="w-64">
            <input 
              className="w-full p-2 bg-gray-100/50 border border-gray-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-blue-400"
              value={stopFilters.location_address} 
              onChange={e => setStopFilters({...stopFilters, location_address: e.target.value})} 
              placeholder="Filter by Location"
            />
         </div>
         {(stopFilters.stop_sequence || stopFilters.stop_type !== 'ALL' || stopFilters.location_address) && (
            <button 
              onClick={() => setStopFilters({ stop_sequence: '', stop_type: 'ALL', location_address: '' })}
              className="px-3 py-2 text-[10px] font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase tracking-widest transition-all rounded-xl border border-transparent hover:border-blue-100 shadow-sm"
            >
              Clear
            </button>
         )}
         <div className="ml-auto flex items-center gap-2">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center gap-2 px-6 py-2 bg-[#4a6cf7] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#3b59d9] transition-all shadow-lg shadow-blue-100 active:scale-95"
           >
             <Plus size={14} strokeWidth={3} /> Add Stop
           </button>
         </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : sortedStops.length > 0 ? (
        <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
          {incompleteStops.map((stop) => (
            <div key={stop.id} className="relative">
              <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${stop.stop_status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} />
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-1 gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Stop #{stop.stop_sequence} • {stop.stop_type}
                  </span>
                  <Badge className={stop.stop_status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}>
                    {stop.stop_status}
                  </Badge>
                </div>
                <p className="text-sm font-black text-[#172B4D]">{stop.location_address || '-'}</p>
                <p className="text-xs text-gray-500 font-medium">{stop.instructions || 'No instructions'}</p>
                {editingStopId === stop.id ? (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="md:col-span-2 px-2 py-1 text-xs rounded border border-gray-200"
                      value={editingStop.location_address}
                      onChange={(e) => setEditingStop((p) => ({ ...p, location_address: e.target.value }))}
                      placeholder="Location address"
                    />
                    <input
                      className="px-2 py-1 text-xs rounded border border-gray-200"
                      value={editingStop.instructions}
                      onChange={(e) => setEditingStop((p) => ({ ...p, instructions: e.target.value }))}
                      placeholder="Instructions"
                    />
                    <div className="md:col-span-3 flex gap-2">
                      <button type="button" onClick={() => saveEditStop(stop.id)} className="px-2 py-1 text-xs rounded bg-blue-600 text-white">Save</button>
                      <button type="button" onClick={() => setEditingStopId(null)} className="px-2 py-1 text-xs rounded bg-gray-100">Cancel</button>
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button type="button" onClick={() => onUpdateStopStatus(stop.id, 'PENDING')} className={`px-2 py-1 text-xs rounded ${stop.stop_status === 'PENDING' ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>Pending</button>
                  <button type="button" onClick={() => onUpdateStopStatus(stop.id, 'IN_PROGRESS')} className={`px-2 py-1 text-xs rounded ${stop.stop_status === 'IN_PROGRESS' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>In Progress</button>
                  <button type="button" onClick={() => onUpdateStopStatus(stop.id, 'COMPLETED')} className={`px-2 py-1 text-xs rounded ${stop.stop_status === 'COMPLETED' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'}`}>Completed</button>
                  <button type="button" onClick={() => startEditStop(stop)} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">Edit</button>
                  <button type="button" onClick={() => onDeleteStop(stop.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {completedStops.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                className="mb-2 w-full text-left text-[11px] font-black uppercase tracking-wider text-gray-500 hover:text-blue-600 py-2 px-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/80"
              >
                {showCompleted ? 'Hide' : 'Show'} {completedStops.length} completed stop{completedStops.length === 1 ? '' : 's'}
              </button>
              {showCompleted
                ? completedStops.map((stop) => (
                    <div key={stop.id} className="relative mb-6">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 bg-green-500" />
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm opacity-90">
                        <div className="flex justify-between items-start mb-1 gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Stop #{stop.stop_sequence} • {stop.stop_type}
                          </span>
                          <Badge className="bg-green-50 text-green-600">COMPLETED</Badge>
                        </div>
                        <p className="text-sm font-black text-[#172B4D]">{stop.location_address || '-'}</p>
                        <p className="text-xs text-gray-500 font-medium">{stop.instructions || 'No instructions'}</p>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <button type="button" onClick={() => startEditStop(stop)} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">Edit</button>
                          <button type="button" onClick={() => onDeleteStop(stop.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No stops recorded for this trip.</p>
        </div>
      )}
      <AddStopsModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId}
        nextSequenceNumber={nextSeq}
      />
    </div>
  );
};

const podDocsForLr = (podDocuments, orderId) => {
  const oid = String(orderId || '');
  return (podDocuments || []).filter(
    (d) => d.document_type === 'POD' && (!oid || String(d.order_id || '') === oid)
  );
};

const DeliveriesTab = ({
  tripId,
  linkedOrders = [],
  activeOrderId,
  onActiveOrderChange,
  podDocuments = [],
  uploadPod,
  updateDocument,
  deleteDocument,
  isUploading,
  isUpdating,
  isDeleting,
}) => {
  const resolvedOrderId = activeOrderId || linkedOrders[0]?.order_id;
  const lrMeta = linkedOrders.find((o) => String(o.order_id) === String(resolvedOrderId));
  const lrPods = resolvedOrderId ? podDocsForLr(podDocuments, resolvedOrderId) : [];
  const fileInputRef = React.useRef(null);
  const [remarksDraft, setRemarksDraft] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);

  const editingDoc = lrPods.find((d) => d.id === editingDocId) || lrPods[0] || null;

  useEffect(() => {
    setRemarksDraft(editingDoc?.remarks || '');
    if (editingDoc?.id) setEditingDocId(editingDoc.id);
  }, [editingDoc?.id, editingDoc?.remarks, resolvedOrderId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !resolvedOrderId) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('order_id', resolvedOrderId);
    if (remarksDraft.trim()) formData.append('remarks', remarksDraft.trim());
    uploadPod(formData, {
      onSuccess: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const handleRemoveDoc = (docId) => {
    if (!window.confirm('Remove this POD copy?')) return;
    deleteDocument(docId);
  };

  const handleSaveRemarks = (e) => {
    e.preventDefault();
    if (!editingDoc?.id) return;
    updateDocument(editingDoc.id, { remarks: remarksDraft });
  };

  const busy = isUploading || isUpdating || isDeleting;

  if (!linkedOrders.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-10 text-center text-sm text-gray-500">
        No LRs are linked to this trip yet. Link orders to the trip before uploading POD copies.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader icon={Camera} title="Proof of delivery (company POD)" />
      <p className="text-xs text-gray-500 -mt-2 max-w-2xl">
        Upload scanned or photographed POD copies for each LR on this trip. Each file is stored as a trip document (type POD).
      </p>

      {linkedOrders.length > 1 && (
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">All LRs — POD preview</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {linkedOrders.map((o) => {
              const pods = podDocsForLr(podDocuments, o.order_id);
              const thumb = pods[0]?.file_url;
              const active = String(activeOrderId || '') === String(o.order_id);
              return (
                <button
                  key={o.order_id}
                  type="button"
                  onClick={() => onActiveOrderChange(o.order_id)}
                  className={`shrink-0 flex flex-col items-center gap-1 rounded-lg border p-2 min-w-[76px] transition-colors ${
                    active ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50/80 hover:border-blue-200'
                  }`}
                >
                  <div className="h-12 w-12 rounded-md bg-gray-200 overflow-hidden flex items-center justify-center">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-gray-400 uppercase px-1 text-center leading-tight">No file</span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-gray-600 truncate max-w-[72px]">{o.lr_number || 'LR'}</span>
                  {pods.length > 0 && (
                    <span className="text-[8px] text-gray-400">{pods.length} file{pods.length !== 1 ? 's' : ''}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Select LR</p>
        <LRTabStrip
          linkedOrders={linkedOrders}
          activeOrderId={resolvedOrderId}
          onChange={onActiveOrderChange}
          maxVisible={8}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-[#172B4D]">POD — {lrMeta?.lr_number || 'LR'}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {lrPods.length} copy{lrPods.length !== 1 ? 'ies' : ''} on file
            </p>
          </div>
          {lrPods.length === 0 && (
            <Badge className="bg-slate-50 text-slate-600 border-slate-100">No POD uploaded yet</Badge>
          )}
        </div>

        {lrPods.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {lrPods.map((doc) => (
              <div key={doc.id} className="group relative rounded-lg border border-gray-100 overflow-hidden bg-gray-50 aspect-square">
                {doc.file_url?.toLowerCase().includes('.pdf') ? (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center h-full p-2 text-center text-xs font-bold text-blue-600"
                  >
                    PDF
                    <span className="text-[9px] font-normal text-gray-500 mt-1 truncate w-full">{doc.document_name || 'POD'}</span>
                  </a>
                ) : (
                  <img src={doc.file_url} alt="POD" className="w-full h-full object-cover" onError={(ev) => { ev.target.style.display = 'none'; }} />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditingDocId(doc.id)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-md bg-white text-blue-600 text-xs font-bold shadow disabled:opacity-40"
                  >
                    Notes
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-md bg-white text-red-600 text-xs font-bold shadow disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
                {doc.delivery_status && (
                  <span className="absolute bottom-1 left-1 text-[8px] font-bold uppercase bg-white/90 px-1 rounded text-gray-600">
                    {doc.delivery_status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end border-t border-gray-50 pt-4">
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Upload POD copy</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold"
              onChange={handleFileChange}
              disabled={busy || !resolvedOrderId}
            />
            <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WebP, GIF, or PDF — max 10 MB</p>
          </div>
          {isUploading && (
            <span className="text-sm font-bold text-blue-600 shrink-0">Uploading…</span>
          )}
        </div>

        {editingDoc && (
          <form onSubmit={handleSaveRemarks} className="space-y-2 border-t border-gray-50 pt-4">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Notes — {editingDoc.document_name || 'POD'}
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              rows={2}
              placeholder="Reference, courier receipt, or other context"
              value={remarksDraft}
              onChange={(e) => setRemarksDraft(e.target.value)}
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || remarksDraft === (editingDoc.remarks || '')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isUpdating ? 'Saving…' : 'Save notes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const FinanceTab = ({
  trip,
  expenses,
  charges,
  isLoadingExp,
  isLoadingChg,
  expensesError,
  onEditFinance,
  onDeleteFinance,
  linkedOrders = [],
  lrRows = [],
  activeOrderTab,
  setActiveOrderTab,
}) => {
  const [activeFinanceTab, setActiveFinanceTab] = useState('trip-charges');
  const isHiredCarrier = trip.vehicle_ownership_type === 'HIRED_CARRIER';
  const lrFinanceMap = useMemo(() => {
    const map = {};
    (trip.lr_finance || []).forEach((row) => {
      map[String(row.order_id)] = row;
    });
    return map;
  }, [trip.lr_finance]);
  const activeLrRow =
    lrRows.find((r) => String(r.order_id) === String(activeOrderTab)) || lrRows[0] || null;
  const activeLrOrder = activeLrRow?.order;
  const activeLrFinance = activeLrRow ? lrFinanceMap[String(activeLrRow.order_id)] : null;
  const hasLrData = linkedOrders.length > 0;

  const financeTabs = [
    { id: 'trip-charges', label: 'Trip Summary' },
    { id: 'lr-finance', label: 'LR Finance' },
    ...(isHiredCarrier ? [{ id: 'owner-carrier', label: 'Owner / Carrier' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5">
        {financeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFinanceTab(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${
              activeFinanceTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeFinanceTab === 'trip-charges' && (
        <div className="space-y-8">
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-xs text-gray-600">
            Ownership: <span className="font-bold text-gray-800">{isHiredCarrier ? 'Hired Carrier' : 'Own Fleet'}</span>
            {!isHiredCarrier && (
              <span className="ml-2 text-gray-500">— vehicle costs tracked via Expenses</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard label="total_bill_amount" value={`₹ ${trip.total_bill_amount || '0.00'}`} icon={DollarSign} accent />
            <InfoCard label="total_freight_charge" value={`₹ ${trip.total_freight_charge || '0.00'}`} icon={Receipt} />
            <InfoCard label="total_accessorial_charge" value={`₹ ${trip.total_accessorial_charge || '0.00'}`} icon={Plus} />
            <InfoCard label="total_tax" value={`₹ ${trip.total_tax || '0.00'}`} icon={Shield} />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
            <SectionHeader icon={Clock} title="Payment Settlement" />
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
              <DataRow label="payment_received_amount" value={`₹ ${trip.payment_received_amount || '0.00'}`} icon={DollarSign} />
              <DataRow label="payment_received_date" value={trip.payment_received_date ? formatDate(trip.payment_received_date) : null} icon={Calendar} />
              <DataRow label="pod_received_date" value={trip.pod_received_date ? formatDate(trip.pod_received_date) : null} icon={FileText} />
              <DataRow label="pod_turnaround_days" value={`${trip.pod_turnaround_days || '—'} Days`} icon={Clock} />
              <DataRow label="is_billed" value={trip.is_billed ? 'Yes' : 'No'} icon={CheckCircle2} />
              <DataRow label="is_paid" value={trip.is_paid ? 'Yes' : 'No'} icon={CheckCircle2} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <SectionHeader icon={Receipt} title="Expense & Charge Records" />
            {expensesError && (
              <p className="mb-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
                Trip expenses could not be loaded from Finance. Charges below are still from this trip.
              </p>
            )}
            {(isLoadingExp || isLoadingChg) ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {[...(expenses || []).map(e => ({
                  ...e,
                  res_type: 'EXPENSE',
                  label: e.expense_type_name || e.expense_type_code || e.description || e.expense_number || 'Expense',
                })), ...(charges || []).map(c => ({ ...c, res_type: 'CHARGE', label: c.charge_type }))].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.res_type === 'EXPENSE' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {item.res_type === 'EXPENSE' ? <Receipt size={18} /> : <Plus size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#172B4D] uppercase tracking-tight">{item.label || item.res_type}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.res_type} • {item.status || 'PENDING'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-lg font-black text-[#172B4D] tracking-tighter">₹ {item.amount || '0.00'}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onEditFinance(item)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={() => onDeleteFinance(item)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {((expenses || []).length + (charges || []).length) === 0 && (
                  <div className="text-center p-12 text-sm text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    No expense or charge records found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeFinanceTab === 'lr-finance' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">LR-specific finance</p>
              {hasLrData && (
                <LRTabStrip
                  linkedOrders={linkedOrders}
                  activeOrderId={activeOrderTab}
                  onChange={setActiveOrderTab}
                  maxVisible={5}
                  className="justify-end"
                />
              )}
            </div>
          </div>
          {!hasLrData ? (
            <div className="text-center p-12 text-sm text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              No LR linked to this trip.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <SectionHeader icon={Receipt} title={`LR Finance${activeLrRow?.lr_number ? ` · ${activeLrRow.lr_number}` : ''}`} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <InfoCard label="freight_charges (LR booking)" value={`₹ ${activeLrOrder?.freight_charges || '0.00'}`} icon={DollarSign} accent />
                <InfoCard label="consignment_value" value={`₹ ${activeLrOrder?.consignment_value || '0.00'}`} icon={PackageIcon} />
                <InfoCard label="advance_received" value={`₹ ${activeLrOrder?.advance_received || '0.00'}`} icon={CreditCard} />
              </div>
              {activeLrFinance ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <DataRow label="freight_charge" value={`₹ ${activeLrFinance.freight_charge || '0.00'}`} icon={DollarSign} />
                    <DataRow label="accessorial_charge" value={`₹ ${activeLrFinance.accessorial_charge || '0.00'}`} icon={Plus} />
                    <DataRow label="tax" value={`₹ ${activeLrFinance.tax || '0.00'}`} icon={Shield} />
                    <DataRow label="bill_amount" value={`₹ ${activeLrFinance.bill_amount || '0.00'}`} icon={Receipt} />
                  </div>
                  <div className="space-y-1">
                    <DataRow label="payment_received_amount" value={`₹ ${activeLrFinance.payment_received_amount || '0.00'}`} icon={DollarSign} />
                    <DataRow label="pod_received_date" value={activeLrFinance.pod_received_date ? formatDate(activeLrFinance.pod_received_date) : null} icon={Calendar} />
                    <DataRow label="payment_received_date" value={activeLrFinance.payment_received_date ? formatDate(activeLrFinance.payment_received_date) : null} icon={Calendar} />
                    <DataRow label="is_billed" value={activeLrFinance.is_billed ? 'Yes' : 'No'} icon={CheckCircle2} />
                    <DataRow label="is_paid" value={activeLrFinance.is_paid ? 'Yes' : 'No'} icon={CheckCircle2} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No billing record for this LR yet.</p>
              )}
              {!isHiredCarrier && (
                <p className="mt-4 text-xs text-gray-500 italic">Own fleet — no carrier hire cost for this LR.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeFinanceTab === 'owner-carrier' && isHiredCarrier && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
            <SectionHeader icon={CreditCard} title={`Owner / Carrier Hire${activeLrRow?.lr_number ? ` · ${activeLrRow.lr_number}` : ''}`} />
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
              <DataRow label="booked_price" value={`₹ ${activeLrFinance?.booked_price ?? trip.booked_price ?? '0.00'}`} icon={DollarSign} />
              <DataRow label="tds_percentage" value={`${activeLrFinance?.tds_percentage ?? trip.tds_percentage ?? '0.00'} %`} icon={Activity} />
              <DataRow label="tds_amount" value={`₹ ${activeLrFinance?.tds_amount ?? trip.tds_amount ?? '0.00'}`} icon={DollarSign} />
              <DataRow label="broker_commission" value={`₹ ${activeLrFinance?.broker_commission ?? trip.broker_commission ?? '0.00'}`} icon={DollarSign} />
              <DataRow label="net_payable" value={`₹ ${activeLrFinance?.net_payable ?? '0.00'}`} icon={DollarSign} />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full overflow-hidden">
            <SectionHeader icon={AlertCircle} title="Adjustments" />
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
              <DataRow label="incentive_amount" value={`₹ ${trip.incentive_amount || '0.00'}`} icon={Plus} />
              <DataRow label="late_fee" value={`₹ ${trip.late_fee || '0.00'}`} icon={AlertCircle} />
              <DataRow label="part_load_charge" value={`₹ ${trip.part_load_charge || '0.00'}`} icon={PackageIcon} />
              <DataRow label="damage_amount" value={`₹ ${trip.damage_amount || '0.00'} (${trip.damage_count || 0} items)`} icon={AlertCircle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CargoTab = ({ tripId, tripStatus, onOpenCreate }) => {
  const { data, isLoading } = useTripCargoItems(tripId, { ordering: '-created_at' });
  const rows = data?.results || (Array.isArray(data) ? data : []);
  const canAddCargo = !['COMPLETED', 'CANCELLED'].includes(tripStatus);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={PackageIcon}
        title="Trip Cargo"
        action={
          canAddCargo ? (
            <button type="button" onClick={onOpenCreate} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
              Add Cargo Item
            </button>
          ) : null
        }
      />
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No cargo linked to this trip.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((item) => (
            <div key={item.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#172B4D]">{item.item_code || item.id.slice(-8)} - {item.description}</p>
                <p className="text-xs text-gray-500">{item.commodity_type || 'GENERAL'} | Qty {item.quantity}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/tenant/dashboard/orders/cargo/${item.id}`} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">View</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryTab = ({ history, isLoading }) => {
    const { data: currentUser } = useCurrentUser();
    
    const DetailItem = ({ label, value }) => (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-[12px] font-bold text-gray-800 break-words leading-tight">{value || '—'}</span>
      </div>
    );

    return (
      <div className="space-y-4">
        <SectionHeader icon={History} title="Trip Lifecycle (Status History)" />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : history?.length > 0 ? (
          <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {[...history].reverse().map((h, i) => (
              <div key={h.id} className="relative group/history">
                <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 bg-blue-500" />
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex justify-between items-center transition-all hover:border-[#4a6cf7]/30 hover:shadow-md relative cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">{formatDateTime(h.created_at || h.changed_at)}</span>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-bold">{h.status}</Badge>
                    </div>
                    <p className="text-sm font-black text-[#172B4D] leading-tight">{h.remarks || h.notes || `Status transitioned to ${h.status}`}</p>
                  </div>
                  <div className="text-right mr-4 shrink-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Changed By</p>
                      <p className="text-sm font-black text-[#172B4D] uppercase">{h.user?.username || currentUser?.username || 'System'}</p>
                  </div>

                  {/* Hover Detail Card (Centered-Top with overflow fix) */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[110%] mb-3 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 z-[100] opacity-0 invisible group-hover/history:opacity-100 group-hover/history:visible transition-all duration-300 pointer-events-none scale-95 group-hover/history:scale-100 origin-bottom border-b-4 border-b-[#4a6cf7]">
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45" />
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                          <DetailItem label="Status" value={h.status} />
                          <DetailItem label="Changed At" value={new Date(h.changed_at).toLocaleTimeString()} />
                          <DetailItem label="Latitude" value={h.latitude} />
                          <DetailItem label="Longitude" value={h.longitude} />
                          <DetailItem label="Created At" value={formatDateTime(h.created_at)} />
                          <DetailItem label="Changed By ID" value={h.changed_by} />
                          <div className="col-span-2 border-t border-gray-50 pt-3">
                             <DetailItem label="Remarks" value={h.remarks || '—'} />
                          </div>
                          <div className="col-span-2">
                             <DetailItem label="Additional Data" value={Object.keys(h.additional_data || {}).length > 0 ? JSON.stringify(h.additional_data) : '{}'} />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No status changes recorded.</p>
          </div>
        )}
      </div>
    );
  };

// --- Main COMPONENT ---
export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('view') || 'overview');
  useEffect(() => {
    const view = searchParams.get('view');
    if (view) setActiveTab(view);
  }, [searchParams]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateCargoOpen, setIsCreateCargoOpen] = useState(false);
  const [editFinanceItem, setEditFinanceItem] = useState(null);
  const [editFinanceForm, setEditFinanceForm] = useState({ amount: '', description: '' });
  const deleteTripMutation = useDeleteTrip();

  const handleBack = () => navigate('/tenant/dashboard/orders/trips');

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      deleteTripMutation.mutate(id, {
        onSuccess: () => handleBack()
      });
    }
  };

  const { data: trip, isLoading, isError } = useTripDetail(id);

  const linkedOrders = useMemo(() => {
    if (!trip) return [];
    if (trip.linked_orders?.length) return trip.linked_orders;
    if (trip.order_id) {
      return [{ order_id: trip.order_id, lr_number: trip.lr_number, reference_number: trip.reference_number }];
    }
    return [];
  }, [trip?.linked_orders, trip?.order_id, trip?.lr_number, trip?.reference_number]);

  const lrOrderQueries = useQueries({
    queries: linkedOrders.map((link) => ({
      queryKey: orderKeys.detail(link.order_id),
      queryFn: () => ordersApi.get(link.order_id),
      enabled: !!link.order_id,
      staleTime: 60_000,
    })),
  });

  const lrRows = useMemo(
    () =>
      linkedOrders.map((link, index) => ({
        ...link,
        order: lrOrderQueries[index]?.data,
      })),
    [linkedOrders, lrOrderQueries]
  );

  const lrOrdersLoading = lrOrderQueries.some((q) => q.isLoading);

  const activeOrderTab = useMemo(() => {
    const fromUrl = searchParams.get('lr');
    if (linkedOrders.length) {
      const hit = linkedOrders.find((o) => String(o.order_id) === String(fromUrl));
      if (hit) return hit.order_id;
      return linkedOrders[0]?.order_id ?? null;
    }
    return fromUrl || null;
  }, [searchParams, linkedOrders]);

  const setActiveOrderTab = useCallback(
    (orderId) => {
      const next = new URLSearchParams(searchParams);
      if (orderId != null && orderId !== '') next.set('lr', String(orderId));
      else next.delete('lr');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Normalize invalid/missing ?lr= once linked orders are known (URL is source of truth).
  useEffect(() => {
    if (!linkedOrders.length) return;
    const fromUrl = searchParams.get('lr');
    const valid = linkedOrders.some((o) => String(o.order_id) === String(fromUrl));
    if (!fromUrl || !valid) {
      const next = new URLSearchParams(searchParams);
      next.set('lr', String(linkedOrders[0].order_id));
      setSearchParams(next, { replace: true });
    }
  }, [id, linkedOrders, searchParams, setSearchParams]);

  const stopQueryParams = useMemo(
    () => (activeOrderTab ? { order_id: activeOrderTab } : {}),
    [activeOrderTab]
  );

  const { data: order } = useOrderDetail(activeOrderTab || trip?.order_id);
  const { data: stops, isLoading: loadingStops } = useTripStops(id, stopQueryParams);
  const { data: expenses, isLoading: loadingExp, isError: expensesError } = useTripExpenses(id, {
    enabled: activeTab === 'finance',
    suppressErrorToast: true,
  });
  const { data: charges, isLoading: loadingChg } = useTripCharges(id);
  const { data: docs } = useTripDocuments(id);
  const { data: history, isLoading: loadingHistory } = useTripStatusHistory(id, stopQueryParams);
  const { data: tripPodDocs } = useTripDeliveries(id);
  const uploadPodMutation = useUploadTripPod(id);
  const updatePodDocMutation = useUpdateTripDocument(id);
  const deletePodDocMutation = useDeleteTripDocument(id);

  const createStopMutation = useCreateTripStop(id);
  const updateStopMutation = useUpdateTripStop(id);
  const deleteStopMutation = useDeleteTripStop(id);
  const updateTripMutation = useUpdateTrip();
  const updateExpenseMutation = useUpdateTripExpense(id);
  const deleteExpenseMutation = useDeleteTripExpense(id);
  const updateChargeMutation = useUpdateTripCharge(id);
  const deleteChargeMutation = useDeleteTripCharge(id);

  const handleEditFinance = (item) => {
    setEditFinanceItem(item);
    setEditFinanceForm({
      amount: item.amount ?? '',
      description: item.description || item.remarks || '',
    });
  };

  const handleDeleteFinance = (item) => {
    if (!window.confirm(`Delete this ${item.res_type.toLowerCase()} record?`)) return;
    if (item.res_type === 'EXPENSE') {
      deleteExpenseMutation.mutate(item.id);
    } else {
      deleteChargeMutation.mutate(item.id);
    }
  };

  const closeEditFinanceModal = () => {
    setEditFinanceItem(null);
    setEditFinanceForm({ amount: '', description: '' });
  };

  const handleSaveFinance = (e) => {
    e.preventDefault();
    if (!editFinanceItem) return;
    const payload = {
      amount: editFinanceForm.amount,
      description: editFinanceForm.description,
    };
    if (editFinanceItem.res_type === 'EXPENSE') {
      updateExpenseMutation.mutate(
        { expenseId: editFinanceItem.id, data: payload },
        { onSuccess: closeEditFinanceModal }
      );
    } else {
      updateChargeMutation.mutate(
        { chargeId: editFinanceItem.id, data: payload },
        { onSuccess: closeEditFinanceModal }
      );
    }
  };

  const driverId = trip?.primary_driver_id || trip?.driver_id;
  const vehicleId = trip?.primary_vehicle_id || trip?.vehicle_id;
  const altDriverId = trip?.alternate_driver_id;
  const altVehicleId = trip?.alternate_vehicle_id;

  const { data: driver, isLoading: loadingDriver } = useDriverDetail(driverId);
  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(vehicleId);
  const { data: altDriver } = useDriverDetail(altDriverId);
  const { data: altVehicle } = useVehicle(altVehicleId);

  const getDriverDisplay = (d, id, fallback) => {
    if (!id || id === 'null') return 'Unassigned';
    return d ? `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim() : (fallback || 'Unassigned');
  };

  const getVehicleDisplay = (v, id, fallback) => {
    if (!id || id === 'null') return 'Unassigned';
    return v ? (v.registration_number || v.registration) : (fallback || 'Unassigned');
  };

  const flatTripPodDocs = useMemo(() => {
    const raw = tripPodDocs;
    return Array.isArray(raw) ? raw : raw?.results || [];
  }, [tripPodDocs]);

  const sortedStops = useMemo(() => {
    const stopRows = Array.isArray(stops) ? stops : stops?.results || [];
    return [...stopRows].sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));
  }, [stops]);

  const scopedHistoryRows = useMemo(() => {
    const rows = Array.isArray(history) ? history : history?.results || [];
    return rows;
  }, [history]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (isError || !trip) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#172B4D]">Trip Not Found</h2>
      <button onClick={handleBack} className="mt-4 text-[#0052CC] font-bold hover:underline">Back to Trips</button>
    </div>
  );

  const statusMap = {
    CREATED: { bg: 'bg-blue-50', color: 'text-blue-600', dot: 'bg-blue-600' },
    ASSIGNED: { bg: 'bg-indigo-50', color: 'text-indigo-600', dot: 'bg-indigo-600' },
    DISPATCHED: { bg: 'bg-cyan-50', color: 'text-cyan-600', dot: 'bg-cyan-600' },
    IN_TRANSIT: { bg: 'bg-indigo-50', color: 'text-indigo-600', dot: 'bg-indigo-600' },
    DELAYED: { bg: 'bg-amber-50', color: 'text-amber-600', dot: 'bg-amber-600' },
    ARRIVED: { bg: 'bg-purple-50', color: 'text-purple-600', dot: 'bg-purple-600' },
    DELIVERED: { bg: 'bg-emerald-50', color: 'text-emerald-600', dot: 'bg-emerald-600' },
    COMPLETED: { bg: 'bg-green-50', color: 'text-green-600', dot: 'bg-green-600' },
    CANCELLED: { bg: 'bg-rose-50', color: 'text-rose-600', dot: 'bg-rose-600' },
  };
  const st = statusMap[trip.status] || statusMap.CREATED;
  const nextStatuses = TRIP_TRANSITIONS[trip.status] || [];
  const firstPickupStop = sortedStops.find((s) => s.stop_type === 'PICKUP' && (s.location_address || '').trim());
  const deliveryStops = sortedStops.filter((s) => s.stop_type === 'DELIVERY' && (s.location_address || '').trim());
  const lastDeliveryStop = deliveryStops.length ? deliveryStops[deliveryStops.length - 1] : null;
  const activeLrOrder = lrRows.find((r) => String(r.order_id) === String(activeOrderTab))?.order || order;
  const originDisplay =
    (activeLrOrder?.consignor_address || '').trim()
    || firstPickupStop?.location_address
    || trip.origin_address
    || trip.origin
    || '—';
  const destinationDisplay =
    (activeLrOrder?.consignee_address || '').trim()
    || lastDeliveryStop?.location_address
    || trip.destination_address
    || trip.destination
    || '—';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: MapIcon },
    { id: 'journey', label: 'Journey & Fleet', icon: Truck },
    { id: 'finance', label: 'Financials', icon: Receipt },
    { id: 'cargo', label: 'Cargo', icon: PackageIcon },
    { id: 'stops', label: 'Stops', icon: MapPin, count: (Array.isArray(stops) ? stops : stops?.results)?.length },
    { id: 'history', label: 'Status History', icon: History, count: (Array.isArray(history) ? history : history?.results)?.length },
    { id: 'deliveries', label: 'POD', icon: Camera, count: flatTripPodDocs.length },
    { id: 'docs', label: 'Documents', icon: FileText, count: docs?.length },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4">
          <button onClick={handleBack} className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">Trips</button>
          <ChevronRight size={10} className="text-gray-300" strokeWidth={3} />
          <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 cursor-default">{trip.trip_number}</span>
        </div>

        {linkedOrders.length > 0 && (
          <div className="sticky top-0 z-40 -mx-1 px-1 py-2.5 mb-4 rounded-xl bg-[#F8FAFC]/95 backdrop-blur-sm border border-gray-200/70 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">Active LR</span>
              <LRTabStrip
                linkedOrders={linkedOrders}
                activeOrderId={activeOrderTab}
                onChange={setActiveOrderTab}
                maxVisible={5}
                className="flex-1 min-w-0"
              />
              <div className="hidden xl:flex flex-wrap items-center gap-1.5 shrink-0">
                {linkedOrders.map((o) => {
                  const hasPod = podDocsForLr(flatTripPodDocs, o.order_id).length > 0;
                  return (
                    <span
                      key={o.order_id}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-white px-2 py-0.5 text-[10px] font-bold text-gray-600"
                      title={hasPod ? 'POD on file' : 'No POD yet'}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${hasPod ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {o.lr_number || 'LR'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100/80 overflow-hidden shadow-xl shadow-gray-200/40">
          <div className="p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 flex items-center justify-between max-w-5xl gap-12">
              {/* Origin */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Origin</p>
                <h1 className="text-2xl font-bold text-[#172B4D] leading-tight break-words">{originDisplay}</h1>
              </div>

              {/* Middle Line */}
              <div className="flex-1 flex flex-col items-center justify-center min-w-[80px]">
                <div className="w-full flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100 rounded-full" />
                    <ArrowRight size={14} className="text-blue-500" />
                    <div className="h-px flex-1 bg-gray-100 rounded-full" />
                </div>
              </div>

              {/* Destination */}
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Destination</p>
                <h1 className="text-2xl font-bold text-[#172B4D] leading-tight break-words">{destinationDisplay}</h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => setIsEditOpen(true)} 
                className="flex items-center gap-2.5 px-6 py-3 bg-[#4a6cf7] border border-[#4a6cf7] rounded-xl text-sm font-semibold text-white hover:bg-[#3b59d9] hover:border-[#3b59d9] cursor-pointer transition-all shadow-md shadow-blue-200/40">
                <Edit3 size={14} strokeWidth={2.5} /> Edit Trip
              </button>
              <button onClick={handleDelete} 
                disabled={deleteTripMutation.isLoading}
                className="flex items-center gap-2.5 px-6 py-3 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-100 cursor-pointer transition-all">
                <Trash2 size={14} strokeWidth={2.5} /> {deleteTripMutation.isLoading ? 'Deleting...' : 'Delete Trip'}
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="px-8 pb-8 flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${st.bg} ${st.color}`}>
                  <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                  {trip.status}
              </div>
              <div className="px-3 py-1.5 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                  {trip.trip_type || 'FTL'}
              </div>
              {linkedOrders.length ? linkedOrders.map((linked) => (
                <button
                  key={linked.order_id}
                  type="button"
                  onClick={() => setActiveOrderTab(linked.order_id)}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-[10px] font-bold transition-all ${
                    String(activeOrderTab) === String(linked.order_id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Hash size={10} className={String(activeOrderTab) === String(linked.order_id) ? 'text-blue-200' : 'text-gray-200'} />
                  {linked.lr_number || 'LR-PENDING'}
                </button>
              )) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500">
                  <Hash size={10} className="text-gray-200" />
                  {order?.lr_number || trip.lr_number || 'LR-PENDING'}
                </div>
              )}
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateTripMutation.mutate({ id: trip.id, data: { status } })}
                  disabled={updateTripMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  Move to {status}
                </button>
              ))}
          </div>

          {/* Bottom Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-t border-gray-50">
            {/* Driver */}
            <div className="p-6 border-r border-gray-50 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <User size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Driver</p>
                    <p className="text-base font-black text-blue-600 leading-none mb-1 tracking-tight truncate">{getDriverDisplay(driver, driverId, trip?.primary_driver_name)}</p>
                </div>
            </div>

            {/* Vehicle */}
            <div className="p-6 border-r border-gray-50 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Truck size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Vehicle</p>
                    <p className="text-base font-black text-[#172B4D] leading-none mb-1 tracking-tight truncate">{getVehicleDisplay(vehicle, vehicleId, trip?.vehicle_number)}</p>
                </div>
            </div>

            {/* Status */}
            <div className="p-6 border-r border-gray-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Status</p>
                    <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <p className="text-base font-black text-amber-600 leading-none tracking-tight truncate">{trip.status}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 italic">Current state</p>
                </div>
            </div>

            {/* Total Bill */}
            <div className="p-6 bg-emerald-50/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Plus size={22} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1.5">Total Bill</p>
                    <p className="text-base font-black text-emerald-700 leading-none mb-1 tracking-tight truncate">
                        ₹{trip.total_bill_amount || '0.00'}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600/60 italic">{trip.is_billed ? 'Billed' : 'Not billed yet'}</p>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 relative">
          <div className="flex overflow-x-auto border-b border-gray-50 bg-gray-50/30 scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-8 py-4 text-xs font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wide
                   ${activeTab === tab.id ? 'border-[#0052CC] text-[#0052CC] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}>
                <tab.icon size={13} strokeWidth={2.5} />
                {tab.label}
                {tab.count !== undefined && <span className={`ml-1 text-[9px] px-2 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-[#0052CC] text-white shadow-md shadow-blue-100' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="p-8 lg:p-10 bg-gradient-to-b from-white to-gray-50/30 min-h-[500px]">
            {activeTab === 'overview' && (
              <OverviewTab
                trip={trip}
                order={order}
                navigate={navigate}
                lrRows={lrRows}
                activeOrderTab={activeOrderTab}
                setActiveOrderTab={setActiveOrderTab}
                ordersLoading={lrOrdersLoading}
              />
            )}
            {activeTab === 'journey' && (
              <div className="space-y-3">
                <ScopeBadge variant="trip" />
                <JourneyTab 
                    trip={trip} 
                    driver={getDriverDisplay(driver, driverId, trip?.primary_driver_name)} 
                    vehicle={getVehicleDisplay(vehicle, vehicleId, trip?.vehicle_number)} 
                    isLoadingNames={loadingDriver || loadingVehicle}
                    altDriver={getDriverDisplay(altDriver, altDriverId, trip?.alternate_driver_name)}
                    altVehicle={getVehicleDisplay(altVehicle, altVehicleId, trip?.alternate_vehicle_number)}
                />
              </div>
            )}
            {activeTab === 'finance' && <div className="space-y-3"><ScopeBadge variant="trip" /><FinanceTab trip={trip} expenses={expenses} charges={charges} isLoadingExp={loadingExp} isLoadingChg={loadingChg} expensesError={expensesError} onEditFinance={handleEditFinance} onDeleteFinance={handleDeleteFinance} linkedOrders={linkedOrders} lrRows={lrRows} activeOrderTab={activeOrderTab} setActiveOrderTab={setActiveOrderTab} /></div>}
            {activeTab === 'cargo' && <div className="space-y-3"><ScopeBadge variant="trip" /><CargoTab tripId={id} tripStatus={trip?.status} onOpenCreate={() => setIsCreateCargoOpen(true)} /></div>}
            {activeTab === 'stops' && (
              <div className="space-y-3">
                <ScopeBadge variant="lr" />
                <LrScopeBanner activeOrderTab={activeOrderTab} linkedOrders={linkedOrders} stopsCount={sortedStops.length} />
                <StopsTab
                tripId={id}
                stops={sortedStops}
                isLoading={loadingStops}
                onCreateStop={(data) => createStopMutation.mutate(data)}
                onUpdateStopStatus={(stopId, stopStatus, extraData = {}) => {
                  const data = stopStatus ? { stop_status: stopStatus, ...extraData } : extraData;
                  updateStopMutation.mutate({ stopId, data });
                }}
                onDeleteStop={(stopId) => {
                  if (window.confirm('Delete this stop?')) deleteStopMutation.mutate(stopId)
                }}
              />
              </div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <ScopeBadge variant="lr" />
                <LrScopeBanner activeOrderTab={activeOrderTab} linkedOrders={linkedOrders} />
                <HistoryTab history={scopedHistoryRows} isLoading={loadingHistory} />
              </div>
            )}
            {activeTab === 'deliveries' && (
              <div className="space-y-3">
                <ScopeBadge variant="lr" />
                <LrScopeBanner activeOrderTab={activeOrderTab} linkedOrders={linkedOrders} />
                <DeliveriesTab
                tripId={id}
                linkedOrders={linkedOrders}
                activeOrderId={activeOrderTab}
                onActiveOrderChange={setActiveOrderTab}
                podDocuments={flatTripPodDocs}
                isUploading={uploadPodMutation.isPending}
                isUpdating={updatePodDocMutation.isPending}
                isDeleting={deletePodDocMutation.isPending}
                uploadPod={(formData, callbacks) => uploadPodMutation.mutate(formData, callbacks)}
                updateDocument={(documentId, data) =>
                  updatePodDocMutation.mutate({ documentId, data })
                }
                deleteDocument={(documentId) =>
                  deletePodDocMutation.mutate(documentId)
                }
              />
              </div>
            )}
            {activeTab === 'docs' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Clock size={32} className="opacity-20 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">In Development</p>
                <p className="text-[10px] uppercase tracking-wider mt-2">Document Management System Coming Soon</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {trip && (
        <EditTripModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          trip={trip}
        />
      )}
      <EditFinanceModal
        isOpen={!!editFinanceItem}
        onClose={closeEditFinanceModal}
        value={editFinanceForm}
        onChange={setEditFinanceForm}
        onSubmit={handleSaveFinance}
        isPending={updateExpenseMutation.isPending || updateChargeMutation.isPending}
        title={editFinanceItem?.res_type === 'EXPENSE' ? 'Edit Expense' : 'Edit Charge'}
      />
      <CreateCargoModal
        isOpen={isCreateCargoOpen}
        onClose={() => setIsCreateCargoOpen(false)}
        presetTripId={id}
      />
    </div>
  );
}

