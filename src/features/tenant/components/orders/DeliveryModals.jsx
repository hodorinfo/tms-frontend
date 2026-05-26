import React, { useState, useEffect } from 'react';
import {
  X, FileCheck, MapPin, History, FileText, Wallet, Hash,
  AlertCircle, ArrowRight, Paperclip, ExternalLink, Receipt,
  CreditCard, Clock, CheckCircle2, User, Calendar
} from 'lucide-react';
import {
  useCreatePOD,
  useUpdateDelivery,
  useTripStops,
  useTripStatusHistory,
  useTripDocuments,
  useTripExpenses,
  useTripCharges,
  useCreateTripStop,
  useCreateTripDocument,
  useCreateTripExpense,
  useCreateTripCharge,
  useTripDetail,
  useDeliveryDetail,
  useTrips,
} from '../../queries/orders/ordersQuery';

// --- Configuration & Status ---
const POD_STATUS_CONFIG = {
  PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: <Clock size={14} /> },
  SUBMITTED: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: <FileCheck size={14} /> },
  VERIFIED: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
  REJECTED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: <AlertCircle size={14} /> },
};

const StatusBadge = ({ status }) => {
  const config = POD_STATUS_CONFIG[status] || POD_STATUS_CONFIG.PENDING;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wide">{status}</span>
    </div>
  );
};

// --- Base Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export function CreatePODModal({ isOpen, onClose }) {
  const createPODMutation = useCreatePOD();
  const { data: tripsData } = useTrips({ ordering: '-updated_at', page_size: 200 });
  const [selectedTripId, setSelectedTripId] = useState('');
  const [podFile, setPodFile] = useState(null);
  const trips = tripsData?.results || [];
  const { data: tripDetail } = useTripDetail(selectedTripId);
  const linkedOrders = tripDetail?.linked_orders || [];

  const [formData, setFormData] = useState({
    order_id: '',
    received_by_name: '',
    delivery_status: 'DELIVERED',
    remarks: '',
    damage_notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTripId || !podFile) return;
    createPODMutation.mutate(
      {
        trip_id: selectedTripId,
        file: podFile,
        order_id: formData.order_id || undefined,
        received_by_name: formData.received_by_name,
        delivery_status: formData.delivery_status,
        remarks: formData.remarks,
        damage_notes: formData.damage_notes,
      },
      {
        onSuccess: () => {
          setSelectedTripId('');
          setPodFile(null);
          setFormData({ order_id: '', received_by_name: '', delivery_status: 'DELIVERED', remarks: '', damage_notes: '' });
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New POD Record">
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">Trip *</label>
            <select
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC]"
              value={selectedTripId}
              onChange={(e) => {
                setSelectedTripId(e.target.value);
                setFormData((prev) => ({ ...prev, order_id: '' }));
              }}
            >
              <option value="">Select trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.trip_number || trip.id.slice(-8)} — {trip.status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">LR (optional)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC]"
              value={formData.order_id}
              onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
              disabled={!selectedTripId}
            >
              <option value="">Trip-level POD</option>
              {linkedOrders.map((o) => (
                <option key={o.order_id} value={o.order_id}>
                  {o.lr_number || o.order_id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1 uppercase text-[10px]">POD file *</label>
          <input
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="w-full text-sm"
            onChange={(e) => setPodFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Received by (optional)"
            className="w-full p-2 border border-gray-300 rounded"
            value={formData.received_by_name}
            onChange={(e) => setFormData({ ...formData, received_by_name: e.target.value })}
          />
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={formData.delivery_status}
            onChange={(e) => setFormData({ ...formData, delivery_status: e.target.value })}
          >
            <option value="DELIVERED">DELIVERED</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="DAMAGED">DAMAGED</option>
            <option value="REFUSED">REFUSED</option>
            <option value="RETURNED">RETURNED</option>
          </select>
        </div>
        <textarea className="w-full p-2 border border-gray-300 rounded" rows="2" placeholder="Remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
        <textarea className="w-full p-2 border border-gray-300 rounded" rows="2" placeholder="Damage notes" value={formData.damage_notes} onChange={(e) => setFormData({ ...formData, damage_notes: e.target.value })} />
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="submit"
            disabled={createPODMutation.isPending || !selectedTripId || !podFile}
            className="px-6 py-2.5 text-white bg-[#0052CC] rounded-lg shadow-md disabled:opacity-50"
          >
            {createPODMutation.isPending ? 'Uploading…' : 'Upload POD'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditDeliveryModal({ isOpen, onClose, delivery }) {
  const updateDeliveryMutation = useUpdateDelivery();

  const [formData, setFormData] = useState({
    received_by_name: delivery?.received_by_name || "",
    received_by_relation: delivery?.received_by_relation || "",
    delivery_status: delivery?.delivery_status || "DELIVERED",
    remarks: delivery?.remarks || "",
    damage_notes: delivery?.damage_notes || "",
    shortage_notes: delivery?.shortage_notes || "",
    signature_url: delivery?.signature_url || "",
    pod_number: delivery?.pod_number || "",
    delivery_latitude: delivery?.delivery_latitude || "",
    delivery_longitude: delivery?.delivery_longitude || "",
    location_accuracy_meters: delivery?.location_accuracy_meters || "",
  });

  useEffect(() => {
    if (delivery && isOpen) {
      setFormData({
        received_by_name: delivery.received_by_name || "",
        received_by_relation: delivery.received_by_relation || "",
        delivery_status: delivery.delivery_status || "DELIVERED",
        remarks: delivery.remarks || "",
        damage_notes: delivery.damage_notes || "",
        shortage_notes: delivery.shortage_notes || "",
        signature_url: delivery.signature_url || "",
        pod_number: delivery.pod_number || "",
        delivery_latitude: delivery.delivery_latitude || "",
        delivery_longitude: delivery.delivery_longitude || "",
        location_accuracy_meters: delivery.location_accuracy_meters || "",
      });
    }
  }, [delivery, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { received_by_relation, shortage_notes, signature_url, pod_number, delivery_latitude, delivery_longitude, location_accuracy_meters, ...rest } = formData;
    const data = {
      ...rest,
      document_name: pod_number || delivery.document_name,
      document_number: pod_number || delivery.document_number,
    };
    updateDeliveryMutation.mutate(
      { id: delivery.id, tripId: delivery.trip || delivery.trip_id, data },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit POD: ${delivery?.pod_number || delivery?.id?.slice(-8)}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Recipient Name</label>
            <input
              type="text" required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC]"
              value={formData.received_by_name}
              onChange={e => setFormData({ ...formData, received_by_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Relation</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC]"
              value={formData.received_by_relation}
              onChange={e => setFormData({ ...formData, received_by_relation: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Delivery Status</label>
            <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#0052CC]" value={formData.delivery_status} onChange={e => setFormData({ ...formData, delivery_status: e.target.value })}>
              <option value="DELIVERED">DELIVERED</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="REFUSED">REFUSED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="POD Number" className="w-full p-2 border border-gray-300 rounded" value={formData.pod_number} onChange={e => setFormData({ ...formData, pod_number: e.target.value })} />
          <input type="url" placeholder="Signature URL" className="w-full p-2 border border-gray-300 rounded" value={formData.signature_url} onChange={e => setFormData({ ...formData, signature_url: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input type="number" step="0.000001" placeholder="Latitude" className="w-full p-2 border border-gray-300 rounded" value={formData.delivery_latitude} onChange={e => setFormData({ ...formData, delivery_latitude: e.target.value })} />
          <input type="number" step="0.000001" placeholder="Longitude" className="w-full p-2 border border-gray-300 rounded" value={formData.delivery_longitude} onChange={e => setFormData({ ...formData, delivery_longitude: e.target.value })} />
          <input type="number" step="0.01" placeholder="Accuracy" className="w-full p-2 border border-gray-300 rounded" value={formData.location_accuracy_meters} onChange={e => setFormData({ ...formData, location_accuracy_meters: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <textarea className="w-full p-2 border border-gray-300 rounded" rows="2" placeholder="Damage notes" value={formData.damage_notes} onChange={e => setFormData({ ...formData, damage_notes: e.target.value })} />
          <textarea className="w-full p-2 border border-gray-300 rounded" rows="2" placeholder="Shortage notes" value={formData.shortage_notes} onChange={e => setFormData({ ...formData, shortage_notes: e.target.value })} />
        </div>
        <textarea className="w-full p-2 border border-gray-300 rounded" rows="2" placeholder="Remarks" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
          <button type="submit" disabled={updateDeliveryMutation.isPending} className="px-6 py-2.5 text-white bg-[#0052CC] rounded-lg shadow-md disabled:opacity-50">
            {updateDeliveryMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ViewPODModal({ isOpen, onClose, item }) {
  const [activeTab, setActiveTab] = useState('general');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: podDetail, isLoading: loadingPod } = useDeliveryDetail(item?.id);
  const pod = podDetail || item;
  const tripId = pod?.trip_id || pod?.trip || item?.trip_stop?.trip_id;

  const { data: trip } = useTripDetail(tripId);
  const { data: stops, isLoading: loadingStops } = useTripStops(tripId);
  const { data: history, isLoading: loadingHistory } = useTripStatusHistory(tripId);
  const { data: documents, isLoading: loadingDocs } = useTripDocuments(tripId);
  const { data: expenses, isLoading: loadingExpenses } = useTripExpenses(tripId);
  const { data: charges, isLoading: loadingCharges } = useTripCharges(tripId);

  // Mutations
  const createStopMutation = useCreateTripStop(tripId);
  const createDocMutation = useCreateTripDocument(tripId);
  const createExpenseMutation = useCreateTripExpense(tripId);
  const createChargeMutation = useCreateTripCharge(tripId);

  const [stopData, setStopData] = useState({ stop_type: 'PICKUP', sequence_order: '', location_name: '', city: '', state: '' });
  const [docData, setDocData] = useState({ document_type: 'POD', file_url: '', remarks: '' });
  const [expData, setExpData] = useState({ expense_type: 'TOLL', amount: '', currency: 'INR', expense_date: new Date().toISOString().slice(0, 10), remarks: '' });
  const [chgData, setChgData] = useState({ charge_type: 'BASE_FREIGHT', amount: '', currency: 'INR', is_taxable: true, remarks: '' });

  const resetForm = () => {
    setShowAddForm(false);
    setStopData({ stop_type: 'PICKUP', sequence_order: '', location_name: '', city: '', state: '' });
    setDocData({ document_type: 'POD', file_url: '', remarks: '' });
    setExpData({ expense_type: 'TOLL', amount: '', currency: 'INR', expense_date: new Date().toISOString().slice(0, 10), remarks: '' });
    setChgData({ charge_type: 'BASE_FREIGHT', amount: '', currency: 'INR', is_taxable: true, remarks: '' });
  };

  if (!item) return null;

  const tabs = [
    { id: 'general', label: 'POD Info', icon: FileCheck },
    { id: 'stops', label: 'Trip Stops', icon: MapPin },
    { id: 'history', label: 'History', icon: History },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'finances', label: 'Finances', icon: Wallet },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`POD & Trip Console: ${item.pod_number || item.id?.slice(-8)}`}>
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="flex border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/30'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {loadingPod && <div className="text-center py-4 text-xs text-gray-400">Loading details...</div>}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">POD Number</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1"><Hash size={14} /> {pod.pod_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Delivery Status</p>
                  <p className="text-xs font-black text-blue-600 uppercase border-b-2 border-blue-100 pb-0.5 inline-block">{pod.delivery_status || pod.status || 'DELIVERED'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Recipient Name / Relation</p>
                  <p className="font-semibold text-[#0052CC]">{pod.received_by_name || pod.received_by || 'N/A'} {pod.received_by_relation ? <span className="text-gray-400 font-medium ml-1">({pod.received_by_relation})</span> : ''}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Delivery Date (Time)</p>
                  <p className="font-semibold text-gray-900">{pod.delivery_date ? new Date(pod.delivery_date).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 font-medium mb-1 text-xs uppercase tracking-wider">Remarks</p>
                  <p className="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3 py-1">{pod.remarks || 'No remarks provided'}</p>
                </div>
                <div className="col-span-2 bg-gray-100/50 p-3 rounded-lg grid grid-cols-2 gap-4 border-dashed border border-gray-200">
                  <div>
                    <p className="text-gray-400 font-bold mb-1 text-[9px] uppercase tracking-widest">Linked Stop UUID</p>
                    <p className="font-mono text-[10px] text-gray-600 break-all">{pod.trip_stop || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-bold mb-1 text-[9px] uppercase tracking-widest">GPS Coordinates</p>
                    <p className="text-[10px] font-bold text-gray-800 tracking-tighter">{pod.delivery_latitude || '0.0'}, {pod.delivery_longitude || '0.0'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stops' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                <h4 className="text-[10px] font-black uppercase text-blue-700 tracking-widest flex items-center gap-2"><MapPin size={14} /> Stop Sequence</h4>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-[9px] font-black uppercase text-blue-600 bg-white px-2 py-1 rounded border border-blue-100"
                >
                  {showAddForm ? 'Cancel' : '+ Add Stop'}
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createStopMutation.mutate({ ...stopData, sequence_order: parseInt(stopData.sequence_order) }, { onSuccess: resetForm });
                  }}
                  className="bg-blue-50/20 p-4 rounded-lg border-2 border-dashed border-blue-200 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Location Name" required className="p-2 text-xs border rounded" value={stopData.location_name} onChange={e => setStopData({ ...stopData, location_name: e.target.value })} />
                    <select className="p-2 text-xs border rounded" value={stopData.stop_type} onChange={e => setStopData({ ...stopData, stop_type: e.target.value })}>
                      <option value="PICKUP">PICKUP</option>
                      <option value="DELIVERY">DELIVERY</option>
                      <option value="DEPOT">DEPOT</option>
                    </select>
                  </div>
                  <input type="number" placeholder="Sequence" required className="p-2 text-xs border rounded w-full" value={stopData.sequence_order} onChange={e => setStopData({ ...stopData, sequence_order: e.target.value })} />
                  <button type="submit" disabled={createStopMutation.isPending} className="w-full py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase">
                    Add Stop
                  </button>
                </form>
              )}

              <div className="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {stops?.map((stop) => (
                  <div key={stop.id} className="relative">
                    <div className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${stop.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div className="bg-white border border-gray-100 rounded-lg p-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Stop #{stop.sequence_order} • {stop.stop_type}</p>
                      <p className="text-sm font-bold text-[#172B4D]">{stop.location_name}</p>
                      <p className="text-[11px] text-gray-500">{stop.city}, {stop.state}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {history?.map((log) => (
                <div key={log.id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.old_status}</span>
                      <ArrowRight size={10} className="text-gray-300" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.new_status}</span>
                    </div>
                    <p className="text-xs text-gray-700">{log.notes || 'Status updated'}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic">{new Date(log.changed_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <button onClick={() => setShowAddForm(!showAddForm)} className="w-full py-2 bg-gray-50 text-gray-600 border border-dashed rounded text-[10px] font-black uppercase">
                {showAddForm ? 'Cancel' : '+ Upload Document'}
              </button>
              {showAddForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createDocMutation.mutate(docData, { onSuccess: resetForm });
                  }}
                  className="bg-gray-50 p-4 rounded-lg border space-y-2"
                >
                  <input type="text" placeholder="Remarks" className="w-full p-2 text-xs border" value={docData.remarks} onChange={e => setDocData({ ...docData, remarks: e.target.value })} />
                  <input type="url" placeholder="File URL" className="w-full p-2 text-xs border" value={docData.file_url} onChange={e => setDocData({ ...docData, file_url: e.target.value })} />
                  <button className="w-full py-2 bg-black text-white text-xs font-bold uppercase">Upload</button>
                </form>
              )}
              <div className="grid grid-cols-1 gap-2">
                {documents?.map(doc => (
                  <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-blue-50">
                    <Paperclip size={18} className="text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-700 uppercase">{doc.document_type}</p>
                      <p className="text-[10px] text-gray-400 truncate">{doc.file_url}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAddForm('expense')} className="py-2 bg-amber-50 text-amber-600 border rounded text-[9px] font-black uppercase tracking-widest">+ Expense</button>
                <button onClick={() => setShowAddForm('charge')} className="py-2 bg-green-50 text-green-600 border rounded text-[9px] font-black uppercase tracking-widest">+ Charge</button>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2 border-b pb-1"><Receipt size={14} /> Expenses</h4>
                {expenses?.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center p-2.5 bg-white border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-700">{exp.expense_type}</p>
                    <p className="text-sm font-black text-amber-600">{exp.currency} {exp.amount}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-2 border-b pb-1"><CreditCard size={14} /> Charges</h4>
                {charges?.map(chg => (
                  <div key={chg.id} className="flex justify-between items-center p-2.5 bg-white border border-gray-100 rounded-lg">
                    <p className="text-xs font-bold text-gray-700">{chg.charge_type}</p>
                    <p className="text-sm font-black text-green-600">{chg.currency} {chg.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 mt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2.5 text-white bg-[#0052CC] rounded-lg text-sm font-black uppercase tracking-widest transition-all">
            Close Console
          </button>
        </div>
      </div>
    </Modal>
  );
}
