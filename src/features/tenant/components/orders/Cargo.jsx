import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Plus, Search, Eye, Edit2,
  Scale, Maximize, Move, Hash, RefreshCcw
} from 'lucide-react';
import { 
  useCargoItems
} from '../../queries/orders/ordersQuery';
import { 
  CreateCargoModal, 
  EditCargoModal
} from './CargoModals';


// --- Configuration & Helpers ---
const CARGO_TYPE_COLORS = {
  HAZARDOUS: 'bg-red-100 text-red-700 border-red-200',
  PERISHABLE: 'bg-teal-100 text-teal-700 border-teal-200',
  FRAGILE: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH_VALUE: 'bg-purple-100 text-purple-700 border-purple-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
  GENERAL: 'bg-blue-100 text-blue-700 border-blue-200',
};

// --- Modal Component moved to CargoModals.jsx ---

export default function CargoMainBody() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);

  // Queries
  const queryParams = { page, ordering: '-created_at' };
  if (search) queryParams.search = search;
  if (filterType !== 'All Types') queryParams.commodity_type = filterType;

  const { data: cargoData, isLoading, refetch } = useCargoItems(queryParams);
  const cargoItems = cargoData?.results || [];
  const totalCount = cargoData?.count || 0;

  // Global counts for stats (using API length for demo, until backend supports aggregation)
  const stats = {
    total: totalCount,
    hazardous: cargoItems.filter(c => c.commodity_type === 'HAZARDOUS').length,
    fragile: cargoItems.filter(c => c.commodity_type === 'FRAGILE').length,
    linkedTrips: cargoItems.filter(c => !!c.trip).length,
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] flex flex-col relative">
      <div className="p-8 flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Cargo Inventory</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Manage individual cargo items, dimensions, and loading details.</p>
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
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4a6cf7] text-white rounded-lg text-sm font-bold hover:bg-[#3b59d9] shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} /> Add Cargo Item
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
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
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Total Items:</span>
                  <span className="text-[18px] font-black text-blue-600">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Hazmat Alerts:</span>
                  <span className="text-[18px] font-black text-red-600">{stats.hazardous}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Fragile Goods:</span>
                  <span className="text-[18px] font-black text-amber-600">{stats.fragile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Linked Trips:</span>
                  <span className="text-[18px] font-black text-green-600">{stats.linkedTrips}</span>
                </div>
              </>
            )}
          </div>
          {/* Filters Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-white items-center flex-wrap">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search Item Code or Description..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#4a6cf7] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <select 
                 className="flex-1 md:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:border-[#4a6cf7]"
                 value={filterType}
                 onChange={(e) => {
                   setFilterType(e.target.value);
                   setPage(1);
                 }}
               >
                 <option>All Types</option>
                 <option>GENERAL</option>
                 <option>HAZARDOUS</option>
                 <option>FRAGILE</option>
                 <option>PERISHABLE</option>
                 <option>HIGH_VALUE</option>
                 <option>OTHER</option>
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
              <div className="flex items-center justify-center min-w-8 h-8 bg-[#4a6cf7] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100">
                {page}
              </div>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!cargoData?.next || isLoading}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg text-[#172B4D] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                Next
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-auto min-h-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a6cf7]"></div>
              </div>
            ) : cargoItems.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p>No cargo items found matching criteria</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#F8FAFC] border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Item / Code</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Specifications</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trip / LR Link</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Allocated Stops</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cargoItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-blue-100 hover:text-[#4a6cf7] transition-colors">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#172B4D]">{item.item_name || item.description || 'N/A'}</p>
                            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5 uppercase">
                              <Hash size={10} /> {item.item_code || item.id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                            <Scale size={14} className="text-gray-400" /> {item.weight_kg || 'N/A'} kg
                          </div>
                          <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600">
                            <Maximize size={14} className="text-gray-400" /> {item.length_cm ? `${item.length_cm}x${item.width_cm || 0}x${item.height_cm || 0} cm` : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {item.trip ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/tenant/dashboard/orders/trips/${item.trip}`)}
                              className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-bold text-gray-600 uppercase tracking-tight hover:bg-blue-50 hover:text-blue-700"
                              title={item.trip}
                            >
                              <Move size={12} /> {item.trip_number || String(item.trip).slice(-8)}
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-bold text-gray-600 uppercase tracking-tight">
                              <Move size={12} /> Trip Unlinked
                            </div>
                          )}
                          {item.order && (
                            <button
                              type="button"
                              onClick={() => navigate(`/tenant/dashboard/orders/${item.order}`)}
                              className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 rounded-md text-[11px] font-bold text-blue-700 uppercase tracking-tight hover:bg-blue-100"
                              title={item.order}
                            >
                              LR {item.order_lr_number || String(item.order).slice(-8)}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {Array.isArray(item.stop_quantities) && item.stop_quantities.length > 0 ? (
                          <div className="text-[11px] font-semibold text-gray-700">
                            <div>{item.stop_quantities.length} stops</div>
                            <div className="text-gray-500">
                              L {item.stop_quantities.reduce((sum, row) => sum + (Number(row.load_quantity ?? row.quantity) || 0), 0)}
                              {" / "}
                              U {item.stop_quantities.reduce((sum, row) => sum + (Number(row.unload_quantity) || 0), 0)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">Not allocated</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${CARGO_TYPE_COLORS[item.commodity_type] || CARGO_TYPE_COLORS['GENERAL']}`}>
                          {item.commodity_type || 'GENERAL'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                            <button 
                              onClick={() => {
                                setSelectedCargo(item);
                                setIsEditOpen(true);
                              }}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg bg-gray-50 border border-gray-100"
                              title="Edit Cargo"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                navigate(`/tenant/dashboard/orders/cargo/${item.id}`);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg bg-gray-50 border border-gray-100"
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

        </div>
      </div>

      <CreateCargoModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditCargoModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} item={selectedCargo} />
    </div>
  );
}

// Modals are now imported from CargoModals.jsx