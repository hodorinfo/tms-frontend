import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Layers, MapPin, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import {
  useSyncCargo,
  useUpdateCargo,
  useCargoItems,
  useTrips,
  useTripStops,
  useTripDetail,
  useOrderDetail,
} from '../../queries/orders/ordersQuery';

const INPUT_CLASS =
  'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none text-sm';

const CARGO_TYPE_COLORS = {
  HAZARDOUS: 'bg-red-100 text-red-700 border-red-200',
  PERISHABLE: 'bg-teal-100 text-teal-700 border-teal-200',
  FRAGILE: 'bg-amber-100 text-amber-700 border-amber-200',
  HIGH_VALUE: 'bg-purple-100 text-purple-700 border-purple-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
  GENERAL: 'bg-blue-100 text-blue-700 border-blue-200',
};

const COMMODITY_OPTIONS = ['GENERAL', 'HAZARDOUS', 'PERISHABLE', 'FRAGILE', 'HIGH_VALUE', 'OTHER'];
const TERMINAL_TRIP_STATUSES = ['COMPLETED', 'CANCELLED'];
const STOP_TYPES = ['PICKUP', 'DELIVERY', 'PICKUP_AND_DELIVERY'];

const EMPTY_CARGO_ROW = { item_code: '', description: '', quantity: '1', commodity_type: 'GENERAL' };

const EMPTY_SHARED = {
  trip_stop: '',
  package_type: '',
  weight_kg: '',
  volume_cbm: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  hazardous_class: '',
  temperature_range: '',
  orientation: 'NA',
  insurance_required: false,
  is_fragile: false,
  is_perishable: false,
  stackable: true,
};

const Modal = ({ isOpen, onClose, title, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

function LRContextPanel({ order, lrNumber, isLoading }) {
  if (!order && !isLoading) return null;
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
      <h4 className="text-[10px] font-bold text-[#4a6cf7] uppercase tracking-widest flex items-center gap-1.5">
        <MapPin size={12} /> LR Pickup &amp; Delivery {lrNumber ? `(${lrNumber})` : ''}
      </h4>
      {isLoading ? (
        <p className="text-xs text-gray-500">Loading LR details...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-white/80 border border-blue-100/60 p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pickup</p>
            <p className="text-xs font-semibold text-gray-700">{order?.pickup_date ? formatDate(order.pickup_date) : '—'}</p>
            <p className="text-xs text-gray-600 mt-1">{order?.consignor_address || 'No pickup address'}</p>
          </div>
          <div className="rounded-lg bg-white/80 border border-blue-100/60 p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery</p>
            <p className="text-xs font-semibold text-gray-700">{order?.delivery_date ? formatDate(order.delivery_date) : '—'}</p>
            <p className="text-xs text-gray-600 mt-1">{order?.consignee_address || 'No delivery address'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ExistingLRCargoList({ items, isLoading, lrNumber }) {
  if (!lrNumber && !isLoading) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2">
      <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1.5">
        <Package size={12} /> Items on this LR
      </h4>
      {isLoading ? (
        <p className="text-xs text-gray-500">Loading cargo items...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No cargo items on this LR yet.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-2 items-center text-xs bg-white border border-gray-100 rounded-lg px-2 py-1.5"
            >
              <span className="col-span-2 font-mono text-gray-500 truncate">{row.item_code || '—'}</span>
              <span className="col-span-5 font-medium text-gray-800 truncate">{row.description}</span>
              <span className="col-span-2 text-center font-bold text-gray-700">Qty {row.quantity}</span>
              <span className="col-span-3 text-right">
                <span
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${CARGO_TYPE_COLORS[row.commodity_type] || CARGO_TYPE_COLORS.GENERAL}`}
                >
                  {row.commodity_type || 'GENERAL'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CargoItemRowsEditor({ rows, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Cargo Items</h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          onClick={onAdd}
        >
          <Plus size={12} /> Add Item
        </button>
      </div>
      <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
        <span className="col-span-2">Item Code</span>
        <span className="col-span-5">Description</span>
        <span className="col-span-2">Qty</span>
        <span className="col-span-2">Type</span>
        <span className="col-span-1" />
      </div>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={`cargo-row-${idx}`} className="grid grid-cols-12 gap-2 items-center">
            <input
              className={`${INPUT_CLASS} col-span-12 md:col-span-2`}
              placeholder="Item code"
              value={row.item_code}
              onChange={(e) =>
                onChange(rows.map((r, i) => (i === idx ? { ...r, item_code: e.target.value } : r)))
              }
            />
            <input
              className={`${INPUT_CLASS} col-span-12 md:col-span-5`}
              placeholder="Cargo description"
              value={row.description}
              onChange={(e) =>
                onChange(rows.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r)))
              }
            />
            <input
              type="number"
              min="1"
              className={`${INPUT_CLASS} col-span-6 md:col-span-2`}
              placeholder="Qty"
              value={row.quantity}
              onChange={(e) =>
                onChange(rows.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r)))
              }
            />
            <select
              className={`${INPUT_CLASS} col-span-5 md:col-span-2`}
              value={row.commodity_type}
              onChange={(e) =>
                onChange(rows.map((r, i) => (i === idx ? { ...r, commodity_type: e.target.value } : r)))
              }
            >
              {COMMODITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="col-span-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 h-9"
              onClick={() => onRemove(idx)}
              title="Remove row"
            >
              <Trash2 size={14} className="mx-auto" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SharedSpecsFields({ shared, setShared, commodityType }) {
  return (
    <div className="space-y-4 pt-2">
      <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">
        Specifications &amp; Classification
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Package Type</label>
          <input
            type="text"
            placeholder="e.g. Bales, Boxes, Crate"
            className={INPUT_CLASS}
            value={shared.package_type}
            onChange={(e) => setShared({ ...shared, package_type: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Placement Orientation</label>
          <select
            className={INPUT_CLASS}
            value={shared.orientation}
            onChange={(e) => setShared({ ...shared, orientation: e.target.value })}
          >
            <option value="NA">NA (No Specific Direction)</option>
            <option value="UP">UP (Upright/Vertical)</option>
            <option value="DOWN">DOWN (Lying Flat)</option>
            <option value="SIDE">SIDE (On its Side)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Weight (kg)</label>
          <input
            type="number"
            step="0.01"
            className={`${INPUT_CLASS} text-xs`}
            value={shared.weight_kg}
            onChange={(e) => setShared({ ...shared, weight_kg: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Volume (cbm)</label>
          <input
            type="number"
            step="0.001"
            className={`${INPUT_CLASS} text-xs`}
            value={shared.volume_cbm}
            onChange={(e) => setShared({ ...shared, volume_cbm: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Length (cm)</label>
          <input
            type="number"
            className={`${INPUT_CLASS} text-xs`}
            value={shared.length_cm}
            onChange={(e) => setShared({ ...shared, length_cm: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Width (cm)</label>
          <input
            type="number"
            className={`${INPUT_CLASS} text-xs`}
            value={shared.width_cm}
            onChange={(e) => setShared({ ...shared, width_cm: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-gray-700 font-[11px] mb-1 uppercase tracking-tight">Height (cm)</label>
          <input
            type="number"
            className={`${INPUT_CLASS} text-xs`}
            value={shared.height_cm}
            onChange={(e) => setShared({ ...shared, height_cm: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {commodityType === 'HAZARDOUS' && (
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Hazardous Class</label>
            <input
              type="text"
              placeholder="e.g. Class 3, Class 8"
              className={`${INPUT_CLASS} text-xs`}
              value={shared.hazardous_class}
              onChange={(e) => setShared({ ...shared, hazardous_class: e.target.value })}
            />
          </div>
        )}
        {shared.is_perishable && (
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-xs">Temperature Range</label>
            <input
              type="text"
              placeholder="e.g. 2°C to 8°C"
              className={`${INPUT_CLASS} text-xs`}
              value={shared.temperature_range}
              onChange={(e) => setShared({ ...shared, temperature_range: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function HandlingFields({ shared, setShared }) {
  return (
    <div className="space-y-4 pt-2">
      <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">Handling &amp; Care</h3>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]"
            checked={shared.is_fragile}
            onChange={(e) => setShared({ ...shared, is_fragile: e.target.checked })}
          />
          <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Is Fragile</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]"
            checked={shared.is_perishable}
            onChange={(e) => setShared({ ...shared, is_perishable: e.target.checked })}
          />
          <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Is Perishable</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]"
            checked={shared.stackable}
            onChange={(e) => setShared({ ...shared, stackable: e.target.checked })}
          />
          <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Stackable</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-[#4a6cf7] focus:ring-[#4a6cf7]"
            checked={shared.insurance_required}
            onChange={(e) => setShared({ ...shared, insurance_required: e.target.checked })}
          />
          <span className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">Insurance Required</span>
        </label>
      </div>
    </div>
  );
}

function StopAllocationSection({ tripStops, stopQuantities, setStopQuantities, totalLoadQty, totalUnloadQty }) {
  if (!tripStops.length) return null;
  return (
    <div className="space-y-4 pt-2">
      <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">
        Stop-wise Quantity Allocation
      </h3>
      <p className="text-[11px] text-gray-500">
        Quantity = total Load Qty ({totalLoadQty}). Unload Qty ({totalUnloadQty}) is tracked separately.
        {totalLoadQty > 0 && ' Applied when adding a single item.'}
      </p>
      <div className="space-y-2">
        {tripStops.map((stop) => (
          <div key={stop.id} className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-6 text-xs text-gray-700">
              #{stop.stop_sequence} {stop.stop_type} - {stop.location_address || 'No location'}
            </div>
            <div className="col-span-3">
              <input
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-xs"
                placeholder="Load"
                value={stopQuantities[stop.id]?.load_quantity || ''}
                onChange={(e) =>
                  setStopQuantities((prev) => ({
                    ...prev,
                    [stop.id]: { ...(prev[stop.id] || {}), load_quantity: e.target.value },
                  }))
                }
              />
            </div>
            <div className="col-span-3">
              <input
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded text-xs"
                placeholder="Unload"
                value={stopQuantities[stop.id]?.unload_quantity || ''}
                onChange={(e) =>
                  setStopQuantities((prev) => ({
                    ...prev,
                    [stop.id]: { ...(prev[stop.id] || {}), unload_quantity: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeCargoRows(rows) {
  return rows
    .map((row) => ({
      item_code: (row.item_code || '').trim(),
      description: (row.description || row.item_code || '').trim(),
      quantity: Number(row.quantity || 0),
      commodity_type: row.commodity_type || 'GENERAL',
    }))
    .filter((row) => (row.description || row.item_code) && row.quantity > 0);
}

function buildSharedPayload(shared) {
  const payload = { ...shared };
  if (payload.length_cm) payload.length_cm = parseInt(payload.length_cm, 10);
  if (payload.width_cm) payload.width_cm = parseInt(payload.width_cm, 10);
  if (payload.height_cm) payload.height_cm = parseInt(payload.height_cm, 10);
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === null) delete payload[key];
  });
  return payload;
}

function buildStopRows(tripStops, stopQuantities) {
  return (tripStops || [])
    .map((stop) => ({
      stop_id: stop.id,
      load_quantity: parseInt(stopQuantities[stop.id]?.load_quantity || 0, 10),
      unload_quantity: parseInt(stopQuantities[stop.id]?.unload_quantity || 0, 10),
    }))
    .filter(
      (row) =>
        (Number.isFinite(row.load_quantity) && row.load_quantity > 0) ||
        (Number.isFinite(row.unload_quantity) && row.unload_quantity > 0)
    );
}

export function CreateCargoModal({ isOpen, onClose, presetTripId }) {
  const syncCargo = useSyncCargo();
  const { data: tripsData } = useTrips({ page_size: 200 });
  const allTrips = tripsData?.results || [];
  const activeTrips = useMemo(
    () => allTrips.filter((t) => !TERMINAL_TRIP_STATUSES.includes(t.status)),
    [allTrips]
  );

  const [tripId, setTripId] = useState(presetTripId || '');
  const [orderId, setOrderId] = useState('');
  const [cargoRows, setCargoRows] = useState([{ ...EMPTY_CARGO_ROW }]);
  const [shared, setShared] = useState({ ...EMPTY_SHARED });
  const [stopQuantities, setStopQuantities] = useState({});

  const { data: selectedTrip } = useTripDetail(tripId || null);
  const { data: orderDetail, isLoading: orderLoading } = useOrderDetail(orderId || null);
  const { data: lrCargoData, isLoading: lrCargoLoading } = useCargoItems(
    orderId ? { order_id: orderId, page_size: 100 } : undefined
  );
  const { data: tripStopsData } = useTripStops(tripId || null);

  const linkedOrders = selectedTrip?.linked_orders || [];
  const selectedLrMeta = linkedOrders.find((o) => String(o.order_id) === String(orderId));
  const lrNumber = selectedLrMeta?.lr_number;
  const existingLrItems = lrCargoData?.results || [];

  const allTripStops = Array.isArray(tripStopsData?.results)
    ? tripStopsData.results
    : Array.isArray(tripStopsData)
      ? tripStopsData
      : [];

  const lrTripStops = useMemo(() => {
    const filtered = allTripStops.filter((s) => STOP_TYPES.includes(s.stop_type));
    if (!orderId) return filtered;
    return filtered.filter(
      (s) => !s.order_id || String(s.order_id) === String(orderId)
    );
  }, [allTripStops, orderId]);

  useEffect(() => {
    if (isOpen && presetTripId) setTripId(presetTripId);
  }, [isOpen, presetTripId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!tripId) {
      setOrderId('');
      return;
    }
    if (linkedOrders.length === 1) {
      setOrderId(String(linkedOrders[0].order_id));
    } else if (orderId && !linkedOrders.some((o) => String(o.order_id) === String(orderId))) {
      setOrderId('');
    }
  }, [tripId, linkedOrders.length, isOpen]);

  useEffect(() => {
    const fresh = {};
    lrTripStops.forEach((stop) => {
      fresh[stop.id] = stopQuantities[stop.id] || { load_quantity: '', unload_quantity: '' };
    });
    setStopQuantities(fresh);
  }, [tripId, orderId, lrTripStops.length]);

  const totalLoadQty = Object.values(stopQuantities).reduce((acc, row) => {
    const n = parseInt(row?.load_quantity || 0, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
  const totalUnloadQty = Object.values(stopQuantities).reduce((acc, row) => {
    const n = parseInt(row?.unload_quantity || 0, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const primaryCommodity =
    cargoRows.some((r) => r.commodity_type === 'HAZARDOUS') ? 'HAZARDOUS' : cargoRows[0]?.commodity_type || 'GENERAL';
  const tripLocked = !!presetTripId;

  const resetForm = () => {
    setTripId(presetTripId || '');
    setOrderId('');
    setCargoRows([{ ...EMPTY_CARGO_ROW }]);
    setShared({ ...EMPTY_SHARED });
    setStopQuantities({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tripId) {
      toast.error('Please select a trip.');
      return;
    }
    const normalized = normalizeCargoRows(cargoRows);
    if (!normalized.length) {
      toast.error('Add at least one cargo item with description or item code and quantity > 0.');
      return;
    }

    const sharedPayload = buildSharedPayload(shared);
    const stopRows = buildStopRows(lrTripStops, stopQuantities);
    const applyStopQty = normalized.length === 1 && stopRows.length > 0;

    const items = normalized.map((row) => {
      const item = {
        ...row,
        ...sharedPayload,
        trip: tripId,
        order: orderId || undefined,
      };
      if (applyStopQty) {
        item.stop_quantities = stopRows;
        item.quantity = stopRows.reduce((sum, r) => sum + (r.load_quantity || 0), 0);
      }
      return item;
    });

    try {
      await syncCargo.mutateAsync({
        order_id: orderId || null,
        trip_id: tripId,
        items,
      });
      resetForm();
      onClose();
    } catch {
      /* toast handled by mutation */
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Cargo Item" wide>
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">
            Trip &amp; LR Linkage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Trip (Required) *</label>
              <select
                required
                disabled={tripLocked}
                className={`${INPUT_CLASS} ${tripLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                value={tripId}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setOrderId('');
                }}
              >
                <option value="">Select a trip</option>
                {(tripLocked ? allTrips : activeTrips).map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.trip_number || trip.id?.slice(-8)}
                    {TERMINAL_TRIP_STATUSES.includes(trip.status) ? ` (${trip.status})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Linked LR {linkedOrders.length > 1 ? '*' : '(optional)'}
              </label>
              <select
                className={INPUT_CLASS}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={!tripId}
                required={linkedOrders.length > 1}
              >
                <option value="">
                  {linkedOrders.length > 1 ? 'Select LR' : 'Select LR (optional)'}
                </option>
                {linkedOrders.map((o) => (
                  <option key={o.order_id} value={o.order_id}>
                    {o.lr_number || o.order_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Trip Stop</label>
              <select
                className={INPUT_CLASS}
                value={shared.trip_stop}
                onChange={(e) => setShared({ ...shared, trip_stop: e.target.value })}
                disabled={!tripId}
              >
                <option value="">Select stop (optional)</option>
                {lrTripStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    #{stop.stop_sequence} {stop.stop_type} - {stop.location_address || 'No location'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {orderId && (
          <>
            <LRContextPanel order={orderDetail} lrNumber={lrNumber} isLoading={orderLoading} />
            <ExistingLRCargoList items={existingLrItems} isLoading={lrCargoLoading} lrNumber={lrNumber} />
          </>
        )}

        <CargoItemRowsEditor
          rows={cargoRows}
          onChange={setCargoRows}
          onAdd={() => setCargoRows((prev) => [...prev, { ...EMPTY_CARGO_ROW }])}
          onRemove={(idx) => setCargoRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
        />

        <StopAllocationSection
          tripStops={lrTripStops}
          stopQuantities={stopQuantities}
          setStopQuantities={setStopQuantities}
          totalLoadQty={totalLoadQty}
          totalUnloadQty={totalUnloadQty}
        />

        <SharedSpecsFields shared={shared} setShared={setShared} commodityType={primaryCommodity} />
        <HandlingFields shared={shared} setShared={setShared} />

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={syncCargo.isPending}
            className="px-6 py-2.5 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] shadow-md shadow-blue-200 disabled:opacity-50 font-bold transition-all"
          >
            {syncCargo.isPending ? 'Saving...' : 'Save Cargo Items'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditCargoModal({ isOpen, onClose, item }) {
  const updateCargoMutation = useUpdateCargo();
  const { data: tripsData } = useTrips({ page_size: 200 });
  const trips = tripsData?.results || [];

  const [formData, setFormData] = useState({
    order: '',
    trip: '',
    trip_stop: '',
    description: '',
    item_code: '',
    quantity: '1',
    commodity_type: 'GENERAL',
    hazardous_class: '',
    package_type: '',
    weight_kg: '',
    volume_cbm: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    temperature_range: '',
    orientation: 'NA',
    is_fragile: false,
    is_perishable: false,
    stackable: true,
    insurance_required: false,
  });

  const { data: selectedTrip } = useTripDetail(formData.trip || null);
  const { data: orderDetail, isLoading: orderLoading } = useOrderDetail(formData.order || null);
  const { data: lrCargoData, isLoading: lrCargoLoading } = useCargoItems(
    formData.order ? { order_id: formData.order, page_size: 100 } : undefined
  );
  const { data: tripStopsData } = useTripStops(formData.trip || null);
  const [stopQuantities, setStopQuantities] = useState({});

  const linkedOrders = selectedTrip?.linked_orders || [];
  const selectedLrMeta = linkedOrders.find((o) => String(o.order_id) === String(formData.order));
  const lrNumber = selectedLrMeta?.lr_number;
  const existingLrItems = (lrCargoData?.results || []).filter((c) => c.id !== item?.id);

  const allTripStops = Array.isArray(tripStopsData?.results)
    ? tripStopsData.results
    : Array.isArray(tripStopsData)
      ? tripStopsData
      : [];

  const lrTripStops = useMemo(() => {
    const filtered = allTripStops.filter((s) => STOP_TYPES.includes(s.stop_type));
    if (!formData.order) return filtered;
    return filtered.filter(
      (s) => !s.order_id || String(s.order_id) === String(formData.order)
    );
  }, [allTripStops, formData.order]);

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        trip: item.trip || '',
        order: item.order || '',
        trip_stop: item.trip_stop || '',
        description: item.description || '',
        item_code: item.item_code || '',
        quantity: String(item.quantity ?? '1'),
        commodity_type: item.commodity_type || 'GENERAL',
        hazardous_class: item.hazardous_class || '',
        package_type: item.package_type || '',
        weight_kg: item.weight_kg || '',
        volume_cbm: item.volume_cbm || '',
        length_cm: item.length_cm || '',
        width_cm: item.width_cm || '',
        height_cm: item.height_cm || '',
        temperature_range: item.temperature_range || '',
        orientation: item.orientation || 'NA',
        is_fragile: item.is_fragile || false,
        is_perishable: item.is_perishable || false,
        stackable: item.stackable ?? true,
        insurance_required: item.insurance_required || false,
      });
      const mapped = {};
      (item.stop_quantities || []).forEach((row) => {
        if (row?.stop_id) {
          mapped[row.stop_id] = {
            load_quantity: String(row.load_quantity ?? row.quantity ?? ''),
            unload_quantity: String(row.unload_quantity ?? ''),
          };
        }
      });
      setStopQuantities(mapped);
    }
  }, [item, isOpen]);

  useEffect(() => {
    const fresh = {};
    lrTripStops.forEach((stop) => {
      fresh[stop.id] = stopQuantities[stop.id] || { load_quantity: '', unload_quantity: '' };
    });
    setStopQuantities(fresh);
  }, [formData.trip, formData.order, lrTripStops.length]);

  const totalLoadQty = Object.values(stopQuantities).reduce((acc, row) => {
    const n = parseInt(row?.load_quantity || 0, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
  const totalUnloadQty = Object.values(stopQuantities).reduce((acc, row) => {
    const n = parseInt(row?.unload_quantity || 0, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.quantity) payload.quantity = parseInt(payload.quantity, 10);
    if (payload.length_cm) payload.length_cm = parseInt(payload.length_cm, 10);
    if (payload.width_cm) payload.width_cm = parseInt(payload.width_cm, 10);
    if (payload.height_cm) payload.height_cm = parseInt(payload.height_cm, 10);

    const stopRows = buildStopRows(lrTripStops, stopQuantities);
    if (stopRows.length > 0) {
      payload.stop_quantities = stopRows;
      payload.quantity = stopRows.reduce((sum, row) => sum + (row.load_quantity || 0), 0);
    } else {
      payload.stop_quantities = [];
    }

    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null) delete payload[k];
    });

    updateCargoMutation.mutate({ id: item.id, data: payload }, { onSuccess: () => onClose() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Cargo: ${item?.item_code || item?.id?.slice(-8)}`} wide>
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest border-b pb-1">
            Trip &amp; LR Linkage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Linked LR</label>
              <select
                className={INPUT_CLASS}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                disabled={!formData.trip}
              >
                <option value="">Select LR (optional)</option>
                {linkedOrders.map((o) => (
                  <option key={o.order_id} value={o.order_id}>
                    {o.lr_number || o.order_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 truncate">Trip (Locked)</label>
              <select
                required
                disabled
                className={`${INPUT_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`}
                value={formData.trip}
              >
                <option value="">Select a trip</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trip_number || t.id?.slice(-8)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Trip Stop</label>
              <select
                className={INPUT_CLASS}
                value={formData.trip_stop}
                onChange={(e) => setFormData({ ...formData, trip_stop: e.target.value })}
                disabled={!formData.trip}
              >
                <option value="">Select stop (optional)</option>
                {lrTripStops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    #{stop.stop_sequence} {stop.stop_type} - {stop.location_address || 'No location'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {formData.order && (
          <>
            <LRContextPanel order={orderDetail} lrNumber={lrNumber} isLoading={orderLoading} />
            <ExistingLRCargoList items={existingLrItems} isLoading={lrCargoLoading} lrNumber={lrNumber} />
          </>
        )}

        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Item Details</h3>
          <div className="grid grid-cols-12 gap-2 items-center">
            <input
              className={`${INPUT_CLASS} col-span-12 md:col-span-2`}
              placeholder="Item code"
              value={formData.item_code}
              onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
            />
            <input
              className={`${INPUT_CLASS} col-span-12 md:col-span-5`}
              placeholder="Description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <input
              type="number"
              min="1"
              required
              disabled={totalLoadQty > 0}
              className={`${INPUT_CLASS} col-span-6 md:col-span-2`}
              value={totalLoadQty > 0 ? totalLoadQty : formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <select
              className={`${INPUT_CLASS} col-span-6 md:col-span-3`}
              value={formData.commodity_type}
              onChange={(e) => setFormData({ ...formData, commodity_type: e.target.value })}
            >
              {COMMODITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          {totalLoadQty > 0 && (
            <p className="text-[11px] text-blue-600">Quantity auto-calculated from stop load quantities.</p>
          )}
        </div>

        <StopAllocationSection
          tripStops={lrTripStops}
          stopQuantities={stopQuantities}
          setStopQuantities={setStopQuantities}
          totalLoadQty={totalLoadQty}
          totalUnloadQty={totalUnloadQty}
        />

        <SharedSpecsFields
          shared={formData}
          setShared={setFormData}
          commodityType={formData.commodity_type}
        />
        <HandlingFields shared={formData} setShared={setFormData} />

        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Created At</p>
            <p className="text-[11px] text-gray-500 italic">
              {item?.created_at ? formatDateTime(item.created_at) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Last Updated</p>
            <p className="text-[11px] text-gray-500 italic">
              {item?.updated_at ? formatDateTime(item.updated_at) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateCargoMutation.isPending}
            className="px-6 py-2.5 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] shadow-md shadow-blue-200 disabled:opacity-50 font-bold transition-all"
          >
            {updateCargoMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ViewCargoModal({ isOpen, onClose, item }) {
  const tripId = item?.trip || item?.trip_id;
  const orderId = item?.order || item?.order_id;
  const { data: trip } = useTripDetail(tripId);
  const { data: order, isLoading: isOrderLoading } = useOrderDetail(orderId || trip?.order || trip?.order_id);

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cargo & Order Details" wide>
      <div className="space-y-6">
        {(orderId || trip?.order_id) && (
          <div className="bg-[#4a6cf7]/5 border border-[#4a6cf7]/10 p-4 rounded-xl">
            <h4 className="text-[10px] font-bold text-[#4a6cf7] uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Layers size={12} /> Parent Order (LR) Context
            </h4>
            {order ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase">LR Number</p>
                  <p className="text-sm font-bold text-gray-800">{order.lr_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium uppercase">Pickup / Delivery</p>
                  <p className="text-xs text-gray-700">
                    {order.pickup_date ? formatDate(order.pickup_date) : '—'} → {order.delivery_date ? formatDate(order.delivery_date) : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">{isOrderLoading ? 'Fetching order details...' : 'No LR linked'}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Item Code</p>
            <p className="font-semibold text-gray-800">{item.item_code || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Linked LR</p>
            <p className="text-xs font-black text-gray-600 uppercase italic">{order?.lr_number || item.order || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Commodity</p>
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${CARGO_TYPE_COLORS[item.commodity_type] || CARGO_TYPE_COLORS.GENERAL}`}
            >
              {item.commodity_type || 'GENERAL'}
            </span>
          </div>
          <div className="col-span-2 md:col-span-3 pb-2 border-b border-gray-200">
            <p className="text-gray-400 font-bold mb-1 text-[10px] uppercase tracking-wider">Description</p>
            <p className="font-semibold text-gray-800">{item.description || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Package Type</p>
            <p className="font-semibold text-gray-800">{item.package_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Quantity</p>
            <p className="font-semibold text-gray-800">{item.quantity || 1}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Weight (kg)</p>
            <p className="font-semibold text-gray-900">{item.weight_kg ? `${item.weight_kg} kg` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Volume (cbm)</p>
            <p className="font-semibold text-gray-900">{item.volume_cbm ? `${item.volume_cbm} m³` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Dimensions</p>
            <p className="font-semibold text-gray-900">
              {item.length_cm ? `${item.length_cm}x${item.width_cm}x${item.height_cm} cm` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Orientation</p>
            <p className="font-semibold text-gray-900">{item.orientation || 'NA'}</p>
          </div>
          {item.commodity_type === 'HAZARDOUS' && (
            <div>
              <p className="text-red-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Hzrd. Class</p>
              <p className="font-bold text-red-600">{item.hazardous_class || 'N/A'}</p>
            </div>
          )}
          {item.is_perishable && (
            <div>
              <p className="text-teal-500 font-bold mb-1 text-[10px] uppercase tracking-wider">Temp Range</p>
              <p className="font-bold text-teal-600">{item.temperature_range || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 text-center">
          <div>
            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">Remaining</p>
            <p className="text-xs font-black text-blue-700">{item.remaining_quantity ?? '—'}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Loaded</p>
            <p className="text-xs font-black text-gray-600">{item.total_loaded ?? 0}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Unloaded</p>
            <p className="text-xs font-black text-gray-600">{item.total_unloaded ?? 0}</p>
          </div>
          <div>
            <p className="text-[9px] text-amber-500 font-bold uppercase tracking-tight">Short/Damaged</p>
            <p className="text-xs font-black text-amber-700">{(item.total_short ?? 0) + (item.total_damaged ?? 0)}</p>
          </div>
        </div>

        {Array.isArray(item.stop_quantities) && item.stop_quantities.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Planned Stop Quantities</p>
            <div className="space-y-1">
              {item.stop_quantities.map((row, idx) => (
                <p key={`${row.stop_id}-${idx}`} className="text-xs text-gray-700">
                  Stop {String(row.stop_id).slice(0, 8)}... :
                  <span className="font-bold"> L {row.load_quantity ?? row.quantity ?? 0}</span>
                  <span className="font-bold"> / U {row.unload_quantity ?? 0}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {item.is_fragile && (
            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100 uppercase">
              FRAGILE
            </span>
          )}
          {item.is_perishable && (
            <span className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold rounded border border-teal-100 uppercase">
              PERISHABLE
            </span>
          )}
          {item.stackable && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 uppercase">
              STACKABLE
            </span>
          )}
          {item.insurance_required && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100 uppercase">
              INSURED
            </span>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] text-sm font-bold shadow-md shadow-blue-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
