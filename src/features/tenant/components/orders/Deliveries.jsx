import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle,
  Search, Plus, MapPin, User, FileCheck, Image as ImageIcon,
  Edit2, Eye, Calendar, Hash, RefreshCcw
} from 'lucide-react';
import { useDeliveries, useDeleteDelivery } from '../../queries/orders/ordersQuery';
import { formatDate } from '@/utils/dateFormat';
import {
  CreatePODModal,
  EditDeliveryModal
} from './DeliveryModals';

// --- Configuration & Status Badges ---
const POD_STATUS_CONFIG = {
  DELIVERED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  PARTIAL: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
  DAMAGED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertCircle size={14} /> },
  REFUSED: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: <AlertCircle size={14} /> },
  RETURNED: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: <FileCheck size={14} /> },
};


const StatusBadge = ({ status }) => {
  const config = POD_STATUS_CONFIG[status] || POD_STATUS_CONFIG.DELIVERED;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// --- Modal Component moved to DeliveryModals.jsx ---

// --- Main Body Component ---
export default function DeliveryMainBody() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);
  const deleteDeliveryMutation = useDeleteDelivery();
  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.delivery_status = filterStatus;

  const { data: deliveriesData, isLoading, refetch } = useDeliveries(queryParams);
  const deliveries = deliveriesData?.results || [];
  const totalCount = deliveriesData?.count || 0;

  // Global counts for stats 
  const stats = {
    total: totalCount,
    verified: deliveries.filter(d => d.delivery_status === 'DELIVERED').length,
    pending: deliveries.filter(d => d.delivery_status === 'PARTIAL').length,
    rejected: deliveries.filter(d => d.delivery_status === 'DAMAGED').length,
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Deliveries & POD</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Verify Proof of Delivery (POD), track recipient signatures, and delivery timing.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] text-white rounded-lg text-sm font-bold hover:bg-[#0747A6] shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} /> New POD Record
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Compact Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            {isLoading ? (
              <div className="flex gap-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Deliveries:</span>
                  <span className="text-[18px] font-black text-blue-600">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Verified PODs:</span>
                  <span className="text-[18px] font-black text-green-600">{stats.verified}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Pending Approval:</span>
                  <span className="text-[18px] font-black text-amber-600">{stats.pending}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Rejected:</span>
                  <span className="text-[18px] font-black text-red-600">{stats.rejected}</span>
                </div>
              </>
            )}
          </div>
          {/* Filters */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white items-center flex-wrap">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search POD, recipient, trip, stop location..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#0052CC] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                className="flex-1 md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#0052CC]"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option>All Status</option>
                <option>DELIVERED</option>
                <option>PARTIAL</option>
                <option>DAMAGED</option>
                <option>REFUSED</option>
                <option>RETURNED</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Previous
              </button>
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#0052CC] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {page}
              </div>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!deliveriesData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                <FileCheck size={48} className="mb-4 opacity-20" />
                <p>No delivery records found matching criteria</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px] relative">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">POD / Record</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Recipient & Location</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Delivery Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deliveries.map((pod) => (
                    <tr key={pod.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#172B4D] flex items-center gap-2">
                            <Hash size={14} className="text-gray-400" /> {pod.document_name || pod.document_number || pod.id?.slice(-8)}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                            Trip: {pod.trip_number || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700">
                            <User size={14} className="text-[#0052CC]" /> {pod.received_by_name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                            <MapPin size={12} /> LR: {pod.order_id ? String(pod.order_id).slice(0, 8) + '…' : 'Trip-level'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                          <Calendar size={14} className="text-gray-400" /> {formatDate(pod.created_at || pod.issue_date)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 items-start">
                          <StatusBadge status={pod.delivery_status} />
                          {pod.file_url && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase">
                              <ImageIcon size={12} /> File Attached
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedPod(pod);
                              setIsEditOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Record"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {

                              if (window.confirm('Delete this POD record?')) {
                                deleteDeliveryMutation.mutate({ id: pod.id, tripId: pod.trip });
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => {

                              navigate(`/tenant/dashboard/orders/deliveries/${pod.id}`);
                            }}
                            className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Showing {deliveries.length} of {totalCount} POD Records</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 font-bold"
              >
                Prev
              </button>
              <div className="px-3 py-1 border border-gray-200 rounded bg-[#0052CC] text-white font-bold">
                {page}
              </div>
              <button
                disabled={!deliveriesData?.next}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreatePODModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {selectedPod && (
        <EditDeliveryModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          delivery={selectedPod}
        />
      )}
    </div>
  );
}


// -----------------------------------------------------------------------------

