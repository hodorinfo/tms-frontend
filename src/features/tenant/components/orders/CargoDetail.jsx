import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, Layers, 
  ChevronRight, Loader2, AlertCircle, 
  Hash, Scale, Maximize, Shield, 
  MapPin, Clock, Edit2, AlertTriangle, Thermometer, Trash2
} from 'lucide-react';
import {
  useCargoDetail,
  useTripDetail,
  useOrderDetail,
  useCargoMovements,
  useCreateCargoMovement,
  useTripStops,
  useDeleteCargo,
} from '../../queries/orders/ordersQuery';
import { EditCargoModal } from './CargoModals';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

// --- Shared Components ---
const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${className}`}>
    {children}
  </span>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon size={18} className="text-[#0052CC]" />
    <h3 className="text-sm font-black text-[#172B4D] uppercase tracking-wider">{title}</h3>
  </div>
);

const InfoCard = ({ label, value, icon: Icon, accent = false }) => (
  <div className={`p-4 rounded-xl border transition-all ${accent ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className={`text-sm font-bold truncate ${accent ? 'text-blue-700' : 'text-[#172B4D]'}`}>{value || '—'}</p>
      </div>
    </div>
  </div>
);

// --- Main COMPONENT ---
export default function CargoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: item, isLoading, isError } = useCargoDetail(id);
  const { data: trip } = useTripDetail(item?.trip || item?.trip_id);
  const { data: order } = useOrderDetail(item?.order || trip?.order || trip?.order_id);
  const { data: movementsData } = useCargoMovements(id);
  const { data: tripStopsData } = useTripStops(item?.trip || item?.trip_id);
  const createMovement = useCreateCargoMovement(id);
  const deleteMutation = useDeleteCargo();
  const [movementForm, setMovementForm] = useState({ stop: '', action: 'LOADED', quantity: '', notes: '' });

  const handleBack = () => navigate('/tenant/dashboard/orders/cargo');

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (isError || !item) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#172B4D]">Cargo Item Not Found</h2>
      <button onClick={handleBack} className="mt-4 text-[#0052CC] font-bold hover:underline">Back to Cargo</button>
    </div>
  );

  const TYPE_COLORS = {
    HAZARDOUS: 'bg-red-50 text-red-600 border-red-100',
    PERISHABLE: 'bg-teal-50 text-teal-600 border-teal-100',
    FRAGILE: 'bg-amber-50 text-amber-600 border-amber-100',
    HIGH_VALUE: 'bg-purple-50 text-purple-600 border-purple-100',
    OTHER: 'bg-slate-50 text-slate-600 border-slate-100',
    GENERAL: 'bg-blue-50 text-blue-600 border-blue-100',
  };
  const movements = movementsData?.results || (Array.isArray(movementsData) ? movementsData : []);
  const tripStops = tripStopsData?.results || (Array.isArray(tripStopsData) ? tripStopsData : []);
  const canSubmitMovement = movementForm.stop && movementForm.quantity;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full space-y-6">
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={handleBack} className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline transition-all">
            <ArrowLeft size={14} /> Cargo Inventory
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{item.item_code || item.id.slice(-8)}</span>
        </div>

        {/* Header Summary */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">


            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex items-start justify-between gap-4 text-left">
                <div>
                  <h1 className="text-2xl font-black text-[#172B4D] flex items-center gap-3">
                    {item.description || 'Unnamed Cargo Item'}
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200 uppercase tracking-wider">{item.item_code || item.id.slice(-6)}</span>
                  </h1>
                  <p className="text-sm text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    {item.package_type || 'General Goods'} · Commodity: {item.commodity_type || 'General'} · Quantity: {item.quantity || 1}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge className={TYPE_COLORS[item.commodity_type] || TYPE_COLORS.GENERAL}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {item.commodity_type || 'General'}
                    </Badge>
                    {item.is_fragile && <Badge className="bg-amber-50 text-amber-600 border-amber-100">Fragile</Badge>}
                    {item.is_perishable && <Badge className="bg-teal-50 text-teal-600 border-teal-100">Perishable</Badge>}
                    {item.insurance_required && <Badge className="bg-purple-50 text-purple-600 border-purple-100">Insured</Badge>}
                  </div>
                </div>
                 <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this cargo item? All linked data may be removed.')) {
                        deleteMutation.mutate(id, {
                          onSuccess: () => navigate('/tenant/dashboard/orders/cargo')
                        });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 text-sm font-black text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Trash2 size={14} className="inline mr-2" /> 
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 text-sm font-black text-[#0052CC] bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                  >
                    <Edit2 size={14} className="inline mr-2" /> Edit Item
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <InfoCard label="Weight" value={`${item.weight_kg || '—'} kg`} icon={Scale} accent />
                <InfoCard label="Volume" value={`${item.volume_cbm || '—'} m³`} icon={Layers} />
                <InfoCard label="Linked LR" value={order?.lr_number || item.order || 'N/A'} icon={Clock} />
                <InfoCard label="Stock Code" value={item.item_code} icon={Hash} />
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-4">Movement Reconciliation</p>
                <div className="grid grid-cols-5 gap-3">
                   <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-tight mb-1">Remaining</p>
                     <p className="text-sm font-bold text-blue-700">{item.remaining_quantity ?? '—'}</p>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-1">Loaded</p>
                     <p className="text-sm font-bold text-gray-700">{item.total_loaded ?? 0}</p>
                   </div>
                   <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-1">Unloaded</p>
                     <p className="text-sm font-bold text-gray-700">{item.total_unloaded ?? 0}</p>
                   </div>
                   <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                     <p className="text-[9px] font-black text-amber-500 uppercase tracking-tight mb-1">Short</p>
                     <p className="text-sm font-bold text-amber-700">{item.total_short ?? 0}</p>
                   </div>
                   <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-center">
                     <p className="text-[9px] font-black text-red-500 uppercase tracking-tight mb-1">Damaged</p>
                     <p className="text-sm font-bold text-red-700">{item.total_damaged ?? 0}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physical specs */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
             <SectionHeader icon={Maximize} title="Physical Dimensions" />
             <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Length</p>
                  <p className="text-lg font-black text-[#172B4D]">{item.length_cm} <span className="text-[10px] text-gray-400">cm</span></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Width</p>
                  <p className="text-lg font-black text-[#172B4D]">{item.width_cm} <span className="text-[10px] text-gray-400">cm</span></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Height</p>
                  <p className="text-lg font-black text-[#172B4D]">{item.height_cm} <span className="text-[10px] text-gray-400">cm</span></p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Stackable" value={item.stackable ? 'Yes' : 'No'} icon={Layers} />
                <InfoCard label="Orientation" value={item.orientation} icon={MapPin} />
             </div>
          </div>

          {/* Context & Requirements */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
             <SectionHeader icon={Shield} title="Shipping Context" />
             <div className="space-y-4">
                 <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Linked Trip</p>
                       <p className="text-sm font-bold text-blue-700 truncate">{trip?.trip_number || 'Unlinked'}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">LR Number</p>
                       <p className="text-sm font-bold text-gray-700 truncate">{order?.lr_number || 'N/A'}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Package Type</p>
                      <p className="text-sm font-bold text-gray-700 truncate">{item.package_type || '—'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-center text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Quantity</p>
                      <p className="text-sm font-bold text-gray-700">{item.quantity || 1}</p>
                    </div>
                    <div className="col-span-2 p-3 bg-teal-50/30 rounded-xl border border-teal-100/50 flex flex-col justify-center text-left">
                       <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest leading-none mb-1">Temp Requirement</p>
                       <p className={`text-sm font-bold ${item.temperature_range ? 'text-teal-700' : 'text-gray-400'}`}>{item.temperature_range || 'Standard Ambient'}</p>
                    </div>
                 </div>

                 <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1.5">Hazardous Classification</p>
                      <p className={`text-sm font-bold ${item.hazardous_class ? 'text-red-700' : 'text-gray-400'}`}>{item.hazardous_class ? `Class ${item.hazardous_class}` : 'Not Hazardous'}</p>
                    </div>
                    {item.hazardous_class && <AlertTriangle size={18} className="text-red-600" />}
                 </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <SectionHeader icon={Clock} title="Movement History" />
            <div className="space-y-3">
              {movements.length === 0 ? (
                <p className="text-sm text-gray-400">No movement entries yet.</p>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="p-3 border border-gray-100 rounded-xl">
                    <p className="text-xs font-bold text-[#172B4D]">{m.action} - Qty {m.quantity}</p>
                    <p className="text-[11px] text-gray-500">
                      Stop: #{m.stop_sequence || '-'} {m.stop_type || ''} {m.stop_address ? `- ${m.stop_address}` : m.stop}
                    </p>
                    <p className="text-[11px] text-gray-500">Notes: {m.notes || '-'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
            <SectionHeader icon={Edit2} title="Record Movement" />
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmitMovement) return;
                createMovement.mutate(
                  { ...movementForm, quantity: Number(movementForm.quantity) },
                  { onSuccess: () => setMovementForm({ stop: '', action: 'LOADED', quantity: '', notes: '' }) }
                );
              }}
            >
              <select className="w-full p-2 border border-gray-200 rounded-lg" value={movementForm.stop} onChange={(e) => setMovementForm((p) => ({ ...p, stop: e.target.value }))}>
                <option value="">Select stop</option>
                {tripStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    #{stop.stop_sequence} {stop.stop_type} - {stop.location_address || 'No location'}
                  </option>
                ))}
              </select>
              <select className="w-full p-2 border border-gray-200 rounded-lg" value={movementForm.action} onChange={(e) => setMovementForm((p) => ({ ...p, action: e.target.value }))}>
                <option value="LOADED">LOADED</option>
                <option value="UNLOADED">UNLOADED</option>
                <option value="SHORT">SHORT</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
              <input type="number" min="1" className="w-full p-2 border border-gray-200 rounded-lg" placeholder="Quantity" value={movementForm.quantity} onChange={(e) => setMovementForm((p) => ({ ...p, quantity: e.target.value }))} />
              <textarea rows="2" className="w-full p-2 border border-gray-200 rounded-lg" placeholder="Notes" value={movementForm.notes} onChange={(e) => setMovementForm((p) => ({ ...p, notes: e.target.value }))} />
              <button type="submit" disabled={createMovement.isPending || !canSubmitMovement} className="px-4 py-2 rounded-lg bg-[#4a6cf7] text-white font-bold disabled:opacity-50">
                {createMovement.isPending ? 'Saving...' : 'Record Movement'}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 pb-10 border-t border-gray-200 flex flex-col md:flex-row justify-center items-center gap-12 text-center text-gray-500">
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">System Created At</p>
             <p className="text-xs font-bold text-gray-600">{item.created_at ? formatDateTime(item.created_at) : 'N/A'}</p>
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Last System Update</p>
             <p className="text-xs font-bold text-gray-600">{item.updated_at ? formatDateTime(item.updated_at) : 'N/A'}</p>
           </div>
        </div>

      </div>
      
      {item && (
        <EditCargoModal 
          isOpen={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          item={item} 
        />
      )}
    </div>
  );
}
