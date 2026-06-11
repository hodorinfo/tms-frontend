import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download, XCircle, Truck,
  Package, CheckCircle2, Clock, RefreshCcw, Eye
} from 'lucide-react';
import {
  useOrders,
  useTrips,
} from '../../queries/orders/ordersQuery';
import { useCustomers } from '../../queries/customers/customersQuery';
import {
  CreateOrderModal
} from './OrderModals';
import { formatDate } from '@/utils/dateFormat';

// --- Configuration & Helpers ---
const STATUS_CONFIG = {
  DRAFT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  CONFIRMED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Truck size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <RefreshCcw size={14} /> },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <XCircle size={14} /> },
};

const STATUS_OPTIONS = [
  'All Status',
  'DRAFT',
  'CONFIRMED',
  'ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
];

const ORDER_TYPE_OPTIONS = ['All Types', 'FTL', 'LTL', 'CONTAINER', 'COURIER', 'MULTI_DROP'];

const ORDERING_OPTIONS = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Pickup (Soonest)', value: 'pickup_date' },
  { label: 'Pickup (Latest)', value: '-pickup_date' },
];

const FILTER_SELECT_CLASS =
  'h-9 px-3 rounded-xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#B3D4FF]';

export default function Orders() {
  const navigate = useNavigate();

  // -- State --
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterOrderType, setFilterOrderType] = useState('All Types');
  const [filterPickupDate, setFilterPickupDate] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Data for dropdowns
  const { data: customersData } = useCustomers({ page_size: 100 });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);

  const getCustomerName = (id) => {
    if (!id) return '-';
    const c = customers.find(cust => cust.id === id);
    if (!c) return 'Unknown';
    return c.legal_name || c.trading_name || c.customer_code || id.slice(-6);
  };

  // Queries
  const queryParams = { page, ordering };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.status = filterStatus;
  if (filterCustomer) queryParams.billing_customer_id = filterCustomer;
  if (filterOrderType !== 'All Types') queryParams.order_type = filterOrderType;
  if (filterPickupDate) queryParams.pickup_date = filterPickupDate;

  const { data: ordersData, isLoading, refetch } = useOrders(queryParams);
  const orders = ordersData?.results || [];
  const totalCount = ordersData?.count || 0;
  const { data: tripsData } = useTrips({ page_size: 1000, ordering: '-created_at' });
  const trips = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);

  const tripMetaByOrderId = useMemo(() => {
    const map = {};
    trips.forEach((trip) => {
      const linked = Array.isArray(trip.linked_orders) && trip.linked_orders.length
        ? trip.linked_orders.map((o) => ({ order_id: String(o.order_id || o.id), lr_number: o.lr_number || 'LR' }))
        : (trip.order_id ? [{ order_id: String(trip.order_id), lr_number: trip.lr_number || 'LR' }] : []);
      if (!linked.length) return;
      linked.forEach((item) => {
        map[item.order_id] = {
          tripId: trip.id,
          tripNumber: trip.trip_number || 'Trip',
          linkedLrs: linked,
        };
      });
    });
    return map;
  }, [trips]);

  // Global counts for stats (using the API count for total, mocked stats for the rest due to no aggregate API)
  const stats = {
    total: totalCount,
    draft: orders.filter(o => o.status === 'DRAFT').length,
    in_transit: orders.filter(o => o.status === 'IN_TRANSIT').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  const handleView = (orderId) => {
    navigate(`/tenant/dashboard/orders/${orderId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
  <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col  relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
        {/* Header section with high-density stats */}

        <div className="flex items-center">
          <div className="w-1/4">
            <h1 className="text-2xl font-bold text-[#172B4D]">LR Booking Management</h1>
            <p className="text-gray-500 text-sm tracking-tight">Create and manage LR bookings used for trip planning</p>
          </div>
          <div className="flex-1 max-w-2xl px-8">
            <form onSubmit={handleSearchSubmit} className="relative group/search">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search LR #, Reference Number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
              />
            </form>
          </div>
          <div className="flex items-center justify-end gap-2 ml-auto">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
            >
              <RefreshCcw size={14} /> Refresh
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm">
              <Download size={14} /> Export
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all"
            >
              <Plus size={16} /> New LR
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
            <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                <span className="text-[18px] font-black text-blue-600">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Draft:</span>
                <span className="text-[18px] font-black text-amber-600">{stats.draft}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">In Transit:</span>
                <span className="text-[18px] font-black text-indigo-600">{stats.in_transit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Delivered:</span>
                <span className="text-[18px] font-black text-green-600">{stats.delivered}</span>
              </div>
            </div>

            <div className="p-4 border-b border-gray-50 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/20">
              <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setPage(1)
                  }}
                  className={`${FILTER_SELECT_CLASS} min-w-[140px]`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                {/* Billing Customer Filter */}
                <select
                  value={filterCustomer}
                  onChange={(e) => {
                    setFilterCustomer(e.target.value)
                    setPage(1)
                  }}
                  className={`${FILTER_SELECT_CLASS} min-w-[220px] max-w-[300px]`}
                >
                  <option value="">All Billing Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legal_name || c.trading_name} {c.customer_code ? `(${c.customer_code})` : ''} - {c.customer_type || 'N/A'}
                    </option>
                  ))}
                </select>

                {/* Order Type Filter */}
                <select
                  value={filterOrderType}
                  onChange={(e) => {
                    setFilterOrderType(e.target.value)
                    setPage(1)
                  }}
                  className={`${FILTER_SELECT_CLASS} min-w-[130px]`}
                >
                  {ORDER_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                {/* Pickup Date Filter */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Pickup Date:</span>
                  <input
                    type="date"
                    value={filterPickupDate}
                    onChange={(e) => {
                      setFilterPickupDate(e.target.value)
                      setPage(1)
                    }}
                    className="bg-transparent border-none outline-none text-[11px] font-semibold text-gray-600 focus:ring-0 p-0 h-auto"
                    title="Filter by Pickup Date"
                  />
                </div>
              </div>

              <div className="hidden lg:block">
                <button
                  onClick={() => {
                    setFilterStatus('All Status');
                    setFilterCustomer('');
                    setFilterOrderType('All Types');
                    setFilterPickupDate('');
                    setOrdering('-created_at');
                    setSearch('');
                    setSearchInput('');
                    setPage(1);
                  }}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest px-3 py-1 hover:bg-blue-50 rounded-lg transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">LR Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Entities (F/T)</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Billing Customer</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Schedule</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="7" className="px-6 py-5 underline-offset-1 h-20 bg-gray-50/10"></td>
                      </tr>
                    ))
                  ) : orders.length > 0 ? (
                    orders.map((order, index) => {
                      const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
                      const tripMeta = tripMetaByOrderId[String(order.id)];
                      const linkedLrs = tripMeta?.linkedLrs || [];
                      const isMultiLrTrip = linkedLrs.length > 1;
                      const currentTripId = tripMeta?.tripId ? String(tripMeta.tripId) : null;
                      const prevTripId = (() => {
                        const prevOrder = index > 0 ? orders[index - 1] : null;
                        const prevMeta = prevOrder ? tripMetaByOrderId[String(prevOrder.id)] : null;
                        return prevMeta?.tripId ? String(prevMeta.tripId) : null;
                      })();
                      const nextTripId = (() => {
                        const nextOrder = index < orders.length - 1 ? orders[index + 1] : null;
                        const nextMeta = nextOrder ? tripMetaByOrderId[String(nextOrder.id)] : null;
                        return nextMeta?.tripId ? String(nextMeta.tripId) : null;
                      })();
                      const connectTop = isMultiLrTrip && prevTripId === currentTripId;
                      const connectBottom = isMultiLrTrip && nextTripId === currentTripId;
                      return (
                        <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              {isMultiLrTrip && (
                                <div className="relative w-4 flex justify-center shrink-0 self-stretch">
                                  {connectTop && <span className="absolute top-0 h-1/2 w-[2px] bg-blue-200" />}
                                  {connectBottom && <span className="absolute bottom-0 h-1/2 w-[2px] bg-blue-200" />}
                                  <span className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                                </div>
                              )}
                              <div className={`w-8 h-8 mt-0.5 rounded-lg flex items-center justify-center ${st.bg} ${st.color} border ${st.border}`}>
                                <Package size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-bold text-[#172B4D] leading-none mb-1 group-hover:text-[#0052CC] transition-colors">{order.lr_number}</p>
                                <p className={`${order.status === 'CANCELLED' ? 'text-red-400' : 'text-gray-400'} text-[9px] font-mono mt-0.5 whitespace-nowrap`}>
                                  Ref Number: {order.reference_number || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[13px] font-bold text-gray-700 truncate w-32" title={`From: ${getCustomerName(order.consignor_id)}`}>
                              <span className="text-[10px] text-gray-400 mr-1">F:</span>{getCustomerName(order.consignor_id)}
                            </p>
                            <p className="text-[13px] font-bold text-gray-700 truncate w-32 mt-0.5" title={`To: ${getCustomerName(order.consignee_id)}`}>
                              <span className="text-[10px] text-gray-400 mr-1">T:</span>{getCustomerName(order.consignee_id)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[13px] font-bold text-[#172B4D] leading-none">{getCustomerName(order.billing_customer_id)}</p>
                            <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase">{order.order_type}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 grayscale opacity-60">
                                <Clock size={12} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-gray-500">{order.pickup_date ? formatDate(order.pickup_date) : 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-green-500" />
                                <span className="text-[10px] font-bold text-gray-500">{order.delivery_date || 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500">{order.lr_receiving_date ? formatDate(order.lr_receiving_date) : 'LR TBD'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <div className="text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border shadow-sm ${st.color} ${st.bg} ${st.border}`}>
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${st.color.replace('text', 'bg')}`}></span>
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${st.color.replace('text', 'bg')}`}></span>
                                  </span>
                                  {order.status}
                                </span>
                                <p className="mt-1 text-[9px] font-semibold text-gray-400">Derived from trips</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleView(order.id)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm transition-all"
                                title="Quick View Record"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20">
                          <Package size={48} className="mb-4" />
                          <p className="text-sm font-black uppercase tracking-[0.2em]">No Shipment Records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
              <p className="text-xs font-semibold text-gray-500">
                Showing <span className="text-[#172B4D]">{orders.length}</span> of <span className="text-[#172B4D]">{totalCount}</span> active shipments
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
                >
                  PREV
                </button>
                <span className="px-3 py-1 bg-[#0052CC] text-white rounded-lg text-xs font-black font-mono">{page}</span>
                <button
                  disabled={!ordersData?.next}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
                >
                  NEXT
                </button>
              </div>
            </div>
      </div>
    </div>

    {/* Modals */}
    <CreateOrderModal 
      isOpen={isCreateOpen} 
      onClose={() => setIsCreateOpen(false)} 
    />
  </div>
  );
}
