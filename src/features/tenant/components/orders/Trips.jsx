import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download,
  MapPin, Truck, CheckCircle2,
  Clock, AlertTriangle, RefreshCcw, User, Hash, Eye, Edit2, XCircle
} from 'lucide-react';
import { useTrips } from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { EditTripModal } from './TripModals';
import LRTabStrip from './trip/LRTabStrip';

// --- Configuration & Status Badges ---
const TRIP_STATUS_CONFIG = {
  CREATED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <Clock size={14} /> },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Truck size={14} /> },
  DISPATCHED: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', icon: <Truck size={14} /> },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: <RefreshCcw size={14} /> },
  DELAYED: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: <AlertTriangle size={14} /> },
  ARRIVED: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', icon: <MapPin size={14} /> },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <XCircle size={14} /> },
  COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  STARTED: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
};

const STATUS_OPTIONS = [
  'All Status',
  'CREATED',
  'ASSIGNED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELAYED',
  'ARRIVED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];
const LR_COUNT_OPTIONS = ['All LR Counts', '1', '2-5', '6+'];

const FILTER_SELECT_CLASS =
  'h-9 px-3 rounded-xl border border-gray-200 bg-white text-[11px] font-semibold text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#B3D4FF]';

const StatusBadge = ({ status }) => {
  const config = TRIP_STATUS_CONFIG[status] || TRIP_STATUS_CONFIG.CREATED;
  return (
    <div className="flex justify-center">
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border shadow-sm ${config.color} ${config.bg} ${config.border}`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color.replace('text', 'bg')}`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.color.replace('text', 'bg')}`}
          />
        </span>
        {status}
      </span>
    </div>
  );
};

const routeLabel = (trip, kind) => {
  if (kind === 'origin') {
    return (
      trip.origin_address ||
      trip.origin_name ||
      trip.origin_city ||
      trip.origin ||
      'Not specified'
    );
  }
  return (
    trip.destination_address ||
    trip.destination_name ||
    trip.destination_city ||
    trip.destination ||
    'Not specified'
  );
};

// --- Main Body Component ---
export default function TripsMainBody() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [sortByCreated, setSortByCreated] = useState('newest');
  const [lrCountFilter, setLrCountFilter] = useState('All LR Counts');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const queryParams = { page, ordering: sortByCreated === 'newest' ? '-created_at' : 'created_at' };
  if (search) queryParams.search = search;
  if (filterStatus !== 'All Status') queryParams.status = filterStatus;

  const { data: tripsData, isLoading, refetch } = useTrips(queryParams);
  let trips = tripsData?.results || [];

  if (filterStatus !== 'All Status' && trips.length > 0) {
    trips = trips.filter((t) => t.status === filterStatus);
  }
  if (lrCountFilter !== 'All LR Counts') {
    trips = trips.filter((t) => {
      const count = (t.linked_orders?.length || (t.lr_number ? 1 : 0));
      if (lrCountFilter === '1') return count === 1;
      if (lrCountFilter === '2-5') return count >= 2 && count <= 5;
      if (lrCountFilter === '6+') return count >= 6;
      return true;
    });
  }
  const totalCount = tripsData?.count || 0;

  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || (Array.isArray(driversData) ? driversData : []);

  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || (Array.isArray(vehiclesData) ? vehiclesData : []);

  const activeCount = trips.filter(
    (t) => t.status !== 'DELIVERED' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  ).length;
  const inTransitCount = trips.filter((t) => t.status === 'IN_TRANSIT').length;
  const deliveredCount = trips.filter((t) => t.status === 'DELIVERED' || t.status === 'COMPLETED').length;

  const getDriverDisplay = (id, fallbackName) => {
    if (!id || id === 'null') return 'Unassigned';
    const d = drivers.find((dr) => dr.id === id);
    if (!d) return fallbackName || 'Unassigned';
    return `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim() || d.employee_id || 'Unassigned';
  };

  const getVehicleDisplay = (id, fallbackNumber) => {
    if (!id || id === 'null') return 'Unassigned';
    const v = vehicles.find((vh) => vh.id === id);
    if (!v) return fallbackNumber || 'Unassigned';
    return v.registration_number || v.registration || fallbackNumber || 'Unassigned';
  };

  const handleEditClick = (trip) => {
    setSelectedTrip(trip);
    setIsEditOpen(true);
  };

  const handleViewClick = (trip, lrId = null) => {
    const fallbackLrId = trip.linked_orders?.[0]?.order_id || null;
    const activeLrId = lrId || fallbackLrId;
    navigate(`/tenant/dashboard/orders/trips/${trip.id}${activeLrId ? `?lr=${activeLrId}` : ''}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
          <div className="flex items-center">
            <div className="w-1/4">
              <h1 className="text-2xl font-bold text-[#172B4D]">Trip Management</h1>
              <p className="text-gray-500 text-sm tracking-tight">
                Track vehicle journeys, driver assignments, and trip status.
              </p>
            </div>
            <div className="flex-1 max-w-2xl px-8">
              <form onSubmit={handleSearchSubmit} className="relative group/search">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by Trip ID, Route..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm hover:shadow-md hover:border-gray-300"
                />
              </form>
            </div>
            <div className="flex items-center justify-end gap-2 ml-auto">
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
              >
                <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
              >
                <Download size={14} /> Export
              </button>
              <button
                type="button"
                onClick={() => navigate('/tenant/dashboard/orders/trips/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] rounded-xl text-xs font-bold text-white hover:bg-[#0747A6] shadow-md shadow-blue-100 transition-all"
              >
                <Plus size={16} /> Plan New Trip
              </button>
            </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
          {/* Stats Row */}
          <div className="flex items-center gap-8 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              {isLoading ? (
                <div className="flex gap-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-28" />
                  <div className="h-5 bg-gray-200 rounded w-28" />
                  <div className="h-5 bg-gray-200 rounded w-28" />
                  <div className="h-5 bg-gray-200 rounded w-28" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total:</span>
                    <span className="text-[18px] font-black text-blue-600">{totalCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Active:</span>
                    <span className="text-[18px] font-black text-amber-600">{activeCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">In Transit:</span>
                    <span className="text-[18px] font-black text-indigo-600">{inTransitCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Delivered:</span>
                    <span className="text-[18px] font-black text-green-600">{deliveredCount}</span>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-b border-gray-50 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/30">
              <div className="w-full lg:w-auto flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  className={`${FILTER_SELECT_CLASS} min-w-[170px]`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={lrCountFilter}
                  onChange={(e) => {
                    setLrCountFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`${FILTER_SELECT_CLASS} min-w-[140px]`}
                >
                  {LR_COUNT_OPTIONS.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <select
                  value={sortByCreated}
                  onChange={(e) => {
                    setSortByCreated(e.target.value);
                    setPage(1);
                  }}
                  className={`${FILTER_SELECT_CLASS} min-w-[180px]`}
                >
                  <option value="newest">Created: Newest First</option>
                  <option value="oldest">Created: Oldest First</option>
                </select>
              </div>
            </div>

            {/* Scrollable Table Area */}
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      Trip
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      LRs
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      Type
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      Route (Origin → Destination)
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      Fleet Info
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={7} className="px-6 py-5 h-20 bg-gray-50/10" />
                        </tr>
                      ))
                  ) : trips.length > 0 ? (
                    trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#172B4D] flex items-center gap-2 group-hover:text-[#0052CC] transition-colors">
                              <Hash size={14} className="text-[#0052CC]" />{' '}
                              {trip.trip_number || `TRIP-${trip.id.slice(-6)}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <LRTabStrip
                              linkedOrders={trip.linked_orders?.length ? trip.linked_orders : [{ order_id: trip.order_id, lr_number: trip.lr_number }]}
                              activeOrderId={null}
                              onChange={(orderId) => handleViewClick(trip, orderId)}
                              size="sm"
                            />
                            <p className="text-[10px] font-bold text-gray-400">
                              {trip.linked_orders?.length || (trip.lr_number ? 1 : 0)} LR(s)
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 w-fit inline-block">
                            {trip.trip_type || 'FTL'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col text-[10px] font-bold text-gray-700">
                              <span className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-blue-500 shrink-0" />{' '}
                                <span className="line-clamp-2">{routeLabel(trip, 'origin')}</span>
                              </span>
                              <div className="h-4 border-l-2 border-dashed border-gray-200 ml-[5px] my-1" />
                              <span className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-red-500 shrink-0" />{' '}
                                <span className="line-clamp-2">{routeLabel(trip, 'destination')}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div
                              className="flex items-center gap-2 text-[12px] font-bold text-gray-600"
                              title={trip.vehicle_id || trip.primary_vehicle_id}
                            >
                              <Truck size={14} className="text-gray-400 shrink-0" />{' '}
                              {getVehicleDisplay(trip.vehicle_id || trip.primary_vehicle_id, trip.vehicle_number)}
                            </div>
                            <div
                              className="flex items-center gap-2 text-[12px] font-bold text-gray-600"
                              title={trip.driver_id || trip.primary_driver_id}
                            >
                              <User size={14} className="text-gray-400 shrink-0" />{' '}
                              {getDriverDisplay(trip.driver_id || trip.primary_driver_id, trip.primary_driver_name)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={trip.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewClick(trip)}
                              title="View Details"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#EBF3FF] text-[#0052CC] hover:bg-[#0052CC] hover:text-white border border-transparent transition-all"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewClick(trip, trip.linked_orders?.[0]?.order_id)}
                              title="Open LR View"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-[#0052CC] hover:bg-blue-50 border border-blue-100 transition-all"
                            >
                              Open LR View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClick(trip)}
                              title="Edit Trip"
                              className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-white rounded-lg border border-transparent hover:border-blue-100 shadow-sm transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20">
                          <Truck size={48} className="mb-4" />
                          <p className="text-sm font-black uppercase tracking-[0.2em]">No trips found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20 shrink-0">
              <p className="text-xs font-semibold text-gray-500">
                Showing <span className="text-[#172B4D]">{trips.length}</span> of{' '}
                <span className="text-[#172B4D]">{totalCount}</span> trips
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
                >
                  PREV
                </button>
                <span className="px-3 py-1 bg-[#0052CC] text-white rounded-lg text-xs font-black font-mono">
                  {page}
                </span>
                <button
                  type="button"
                  disabled={!tripsData?.next || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        </div>
      {/* </div> */}

      {selectedTrip && (
        <EditTripModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} trip={selectedTrip} />
      )}
    </div>
  );
}
