import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileCheck, MapPin,
  ChevronRight, Loader2, AlertCircle,
  Hash, User, Calendar, Shield,
  Clock, MapIcon, Layers, Camera,
  PenTool, CheckCircle2,
  Maximize
} from 'lucide-react';
import { useDeliveryDetail, useTripDetail, useUpdateDelivery, useDeleteDelivery } from '../../queries/orders/ordersQuery';
import { EditDeliveryModal } from './DeliveryModals';

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
export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const updateDeliveryMutation = useUpdateDelivery();
  const deleteDeliveryMutation = useDeleteDelivery();

  const { data: pod, isLoading, isError, error } = useDeliveryDetail(id);
  const tripId = pod?.trip_id || pod?.trip;
  const { data: trip } = useTripDetail(tripId);

  const handleBack = () => navigate('/tenant/dashboard/orders/deliveries');

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (isError || !pod) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#172B4D]">Delivery Record Not Found</h2>
      <button onClick={handleBack} className="mt-4 text-[#0052CC] font-bold hover:underline">Back to Deliveries</button>
    </div>
  );

  const statusMap = {
    DELIVERED: { bg: 'bg-green-50', color: 'text-green-600', dot: 'bg-green-600' },
    PARTIAL: { bg: 'bg-amber-50', color: 'text-amber-600', dot: 'bg-amber-600' },
    DAMAGED: { bg: 'bg-red-50', color: 'text-red-600', dot: 'bg-red-600' },
    REFUSED: { bg: 'bg-orange-50', color: 'text-orange-600', dot: 'bg-orange-600' },
    RETURNED: { bg: 'bg-slate-50', color: 'text-slate-600', dot: 'bg-slate-600' },
  };
  const st = statusMap[pod.delivery_status] || statusMap.DELIVERED;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full space-y-6">

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={handleBack} className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline transition-all">
            <ArrowLeft size={14} /> Deliveries & POD
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="font-semibold text-[#172B4D]">{pod.document_name || pod.id.slice(-8)}</span>
        </div>

        {/* Header Summary */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">


            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex items-start justify-between gap-4 text-left">
                <div>
                  <h1 className="text-2xl font-black text-[#172B4D] flex items-center gap-3">
                    {pod.received_by_name || pod.received_by || 'Unknown Recipient'}
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200 uppercase tracking-wider">{pod.trip_number || 'TR-' + pod.id.slice(-6)}</span>
                  </h1>
                  <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">
                    Trip document · {pod.document_name || 'POD copy'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge className={`${st.bg} ${st.color} border-current/20`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {pod.delivery_status}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                      <FileCheck size={10} />
                      POD RECORD
                    </Badge>
                    <Badge className="bg-gray-50 text-gray-600 border-gray-100 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {pod.created_at ? new Date(pod.created_at).toLocaleDateString() : '—'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-5 py-2.5 text-sm font-black text-[#0052CC] bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm flex items-center gap-2"
                  >
                    Edit Record
                  </button>
                  <button
                    onClick={() => {
                      updateDeliveryMutation.mutate({
                        id: pod.id,
                        tripId,
                        data: { delivery_status: 'DELIVERED', verified_status: 'VERIFIED' },
                      });
                    }}
                    className="px-5 py-2.5 text-sm font-black text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Verify POD
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this POD record?')) {
                        deleteDeliveryMutation.mutate({ id: pod.id, tripId }, { onSuccess: handleBack });
                      }
                    }}
                    className="px-5 py-2.5 text-sm font-black text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <InfoCard label="Uploaded" value={pod.created_at ? new Date(pod.created_at).toLocaleString() : '—'} icon={Clock} accent />
                <InfoCard label="Trip Number" value={pod.trip_number || trip?.trip_number} icon={Hash} />
                <InfoCard label="File" value={pod.document_name || 'POD'} icon={MapPin} />
                <InfoCard label="Record ID" value={pod.id.slice(-8)} icon={Layers} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <SectionHeader icon={Shield} title="Recipient Verification" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoCard label="Recipient Name" value={pod.received_by_name || pod.received_by} icon={User} />
                  <InfoCard label="Relationship" value={pod.received_by_relation} icon={Layers} />
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><PenTool size={12} /> Digital Signature</p>
                    {pod.signature_url ? (
                      <div className="h-24 bg-white border border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src={pod.signature_url} alt="Signature" className="max-h-full" />
                      </div>
                    ) : (
                      <div className="h-24 bg-white border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 italic text-xs">
                        No signature captured
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-left">
                    <SectionHeader icon={Camera} title="POD copy" />
                    {pod.file_url ? (
                      pod.file_url.toLowerCase().includes('.pdf') ? (
                        <a href={pod.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 underline">
                          Open PDF
                        </a>
                      ) : (
                        <a href={pod.file_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={pod.file_url} alt="POD" className="max-h-64 rounded-lg border border-gray-100" />
                        </a>
                      )
                    ) : (
                      <p className="text-xs text-gray-400 italic">No file</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                <div className="flex items-center gap-2 mb-2 text-amber-700">
                  <AlertCircle size={16} />
                  <span className="text-xs font-black uppercase tracking-wider">Exception Notes</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Damage Notes</p>
                    <p className="text-xs font-medium text-amber-800 italic">{pod.damage_notes || 'None reported'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Remarks</p>
                    <p className="text-xs font-medium text-amber-800 italic">{pod.remarks || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <SectionHeader icon={MapIcon} title="Geo-Verification" />
              <div className="aspect-video bg-gray-100 rounded-2xl relative overflow-hidden mb-4 group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <MapIcon size={32} className="text-gray-300" />
                </div>
                <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="px-4 py-2 bg-white/90 shadow-xl rounded-xl text-xs font-black text-blue-600 flex items-center gap-2">
                    <Maximize size={14} /> Open Maps
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Coordinates</span>
                  <span className="text-[11px] font-mono text-[#172B4D] font-bold tracking-tight">{pod.delivery_latitude || '0.0000'}, {pod.delivery_longitude || '0.0000'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Accuracy</span>
                  <span className="text-[11px] font-bold text-gray-600">{pod.location_accuracy_meters || '?'} meters</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {pod && (
        <EditDeliveryModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          delivery={pod}
        />
      )}
    </div>
  );
}
