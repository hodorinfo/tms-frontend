import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, MapPin, FilePlus, Receipt, CreditCard, 
  History, Plus, Upload, Trash2, Calendar,
  DollarSign, Hash, CheckCircle2, Clock, 
  AlertCircle, ArrowLeft, Search, Loader2,
  ChevronRight, Map as MapIcon, Globe, FileText,
  RotateCcw, SlidersHorizontal, User, Edit3,
  ChevronLeft, Save, Gauge, Truck
} from 'lucide-react';
import {
  useCreateTripStop,
  useUpdateTripStop,
  useDeleteTripStop,
  useCreateTripDocument,
  useCreateTripExpense,
  useCreateTripCharge,
  useUpdateTripExpense,
  useDeleteTripExpense,
  useUpdateTripCharge,
  useDeleteTripCharge,
  useTripStatusHistory,
  useTripDetail, 
  useTripStops, 
  useTripDocuments, 
  useTripExpenses, 
  useTripCharges,
  useUpdateTrip,
  useOrders,
  useTrips
} from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';
import { EditTripModal as SharedEditTripModal } from './TripModals';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

// --- Dashboard Component ---

export default function TripNestedSubResource() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  
  // State for management
  const [tripId, setTripId] = useState(urlId || '');
  const [searchInput, setSearchInput] = useState(urlId || '');
  const [activeTab, setActiveTab] = useState('stops');
  const [activeModal, setActiveModal] = useState(null);
  const [editFinanceItem, setEditFinanceItem] = useState(null);
  const [editFinanceForm, setEditFinanceForm] = useState({ amount: '', description: '' });
  const [searchError, setSearchError] = useState('');

  // API Hooks
  // API Hooks
  const { data: tripData, isLoading: loadingTrip, refetch: refetchTrip } = useTripDetail(tripId);
  const { data: tripsData } = useTrips({ page_size: 50, ordering: '-created_at' });
  const { data: stopsData, isLoading: loadingStops, refetch: refetchStops } = useTripStops(tripId);
  const { data: historyData, refetch: refetchHistory } = useTripStatusHistory(tripId);
  const { data: documentsData, refetch: refetchDocs } = useTripDocuments(tripId);
  const { data: expensesData, refetch: refetchExpenses } = useTripExpenses(tripId);
  const { data: chargesData, refetch: refetchCharges } = useTripCharges(tripId);
  const updateStopMutation = useUpdateTripStop(tripId);
  const deleteStopMutation = useDeleteTripStop(tripId);
  const updateExpenseMutation = useUpdateTripExpense(tripId);
  const deleteExpenseMutation = useDeleteTripExpense(tripId);
  const updateChargeMutation = useUpdateTripCharge(tripId);
  const deleteChargeMutation = useDeleteTripCharge(tripId);

  // Safe data extraction
  const trip = tripData;
  const stops = stopsData?.results || (Array.isArray(stopsData) ? stopsData : []);
  const history = historyData?.results || (Array.isArray(historyData) ? historyData : []);
  const documents = documentsData?.results || (Array.isArray(documentsData) ? documentsData : []);
  const expenses = expensesData?.results || (Array.isArray(expensesData) ? expensesData : []);
  const charges = chargesData?.results || (Array.isArray(chargesData) ? chargesData : []);
  const availableTrips = tripsData?.results || (Array.isArray(tripsData) ? tripsData : []);

  const handleRefresh = () => {
    if (!tripId) return;
    refetchTrip();
    refetchStops();
    refetchHistory();
    refetchDocs();
    refetchExpenses();
    refetchCharges();
  };

  const handleSearchTrip = (e) => {
    e.preventDefault();
    const raw = (searchInput || '').trim();
    if (!raw) return;

    const match = availableTrips.find((t) => {
      const idMatch = String(t.id || '').toLowerCase() === raw.toLowerCase();
      const tripNumberMatch = String(t.trip_number || '').toLowerCase() === raw.toLowerCase();
      return idMatch || tripNumberMatch;
    });

    if (match?.id) {
      setTripId(match.id);
      setSearchError('');
      return;
    }

    // Fallback: allow direct UUID even if it is not in current page cache.
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
      setTripId(raw);
      setSearchError('');
      return;
    }

    setSearchError('Trip not found. Search by valid Trip ID or exact Trip Number.');
  };

  const handleStopStatusChange = (stopId, stopStatus) => {
    updateStopMutation.mutate({ stopId, data: { stop_status: stopStatus } });
  };

  const handleDeleteStop = (stopId) => {
    if (!window.confirm('Delete this stop?')) return;
    deleteStopMutation.mutate(stopId);
  };

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
    const payload = { amount: editFinanceForm.amount, description: editFinanceForm.description };
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

  useEffect(() => {
    if (urlId) {
      setTripId(urlId);
      setSearchInput(urlId);
    }
  }, [urlId]);

  useEffect(() => {
    // On initial Trip Manager load without URL trip id, auto-select latest trip.
    if (!urlId && !tripId && availableTrips.length > 0) {
      const latestTripId = availableTrips[0]?.id;
      if (latestTripId) {
        setTripId(latestTripId);
        setSearchInput(latestTripId);
      }
    }
  }, [urlId, tripId, availableTrips]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans text-[#1e293b]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* red-style dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#64748b] uppercase tracking-wider">
               {/* Platform <ChevronRight size={12} /> Dashboard <ChevronRight size={12} /> <span className="text-[#3b82f6]">Orders</span> */}
            </div>
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight flex items-center gap-4">
              Trip Management Console
              {trip && (
                <button 
                  onClick={() => setActiveModal('editTrip')}
                  className="p-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:text-[#3b82f6] hover:border-[#3b82f6]/30 shadow-sm transition-all"
                  title="Edit Core Trip Details"
                >
                  <Edit3 size={18} />
                </button>
              )}
            </h1>
            <p className="text-[#64748b] text-[15px]">Manage logistical stops, track status history, and verify compliance documents for trip: <span className="text-[#0f172a] font-bold">#{trip?.trip_number || tripId || 'None'}</span></p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleRefresh} className="px-5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#64748b] hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
                <RotateCcw size={16} /> Refresh Hub
             </button>
             <button 
               onClick={() => setActiveModal(activeTab.replace(/s$/, ''))}
               className="px-6 py-2.5 bg-[#3b82f6] text-white rounded-xl text-[13px] font-bold hover:bg-blue-600 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
             >
               <Plus size={18} /> Add {activeTab.replace(/s$/, '')}
             </button>
          </div>
        </div>

        {/* Stats Summary Bar (Matches Screenshot Style) */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-8">
           <StatItem label="TOTAL STOPS" value={stops.length} color="text-[#3b82f6]" />
           <StatItem label="DOCUMENTS" value={documents.length} color="text-emerald-500" />
           <StatItem label="PENDING EXPENSES" value={expenses.filter(e => e.status !== 'APPROVED').length} color="text-amber-500" />
           <StatItem label="TOTAL CHARGES" value={charges.length} color="text-rose-500" />
        </div>

        {/* Search & Filter Workbench */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-6">
           <div className="flex flex-col md:flex-row items-center gap-4">
              <form onSubmit={handleSearchTrip} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input 
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by Trip ID or Trip Number..." 
                  className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] transition-all"
                />
              </form>
              <div className="flex items-center gap-2 bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0]">
                 <TabButton active={activeTab === 'stops'} onClick={() => setActiveTab('stops')} label="Stops" />
                 <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
                 <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} label="Documents" />
                 <TabButton active={activeTab === 'finances'} onClick={() => setActiveTab('finances')} label="Finances" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                 <button className="p-3 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b] hover:bg-gray-50 shadow-sm"><SlidersHorizontal size={18} /></button>
                 <select className="px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-[14px] font-medium text-[#64748b] outline-none focus:border-[#3b82f6] min-w-[140px]">
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Verified</option>
                 </select>
              </div>
           </div>
           {searchError && (
             <div className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold animate-in fade-in duration-200">
               {searchError}
             </div>
           )}

           {/* Results Table/List (Clean Dashboard Style) */}
           <div className="border border-[#e2e8f0] rounded-xl overflow-hidden min-h-[400px]">
              <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 grid grid-cols-12 gap-4 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                 <div className="col-span-4">Resource / Identity</div>
                 <div className="col-span-3">Linked Entity</div>
                 <div className="col-span-3">Timeline Events</div>
                 <div className="col-span-1 text-center">Status</div>
                 <div className="col-span-1 text-center">Actions</div>
              </div>

              <div className="divide-y divide-[#e2e8f0] bg-white">
                 {loadingStops || loadingTrip ? (
                   <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#3b82f6]" size={32} /></div>
                 ) : tripId && !trip ? (
                   <div className="p-24 text-center space-y-4">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-lg font-black text-[#0f172a]">Trip Not Found</h3>
                      <p className="text-sm text-[#64748b] max-w-sm mx-auto">
                        No trip record matches this ID. Please search for a valid Trip ID.
                      </p>
                   </div>
                 ) : !tripId ? (
                   <div className="p-16 text-center space-y-5">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <Search size={28} />
                      </div>
                      <h3 className="text-lg font-black text-[#0f172a]">Select a Trip to Start</h3>
                      <p className="text-sm text-[#64748b] max-w-lg mx-auto">
                        Search by Trip ID above, or choose one from recent trips.
                      </p>
                      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {availableTrips.slice(0, 6).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTripId(t.id);
                              setSearchInput(t.id);
                            }}
                            className="text-left px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl hover:border-blue-300 hover:bg-blue-50/40 transition-all"
                          >
                            <p className="text-xs font-black text-[#172B4D]">{t.trip_number || t.id?.slice(0, 8)}</p>
                            <p className="text-[11px] text-[#64748b] mt-0.5">{t.origin_address || '-'} → {t.destination_address || '-'}</p>
                          </button>
                        ))}
                      </div>
                   </div>
                 ) : (
                   <div className="animate-in fade-in duration-500">
                      {activeTab === 'stops' && <StopsList stops={stops} onUpdateStopStatus={handleStopStatusChange} onDeleteStop={handleDeleteStop} />}
                      {activeTab === 'history' && <HistoryList history={history} />}
                      {activeTab === 'documents' && <DocsList documents={documents} />}
                      {activeTab === 'finances' && <FinanceList expenses={expenses} charges={charges} onEdit={handleEditFinance} onDelete={handleDeleteFinance} />}
                   </div>
                 )}
              </div>
           </div>

           {/* Pagination Mock (Matches Screenshot) */}
           <div className="flex items-center justify-between pt-4 px-2">
              <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.15em]"></div>
              <div className="flex items-center gap-2">
                 <button className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#cbd5e1] cursor-not-allowed">Previous Page</button>
                 <button className="w-9 h-9 bg-[#3b82f6] text-white rounded-lg flex items-center justify-center font-bold text-[13px] shadow-md shadow-blue-500/20">1</button>
                 <button className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#64748b] hover:bg-gray-50 hover:text-blue-500 transition-all">Next Page</button>
              </div>
           </div>

        </div>
      </div>

      {/* Operation Modals */}
      <AddStopModal isOpen={activeModal === 'stop'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <AddDocumentModal isOpen={activeModal === 'document'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <AddExpenseModal isOpen={activeModal === 'expense'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <AddChargeModal isOpen={activeModal === 'charge'} onClose={() => setActiveModal(null)} tripId={tripId} />
      <Modal isOpen={!!editFinanceItem} onClose={closeEditFinanceModal} title={editFinanceItem?.res_type === 'EXPENSE' ? 'Edit Expense' : 'Edit Charge'}>
        <form onSubmit={handleSaveFinance} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              className={inputClass}
              value={editFinanceForm.amount}
              onChange={(e) => setEditFinanceForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Description</label>
            <textarea
              rows="3"
              className={inputClass}
              value={editFinanceForm.description}
              onChange={(e) => setEditFinanceForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={updateExpenseMutation.isPending || updateChargeMutation.isPending} className="w-full py-3 bg-[#3b82f6] text-white rounded-2xl font-bold uppercase tracking-wider hover:bg-blue-600 transition-all disabled:opacity-50">
            {updateExpenseMutation.isPending || updateChargeMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>
      <SharedEditTripModal 
        isOpen={activeModal === 'editTrip'} 
        onClose={() => setActiveModal(null)} 
        trip={trip} 
      />
    </div>
  );
}

// --- Data Row Components ---

const StopsList = ({ stops, onUpdateStopStatus, onDeleteStop }) => (
  <>
    {stops?.length > 0 ? [...stops].sort((a,b) => (a.stop_sequence || 0) - (b.stop_sequence || 0)).map((stop, i) => (
      <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all group">
         <div className="col-span-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shadow-sm ${stop.stop_type === 'PICKUP' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
               {stop.stop_type === 'PICKUP' ? '📦' : '🏗️'}
            </div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] tracking-tight">#{stop.stop_sequence} - {stop.stop_type}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">STOP_ID: {stop.id?.slice(0, 16).toUpperCase()}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"><MapIcon size={16} /></div>
            <div>
               <p className="text-[14px] font-bold text-[#334155]">{stop.location_address || '-'}</p>
               <p className="text-[12px] text-[#64748b] font-medium">{stop.instructions || 'No instructions'}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><Calendar size={16} /></div>
            <p className="text-[13px] font-bold text-[#475569] truncate">Scheduled Arrival Pending</p>
         </div>
         <div className="col-span-1 flex justify-center">
            <StatusIcon status={stop.stop_status || 'PENDING'} />
         </div>
         <div className="col-span-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onUpdateStopStatus(stop.id, 'IN_PROGRESS')} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-blue-100" title="Mark In Progress"><Edit3 size={16} /></button>
            <button onClick={() => onDeleteStop(stop.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-rose-100" title="Delete stop"><Trash2 size={16} /></button>
         </div>
      </div>
    )) : <EmptyState message="No Stops mapped for this trip route." />}
  </>
);

const HistoryList = ({ history }) => (
  <>
    {history?.length > 0 ? history.map((h, i) => (
      <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all">
         <div className="col-span-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[18px]">🕐</div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] tracking-tight truncate max-w-[200px]">Status: {h.status}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">EVENT_LOG: {h.id?.slice(0, 16).toUpperCase()}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-3 px-2">
            <p className="text-[13px] text-[#64748b] italic">"{h.remarks || 'System automated status transition.'}"</p>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><Clock size={16} /></div>
            <p className="text-[13px] font-bold text-[#475569]">{formatDateTime(h.changed_at)}</p>
         </div>
         <div className="col-span-1 flex justify-center"><StatusIcon status="COMPLETED" /></div>
         <div className="col-span-1 flex justify-center">
            <span className="text-[10px] font-black text-[#cbd5e1] uppercase tracking-widest">Logged</span>
         </div>
      </div>
    )) : <EmptyState message="No Status History records found." />}
  </>
);

const DocsList = ({ documents }) => (
  <>
    {documents?.length > 0 ? documents.map((doc, i) => (
      <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all group">
         <div className="col-span-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[18px]">📄</div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] uppercase tracking-tight">{doc.document_type}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">FILE_REF: {doc.id?.slice(0, 16).toUpperCase()}</p>
            </div>
         </div>
         <div className="col-span-3 flex items-center gap-4">
             <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><User size={16} /></div>
             <div>
                <p className="text-[14px] font-bold text-[#334155]">{doc.remarks || 'Unassigned Remarks'}</p>
                <p className="text-[12px] text-[#64748b] font-medium">Compliance Review Portal</p>
             </div>
         </div>
         <div className="col-span-3 flex items-center gap-3">
            <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-400"><Clock size={16} /></div>
            <p className="text-[13px] font-bold text-[#475569]">{formatDate(doc.uploaded_at || Date.now())}</p>
         </div>
         <div className="col-span-1 flex justify-center"><StatusIcon status="VERIFIED" /></div>
         <div className="col-span-1 flex justify-center gap-2">
            <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-3 bg-white border border-[#e2e8f0] text-gray-400 hover:text-[#3b82f6] hover:border-[#3b82f6]/30 shadow-sm rounded-xl transition-all"><Globe size={16} /></a>
         </div>
      </div>
    )) : <EmptyState message="No Documents uploaded for verification." />}
  </>
);

const FinanceList = ({ expenses, charges, onEdit, onDelete }) => {
  const merged = [...(expenses || []).map(e => ({ ...e, res_type: 'EXPENSE' })), ...(charges || []).map(c => ({ ...c, res_type: 'CHARGE' }))];
  return (
    <>
      {merged.length > 0 ? merged.map((item, i) => (
        <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center hover:bg-[#f1f5f9]/50 transition-all group">
          <div className="col-span-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] border shadow-sm ${item.res_type === 'EXPENSE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
               {item.res_type === 'EXPENSE' ? '🧾' : '🔖'}
            </div>
            <div>
               <h4 className="text-[14px] font-extrabold text-[#0f172a] uppercase tracking-tight">{item.expense_type || item.charge_type}</h4>
               <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider font-mono">{item.res_type}: {item.id?.slice(0, 16).toUpperCase()}</p>
            </div>
          </div>
          <div className="col-span-3 flex items-center gap-3">
             <div className="text-[17px] font-black text-[#0f172a]">₹{parseFloat(item.amount).toLocaleString()}</div>
             <span className="text-[10px] bg-slate-100 text-[#64748b] px-2 py-0.5 rounded font-black tracking-widest">{item.currency || 'INR'}</span>
          </div>
          <div className="col-span-3 flex items-center gap-3 px-2">
             <p className="text-[13px] text-[#64748b] font-medium truncate max-w-[200px]">{item.description || item.remarks || 'No supplementary notes.'}</p>
          </div>
          <div className="col-span-1 flex justify-center">
             <StatusIcon status={item.status || 'PENDING'} />
          </div>
          <div className="col-span-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
             <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"><Edit3 size={16} /></button>
             <button onClick={() => onDelete(item)} className="p-2 text-gray-400 hover:text-rose-500 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>
      )) : <EmptyState message="No Financial records (Expenses/Charges) found." />}
    </>
  );
};

// --- Helper UI Components ---

const StatItem = ({ label, value, color }) => (
  <div className="flex flex-col gap-1 items-center md:items-start min-w-[140px] border-r last:border-0 border-[#e2e8f0] pr-8 last:pr-0">
     <div className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.14em]">{label}</div>
     <div className={`text-2xl font-black ${color} tracking-tight`}>{value}</div>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 text-[12px] font-black tracking-[0.08em] uppercase rounded-lg transition-all ${
      active ? 'bg-white text-[#3b82f6] shadow-md border border-[#e2e8f0]' : 'text-[#64748b] hover:text-[#3b82f6]'
    }`}
  >
    {label}
  </button>
);

const StatusIcon = ({ status }) => {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-500 border-amber-500/30',
    COMPLETED: 'bg-emerald-50 text-emerald-500 border-emerald-500/30',
    VERIFIED: 'bg-emerald-50 text-emerald-600 border-emerald-500/30',
    IN_TRANSIT: 'bg-blue-50 text-blue-500 border-blue-500/30'
  };
  return (
    <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${styles[status] || styles.PENDING}`}>
       <CheckCircle2 size={16} className={status === 'PENDING' ? 'opacity-30' : ''} />
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="p-24 flex flex-col items-center justify-center gap-5 text-center bg-gray-50/20">
     <div className="w-20 h-20 bg-white border border-[#e2e8f0] rounded-3xl flex items-center justify-center text-4xl shadow-sm animate-pulse grayscale opacity-40">📊</div>
     <p className="text-[13px] font-black text-[#cbd5e1] uppercase tracking-[0.15em] max-w-[200px] leading-relaxed">{message}</p>
  </div>
);

// --- Sub-resource Modals (Full Integration) ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="px-10 py-7 border-b border-[#f1f5f9] flex justify-between items-center text-[#1e293b] bg-gray-50/30">
          <h2 className="text-[13px] font-black uppercase tracking-[0.15em]">{title}</h2>
          <button onClick={onClose} className="p-3 text-[#94a3b8] hover:text-[#1e293b] hover:bg-white border border-transparent hover:border-[#e2e8f0] rounded-[1rem] transition-all shadow-sm"><X size={20} /></button>
        </div>
        <div className="p-10 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const FieldGroup = ({ label, children, required }) => (
  <div className="flex flex-col">
    <label className="block text-gray-700 font-medium mb-1 text-[11px] font-black text-[#64748b] uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-5 py-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-[14px] font-bold outline-none focus:border-[#3b82f6] transition-all";

// Legacy edit modal removed. SharedEditTripModal from TripModals.jsx is used.

export function AddStopModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ stop_type: 'PICKUP', stop_sequence: 1, location_address: '', stop_status: 'PENDING', instructions: '' });
  const mutation = useCreateTripStop(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(formData, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Trip Stop">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Stop Type</label>
            <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.stop_type} onChange={e => setFormData({...formData, stop_type: e.target.value})}><option value="PICKUP">PICKUP</option><option value="DELIVERY">DELIVERY</option><option value="TRANSIT">TRANSIT</option><option value="BREAK">BREAK</option><option value="FUEL">FUEL</option><option value="OTHER">OTHER</option></select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Sequence Code</label>
            <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.stop_sequence} onChange={e => setFormData({...formData, stop_sequence: parseInt(e.target.value)})} /></div>
        </div>
        <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Facility / Location Name</label>
          <input className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="E.g. Logistics Park A..." value={formData.location_address} onChange={e => setFormData({...formData, location_address: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <select className="px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none" value={formData.stop_status} onChange={e => setFormData({...formData, stop_status: e.target.value})}>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="SKIPPED">SKIPPED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <input className="px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none" placeholder="Instructions" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} />
        </div>
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-[#3b82f6] text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">{mutation.isLoading ? 'Adding...' : 'Add Stop'}</button>
      </form>
    </Modal>
  );
}

export function AddDocumentModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ document_type: 'POD', file_url: '', remarks: '' });
  const mutation = useCreateTripDocument(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(formData, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Document Profile</label>
          <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.document_type} onChange={e => setFormData({...formData, document_type: e.target.value})}><option value="LR">LR</option><option value="E_WAY_BILL">E-WAY BILL</option><option value="INVOICE">INVOICE</option><option value="POD">POD</option><option value="DELIVERY_CHALLAN">DELIVERY CHALLAN</option><option value="INSURANCE">INSURANCE</option><option value="PERMIT">PERMIT</option><option value="OTHER">OTHER</option></select></div>
        <textarea className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Entry remarks or validation notes..." rows="3" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
        <input
          type="url"
          required
          className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]"
          placeholder="https://your-storage/path/document.pdf"
          value={formData.file_url}
          onChange={e => setFormData({ ...formData, file_url: e.target.value })}
        />
        <div className="p-12 border-2 border-dashed border-[#e2e8f0] rounded-[2rem] flex flex-col items-center justify-center text-center bg-[#f8fafc]/50">
          <Upload size={40} className="text-[#cbd5e1] mb-4 animate-bounce duration-1000" />
          <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]">Paste Document URL Then Upload</p>
        </div>
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-emerald-500 text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">{mutation.isLoading ? 'Processing...' : 'Upload Document'}</button>
      </form>
    </Modal>
  );
}

export function AddExpenseModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({ expense_type: 'FUEL', amount: '', currency: 'INR', expense_date: new Date().toISOString().split('T')[0], description: '' });
  const mutation = useCreateTripExpense(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate({...formData, amount: parseFloat(formData.amount)}, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Expense">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Expenditure Category</label>
            <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.expense_type} onChange={e => setFormData({...formData, expense_type: e.target.value})}><option value="TOLL">TOLL</option><option value="FUEL">FUEL</option><option value="LOADING">LOADING</option><option value="UNLOADING">UNLOADING</option><option value="PARKING">PARKING</option><option value="DRIVER_ADVANCE">DRIVER ADVANCE</option><option value="BRANCH_ADVANCE">BRANCH ADVANCE</option><option value="LOCATION_ADVANCE">LOCATION ADVANCE</option><option value="REPAIR">REPAIR</option><option value="MISCELLANEOUS">MISCELLANEOUS</option></select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Accrual Amount (₹)</label>
            <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[16px] font-black outline-none focus:border-[#3b82f6]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
        </div>
        <textarea className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Description of expenditure..." rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-amber-500 text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">{mutation.isLoading ? 'Recording...' : 'Record Expenditure'}</button>
      </form>
    </Modal>
  );
}

export function AddChargeModal({ isOpen, onClose, tripId }) {
  const [formData, setFormData] = useState({
    charge_type: 'FREIGHT',
    amount: '',
    quantity: 1,
    unit_price: '',
    tax_rate: '',
    tax_amount: '',
    description: '',
  });
  const mutation = useCreateTripCharge(tripId);
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate({...formData, amount: parseFloat(formData.amount)}, { onSuccess: onClose }); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Charge">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Service Type</label>
            <select className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" value={formData.charge_type} onChange={e => setFormData({...formData, charge_type: e.target.value})}><option value="FREIGHT">FREIGHT</option><option value="LOADING">LOADING</option><option value="UNLOADING">UNLOADING</option><option value="DETENTION">DETENTION</option><option value="DEMURRAGE">DEMURRAGE</option><option value="TOLL_REIMBURSEMENT">TOLL REIMBURSEMENT</option><option value="FUEL_SURCHARGE">FUEL SURCHARGE</option><option value="HAMALI">HAMALI</option><option value="PART_LOAD">PART LOAD</option><option value="INCENTIVE">INCENTIVE</option><option value="LATE_FEE">LATE FEE</option><option value="DAMAGE_DEDUCTION">DAMAGE DEDUCTION</option><option value="OTHER">OTHER</option></select></div>
          <div className="space-y-1.5"><label className="text-[11px] font-black text-[#64748b] uppercase tracking-wider">Accrual Amount (₹)</label>
            <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[16px] font-black outline-none focus:border-[#3b82f6]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
          <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Unit Price" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} />
          <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Tax Rate (%)" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
        </div>
        <input type="number" className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Tax Amount" value={formData.tax_amount} onChange={e => setFormData({...formData, tax_amount: e.target.value})} />
        <textarea className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold outline-none focus:border-[#3b82f6]" placeholder="Charge description..." rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <button type="submit" disabled={mutation.isLoading} className="w-full py-4 bg-[#3b82f6] text-white rounded-[1.5rem] font-bold uppercase tracking-wider hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">{mutation.isLoading ? 'Processing...' : 'Register Accrual'}</button>
      </form>
    </Modal>
  );
}