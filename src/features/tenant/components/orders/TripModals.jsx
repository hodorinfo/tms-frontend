import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Truck, User, MapPin, Calendar, FileText, Hash, Receipt, ArrowRight, Activity, DollarSign, Gauge, Clock, ShieldCheck, AlertCircle, Info, ChevronRight, Search, CheckCircle2, ChevronLeft, Save, Circle, GripVertical, Trash2, Package } from 'lucide-react';
import {
  useCreateTrip,
  useUpdateTrip,
  useTripDetail,
  useOrders,
  useTripCargoItems,
  useTripStops,
  useCreateTripStop,
  useTrips,
  orderKeys,
} from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';
import { tripsApi, ordersApi } from '../../api/orders/ordersEndpoint';
import LRTabStrip from './trip/LRTabStrip';
import ScopeBadge from './trip/ScopeBadge';
import { formatDate, toInputDate } from '@/utils/dateFormat';

/** Normalize API date values for &lt;input type="date"&gt; (yyyy-MM-dd). */
const normalizeTripDateFields = (trip = {}) => ({
  created_date: toInputDate(trip.created_date) || new Date().toISOString().split('T')[0],
  scheduled_pickup_date: toInputDate(trip.scheduled_pickup_date) || null,
  scheduled_delivery_date: toInputDate(trip.scheduled_delivery_date) || null,
  actual_pickup_date: toInputDate(trip.actual_pickup_date) || null,
  actual_delivery_date: toInputDate(trip.actual_delivery_date) || null,
  payment_received_date: toInputDate(trip.payment_received_date) || null,
  pod_received_date: toInputDate(trip.pod_received_date) || null,
});

const formatLabel = (str) => {
  if (!str) return "";
  // Remove _id or _code suffix for cleaner labels
  const cleanStr = str.replace(/_id$/i, '').replace(/_code$/i, '');
  return cleanStr
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const GroupHeader = ({ title }) => (
  <div className="bg-gray-50/80 px-4 py-2 border-x border-t border-gray-200 first:rounded-t-2xl mt-6 first:mt-0">
    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</h3>
  </div>
);

const MetricsRow = ({ label, children, suffix, helpText }) => (
  <div className="flex border-x border-b border-gray-200 last:rounded-b-2xl overflow-hidden group">
    <div className="w-[35%] bg-gray-50/30 px-5 py-3 border-r border-gray-100 flex items-center transition-colors group-hover:bg-blue-50/30">
      <label className="text-xs font-bold text-gray-600 group-hover:text-[#4a6cf7] transition-colors">{formatLabel(label)}</label>
    </div>
    <div className="w-[65%] px-5 py-2 flex items-center gap-4 bg-white transition-colors group-hover:bg-blue-50/10">
      <div className="flex-1">{children}</div>
      {suffix && <span className="text-[10px] font-black text-gray-400 uppercase w-10 text-right">{suffix}</span>}
      {helpText && <span className="text-[10px] font-medium text-gray-400 italic hidden sm:block whitespace-nowrap">{helpText}</span>}
    </div>
  </div>
);

// --- Base Modal Component ---
const Modal = ({ isOpen, onClose, title, subtitle, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-[10px] font-medium text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Exact Re-Standardized UI Components ---

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
    <Icon size={14} className="text-gray-500" />
    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</h3>
  </div>
);

const FieldGroup = ({ label, children, required, error }) => (
  <div className="flex flex-col">
    <label className="block text-gray-700 font-medium mb-1 capitalize">
      {formatLabel(label)}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <span className="text-[10px] text-red-500 font-bold mt-1 animate-in fade-in slide-in-from-top-1">{error}</span>}
  </div>
);

const StatusBadge = ({ status }) => {
  const configs = {
    CREATED: 'bg-blue-50 text-blue-700 border-blue-100',
    ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    DISPATCHED: 'bg-amber-50 text-amber-700 border-amber-100',
    IN_TRANSIT: 'bg-teal-50 text-teal-700 border-teal-100',
    DELAYED: 'bg-orange-50 text-orange-700 border-orange-100',
    ARRIVED: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    COMPLETED: 'bg-green-50 text-green-700 border-green-100',
    DELIVERED: 'bg-green-50 text-green-700 border-green-100',
    CANCELLED: 'bg-red-50 text-red-700 border-red-100',
  };
  const config = configs[status] || 'bg-gray-50 text-gray-700 border-gray-100';
  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${config}`}>
      {status}
    </span>
  );
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

// --- Modals ---

export function CreateTripModal({ isOpen, onClose, orderId, orderNumber }) {
  const createTripMutation = useCreateTrip();
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];
  const { data: vehicleTypesData } = useVehicleTypes({ page_size: 200 });
  const vehicleTypes = vehicleTypesData?.results || [];
  const { data: ordersData } = useOrders({ page_size: 100 });
  const ordersDataResults = ordersData?.results || [];
  const orders = useMemo(() => ordersDataResults.filter(o => 
    ['DRAFT', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status)
  ), [ordersDataResults]);

  // Availability tracking for drivers and vehicles
  const { data: allTripsData } = useTrips({ page_size: 1000 });
  const allTrips = allTripsData?.results || [];
  const activeTrips = useMemo(() => 
    allTrips.filter(t => !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(t.status)),
    [allTrips]
  );

  const busyDrivers = useMemo(() => {
    const map = {};
    activeTrips.forEach(t => {
      if (t.primary_driver_id) map[String(t.primary_driver_id)] = t.trip_number;
      if (t.alternate_driver_id) map[String(t.alternate_driver_id)] = t.trip_number;
    });
    return map;
  }, [activeTrips]);

  const busyVehicles = useMemo(() => {
    const map = {};
    activeTrips.forEach(t => {
      if (t.primary_vehicle_id) map[String(t.primary_vehicle_id)] = t.trip_number;
      if (t.alternate_vehicle_id) map[String(t.alternate_vehicle_id)] = t.trip_number;
    });
    return map;
  }, [activeTrips]);

  const [formData, setFormData] = useState({
    order_ids: orderId ? [orderId] : [], primary_driver_id: null, primary_vehicle_id: null, 
    alternate_driver_id: null, alternate_vehicle_id: null,
    lr_number: "", reference_number: "", trip_type: "FTL", status: "CREATED",
    origin_address: "", destination_address: "", 
    scheduled_pickup_date: null, scheduled_delivery_date: null,
    total_freight_charge: "", total_accessorial_charge: "", total_tax: "",
    start_odometer_km: "", remarks: ""
  });

  // Auto-fill logic for LR Number
  const handleOrdersChange = (selectedIds) => {
    const selected = orders.filter(o => selectedIds.includes(o.id));
    const firstOrder = selected[0];
    const lastOrder = selected[selected.length - 1] || firstOrder;
    const lrList = selected.map(o => o.lr_number).filter(Boolean).join(', ');
    const pickup = firstOrder ? toInputDate(firstOrder.pickup_date) : null;
    const delivery = lastOrder ? toInputDate(lastOrder.delivery_date) : null;
    setFormData(prev => ({
      ...prev,
      order_ids: selectedIds,
      lr_number: lrList,
      reference_number: firstOrder ? (firstOrder.reference_number || prev.reference_number || '') : prev.reference_number,
      trip_type: firstOrder ? (firstOrder.order_type || prev.trip_type || "FTL") : prev.trip_type,
      status: firstOrder ? 'ASSIGNED' : (prev.status || 'CREATED'),
      origin_address: firstOrder ? (firstOrder.consignor_address || prev.origin_address || '') : prev.origin_address,
      destination_address: lastOrder ? (lastOrder.consignee_address || prev.destination_address || '') : prev.destination_address,
      vehicle_type_code: firstOrder ? (firstOrder.vehicle_type_preference || prev.vehicle_type_code || '') : prev.vehicle_type_code,
      scheduled_pickup_date: pickup || prev.scheduled_pickup_date || null,
      scheduled_delivery_date: delivery || prev.scheduled_delivery_date || null,
    }));
  };

  const selectedOrders = useMemo(() => {
    return orders.filter(o => formData.order_ids?.includes(o.id));
  }, [orders, formData.order_ids]);

  const displaySubtitle = selectedOrders.length
    ? `Orders: ${selectedOrders.map(o => o.lr_number).join(', ')}` 
    : (orderNumber ? `Order: ${orderNumber} · FTL · Assigned` : "Standalone Trip Planning");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.order_ids?.length) {
       alert("Please link at least one order to this trip.");
       return;
    }
    // Clean payload: UUIDs and Dates must be null if empty to pass backend validation
    const cleanData = {
      ...formData,
      order_ids: formData.order_ids || [],
      order_id: formData.order_ids?.[0] || null,
      primary_driver_id: formData.primary_driver_id || null,
      primary_vehicle_id: formData.primary_vehicle_id || null,
      alternate_driver_id: formData.alternate_driver_id || null,
      alternate_vehicle_id: formData.alternate_vehicle_id || null,
      scheduled_pickup_date: formData.scheduled_pickup_date || null,
      scheduled_delivery_date: formData.scheduled_delivery_date || null,
    };
    // Let backend defaults apply when finance fields are untouched.
    ['total_freight_charge', 'total_accessorial_charge', 'total_tax'].forEach((key) => {
      if (cleanData[key] === '' || cleanData[key] === null) {
        delete cleanData[key];
      }
    });
    createTripMutation.mutate(cleanData, { 
      onSuccess: () => {
        onClose();
      },
      onError: (err) => {
        console.error("Trip creation failed:", err);
      }
    });
  };

  // Standard input class for consistency across all inputs
  const inputClass = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a6cf7] outline-none transition-all";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new trip" subtitle={displaySubtitle}>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* BASIC INFORMATION */}
        <div className="space-y-4">
           <SectionHeader icon={FileText} title="Basic information" />
           <div className="grid grid-cols-1 gap-4">
              <FieldGroup label="Link to order" required>
                 <select
                   multiple
                   className={inputClass}
                   value={formData.order_ids || []}
                   onChange={e => {
                     const values = Array.from(e.target.selectedOptions).map(option => option.value);
                     handleOrdersChange(values);
                   }}
                 >
                    {orders.map(o => <option key={o.id} value={o.id}>{o.lr_number} ({o.status})</option>)}
                 </select>
              </FieldGroup>
           </div>
           <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="Trip type" required>
                 <select className={inputClass} value={formData.trip_type} onChange={e => setFormData({ ...formData, trip_type: e.target.value })}>
                    <option value="FTL">FTL — Full Truck Load</option><option value="LTL">LTL — Less than Truck Load</option><option value="CONTAINER">CONTAINER</option><option value="COURIER">COURIER</option><option value="MULTI_DROP">MULTI DROP</option>
                 </select>
              </FieldGroup>
              <FieldGroup label="LR number">
                 <input type="text" className={inputClass} placeholder="Auto-filled from order" value={formData.lr_number} onChange={e => setFormData({ ...formData, lr_number: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Reference number">
                 <input type="text" className={inputClass} placeholder="PO / Invoice / Ref" value={formData.reference_number} onChange={e => setFormData({ ...formData, reference_number: e.target.value })} />
              </FieldGroup>
           </div>
        </div>

        {/* DRIVER & VEHICLE */}
        <div className="space-y-4">
           <SectionHeader icon={Truck} title="Driver & vehicle" />
           <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Primary driver">
                 <select className={inputClass} value={formData.primary_driver_id || ""} onChange={e => setFormData({ ...formData, primary_driver_id: e.target.value })}>
                    <option value="">Select Driver</option>
                    {drivers.map(d => {
                       const tripNum = busyDrivers[String(d.id)];
                       const isDisabled = String(formData.alternate_driver_id) === String(d.id) || !!tripNum;
                       return (
                         <option key={d.id} value={d.id} disabled={isDisabled}>
                           {d.user?.first_name} {d.user?.last_name} {tripNum ? `(On Trip: ${tripNum})` : ''}
                         </option>
                       );
                    })}
                 </select>
              </FieldGroup>
              <FieldGroup label="Primary vehicle">
                  <select className={inputClass} value={formData.primary_vehicle_id || ""} onChange={e => {
                    const val = e.target.value;
                    const selectedVehicle = vehicles.find(v => String(v.id) === String(val));
                    setFormData(prev => ({ 
                      ...prev, 
                      primary_vehicle_id: val,
                      vehicle_number: selectedVehicle?.registration_number || prev.vehicle_number,
                      vehicle_type_code: selectedVehicle?.vehicle_type?.type_code || selectedVehicle?.vehicle_type_code || prev.vehicle_type_code,
                      vehicle_owner_name: selectedVehicle?.owner_name || prev.vehicle_owner_name
                    }));
                  }}>
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => {
                       const tripNum = busyVehicles[String(v.id)];
                       const isDisabled = String(formData.alternate_vehicle_id) === String(v.id) || !!tripNum;
                       return (
                         <option key={v.id} value={v.id} disabled={isDisabled}>
                           {v.registration_number} {tripNum ? `(On Trip: ${tripNum})` : ''}
                         </option>
                       );
                    })}
                 </select>
              </FieldGroup>
              <FieldGroup label="Alternate driver">
                 <select className={inputClass} value={formData.alternate_driver_id || ""} onChange={e => setFormData({ ...formData, alternate_driver_id: e.target.value })}>
                    <option value="">No alternate driver</option>
                    {drivers.map(d => {
                       const tripNum = busyDrivers[String(d.id)];
                       const isDisabled = String(formData.primary_driver_id) === String(d.id) || !!tripNum;
                       return (
                         <option key={d.id} value={d.id} disabled={isDisabled}>
                           {d.user?.first_name} {d.user?.last_name} {tripNum ? `(On Trip: ${tripNum})` : ''}
                         </option>
                       );
                    })}
                 </select>
              </FieldGroup>
              <FieldGroup label="Alternate vehicle">
                 <select className={inputClass} value={formData.alternate_vehicle_id || ""} onChange={e => setFormData({ ...formData, alternate_vehicle_id: e.target.value })}>
                    <option value="">No alternate vehicle</option>
                    {vehicles.map(v => {
                       const tripNum = busyVehicles[String(v.id)];
                       const isDisabled = String(formData.primary_vehicle_id) === String(v.id) || !!tripNum;
                       return (
                         <option key={v.id} value={v.id} disabled={isDisabled}>
                           {v.registration_number} {tripNum ? `(On Trip: ${tripNum})` : ''}
                         </option>
                       );
                    })}
                 </select>
              </FieldGroup>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <FieldGroup label="Vehicle type">
               <select className={inputClass} value={formData.vehicle_type_code || ""} onChange={e => setFormData({ ...formData, vehicle_type_code: e.target.value })}>
                 <option value="">Select vehicle type</option>
                 {vehicleTypes.map(vt => <option key={vt.id} value={vt.type_code}>{vt.type_code} - {vt.type_name}</option>)}
               </select>
             </FieldGroup>
           </div>
        </div>

        {/* SCHEDULE */}
        <div className="space-y-4">
           <SectionHeader icon={Calendar} title="Schedule" />
           {selectedOrders.length > 0 && (
             <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
               LR window: pickup {formatDate(selectedOrders[0]?.pickup_date)} · delivery {formatDate(selectedOrders[selectedOrders.length - 1]?.delivery_date)}
             </p>
           )}
           <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Scheduled pickup">
                 <input
                   type="date"
                   className={inputClass}
                   min={selectedOrders[0] ? toInputDate(selectedOrders[0].pickup_date) || undefined : undefined}
                   max={selectedOrders[selectedOrders.length - 1] ? toInputDate(selectedOrders[selectedOrders.length - 1].delivery_date) || undefined : undefined}
                   value={formData.scheduled_pickup_date || ""}
                   onChange={e => setFormData({ ...formData, scheduled_pickup_date: e.target.value })}
                 />
                 {selectedOrders[0]?.pickup_date && (
                   <p className="text-[10px] text-gray-500 mt-1">Earliest: {formatDate(selectedOrders[0].pickup_date)}</p>
                 )}
              </FieldGroup>
              <FieldGroup label="Scheduled delivery">
                 <input
                   type="date"
                   className={inputClass}
                   min={formData.scheduled_pickup_date || (selectedOrders[0] ? toInputDate(selectedOrders[0].pickup_date) : undefined) || undefined}
                   max={selectedOrders[selectedOrders.length - 1] ? toInputDate(selectedOrders[selectedOrders.length - 1].delivery_date) || undefined : undefined}
                   value={formData.scheduled_delivery_date || ""}
                   onChange={e => setFormData({ ...formData, scheduled_delivery_date: e.target.value })}
                 />
                 {selectedOrders[selectedOrders.length - 1]?.delivery_date && (
                   <p className="text-[10px] text-gray-500 mt-1">Latest: {formatDate(selectedOrders[selectedOrders.length - 1].delivery_date)}</p>
                 )}
              </FieldGroup>
           </div>
        </div>

        {/* ROUTE ADDRESSES */}
        <div className="space-y-4">
           <SectionHeader icon={MapPin} title="Route addresses" />
           <div className="space-y-4">
              <FieldGroup label="Origin address">
                 <textarea rows="2" className={`${inputClass} p-2`} placeholder="Mumbai Warehouse" value={formData.origin_address} onChange={e => setFormData({ ...formData, origin_address: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Destination address">
                 <textarea rows="2" className={`${inputClass} p-2`} placeholder="Gurugram DC" value={formData.destination_address} onChange={e => setFormData({ ...formData, destination_address: e.target.value })} />
              </FieldGroup>
           </div>
        </div>

        {/* DISTANCE & FUEL */}
        <div className="space-y-4">
           <SectionHeader icon={Gauge} title="Distance & fuel" />
           <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="Total distance (km)"><input type="number" className={inputClass} placeholder="e.g. 1450" /></FieldGroup>
              <FieldGroup label="Est. fuel (liters)"><input type="text" readOnly className={`${inputClass} text-gray-400 italic`} placeholder="Auto-calculated" /></FieldGroup>
              <FieldGroup label="Start odometer (km)"><input type="number" className={inputClass} placeholder="e.g. 45230" value={formData.start_odometer_km} onChange={e => setFormData({ ...formData, start_odometer_km: e.target.value })} /></FieldGroup>
           </div>
        </div>

        {/* CHARGES */}
        <div className="space-y-4">
           <SectionHeader icon={DollarSign} title="Charges" />
           <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="Freight (₹)"><input type="number" className={inputClass} placeholder="e.g. 45000" value={formData.total_freight_charge} onChange={e => setFormData({ ...formData, total_freight_charge: e.target.value })} /></FieldGroup>
              <FieldGroup label="Accessorial (₹)"><input type="number" className={inputClass} placeholder="e.g. 2500" value={formData.total_accessorial_charge} onChange={e => setFormData({ ...formData, total_accessorial_charge: e.target.value })} /></FieldGroup>
              <FieldGroup label="Tax (₹)"><input type="text" readOnly className={`${inputClass} text-gray-400 italic`} placeholder="Auto 18%" /></FieldGroup>
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
           <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
           <button type="submit" disabled={createTripMutation.isPending} className="px-4 py-2 text-white bg-[#4a6cf7] rounded-lg hover:bg-[#3b59d9] disabled:opacity-50 transition-all font-medium">
             {createTripMutation.isPending ? 'Syncing...' : 'Create Trip'}
           </button>
        </div>
      </form>
    </Modal>
  );
}

export function EditTripModal({ isOpen, onClose, trip }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [activeRouteOrderId, setActiveRouteOrderId] = useState(null);
  const updateTripMutation = useUpdateTrip();
  const createStopMutation = useCreateTripStop(trip?.id);

  const [formData, setFormData] = useState({
    order_id: "", order_ids: [], trip_number: "", lr_number: "", reference_number: "", trip_type: "FTL", status: "CREATED",
    primary_vehicle_id: null, vehicle_number: "", vehicle_type_code: "", vehicle_owner_name: "",
    primary_driver_id: null, alternate_vehicle_id: null, alternate_driver_id: null,
    origin_address: "", destination_address: "",
    created_date: new Date().toISOString().split('T')[0],
    scheduled_pickup_date: null, scheduled_delivery_date: null,
    actual_pickup_date: null, actual_delivery_date: null,
    start_time: null, end_time: null,
    total_distance_km: null, start_odometer_km: null, end_odometer_km: null,
    estimated_fuel_liters: null, actual_fuel_liters: null, fuel_rate_per_liter: null,
    damage_count: 0, damage_amount: "", pod_turnaround_days: null,
    booked_price: "", total_freight_charge: "", total_accessorial_charge: "", total_tax: "",
    tds_percentage: "", tds_amount: "", incentive_amount: "", late_fee: "",
    part_load_charge: "", broker_commission: "",
    total_bill_amount: "", payment_received_amount: "", payment_received_date: null,
    pod_received_date: null, is_billed: false, is_paid: false,
    remarks: "", version: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const hasErrors = Object.values(fieldErrors).some(err => err && err !== '');
  const [plannedStops, setPlannedStops] = useState([]);
  const [stopErrors, setStopErrors] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const [initialFormData, setInitialFormData] = useState(null);
  const [initialPlannedStops, setInitialPlannedStops] = useState([]);

  const steps = [
    { id: 1, name: 'General', icon: FileText },
    { id: 2, name: 'Fleet', icon: Truck },
    { id: 3, name: 'Route', icon: MapPin },
    { id: 4, name: 'Metrics', icon: Gauge },
    { id: 5, name: 'Finance', icon: DollarSign },
    { id: 6, name: 'Cargo', icon: Package },
    { id: 7, name: 'Review', icon: CheckCircle2 }
  ];

  // Queries for lookups
  const { data: ordersData } = useOrders({ page_size: 100 });
  const ordersDataResults = ordersData?.results || [];
  const orders = useMemo(() => ordersDataResults.filter(o => 
    ['DRAFT', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT'].includes(o.status) || String(o.id) === String(trip?.order_id)
  ), [ordersDataResults, trip?.order_id]);
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];
  const { data: vehicleTypesData } = useVehicleTypes({ page_size: 200 });
  const vehicleTypes = vehicleTypesData?.results || [];
  const { data: cargoData, isLoading: cargoLoading } = useTripCargoItems(
    trip?.id,
    { ordering: '-created_at' }
  );
  const cargoItems = cargoData?.results || [];
  const { data: tripStops, isLoading: stopsLoading } = useTripStops(trip?.id);
  const linkedOrdersForTrip = useMemo(() => {
    const ids = formData.order_ids?.length ? formData.order_ids : (formData.order_id ? [formData.order_id] : []);
    return ids
      .map(id => orders.find(o => String(o.id) === String(id)) || { id, lr_number: 'Unknown LR', order_type: 'NA' })
      .filter(Boolean);
  }, [orders, formData.order_ids, formData.order_id]);
  const financeOrderQueries = useQueries({
    queries: linkedOrdersForTrip.map((order) => ({
      queryKey: orderKeys.detail(order.id),
      queryFn: () => ordersApi.get(order.id),
      enabled: !!order?.id,
      staleTime: 60_000,
    })),
  });
  const financeOrderById = useMemo(
    () =>
      linkedOrdersForTrip.reduce((acc, order, index) => {
        acc[String(order.id)] = financeOrderQueries[index]?.data || order;
        return acc;
      }, {}),
    [linkedOrdersForTrip, financeOrderQueries]
  );
  const activeFinanceOrder = useMemo(
    () =>
      financeOrderById[String(activeRouteOrderId)] ||
      financeOrderById[String(linkedOrdersForTrip[0]?.id)] ||
      linkedOrdersForTrip[0] ||
      null,
    [financeOrderById, linkedOrdersForTrip, activeRouteOrderId]
  );

  // Availability tracking for drivers and vehicles
  const { data: allTripsData } = useTrips({ page_size: 1000 });
  const allTrips = allTripsData?.results || [];
  const activeTrips = useMemo(() => 
    allTrips.filter(t => !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(t.status) && String(t.id) !== String(trip?.id)),
    [allTrips, trip?.id]
  );

  const busyDrivers = useMemo(() => {
    const map = {};
    activeTrips.forEach(t => {
      if (t.primary_driver_id) map[String(t.primary_driver_id)] = t.trip_number;
      if (t.alternate_driver_id) map[String(t.alternate_driver_id)] = t.trip_number;
    });
    return map;
  }, [activeTrips]);

  const busyVehicles = useMemo(() => {
    const map = {};
    activeTrips.forEach(t => {
      if (t.primary_vehicle_id) map[String(t.primary_vehicle_id)] = t.trip_number;
      if (t.alternate_vehicle_id) map[String(t.alternate_vehicle_id)] = t.trip_number;
    });
    return map;
  }, [activeTrips]);
  const currentStatus = formData.status || trip?.status || 'CREATED';
  const statusOptions = [currentStatus, ...(TRIP_TRANSITIONS[currentStatus] || [])];

  useEffect(() => {
    if (trip && isOpen) {
      const data = {
        ...formData,
        ...trip,
        order_ids: trip.order_ids?.length ? trip.order_ids : (trip.order_id ? [trip.order_id] : []),
        ...normalizeTripDateFields(trip),
      };
      setFormData(data);
      setInitialFormData(data);
      
      // For simplification, we start with an empty planner in the EditTripModal.
      // Existing stops are managed via the external "STOPS" tab.
      setPlannedStops([]);
      setInitialPlannedStops([]);
      setCurrentStep(1);
      setIsDirty(false);
      setActiveRouteOrderId(
        (trip.order_ids && trip.order_ids.length ? trip.order_ids[0] : trip.order_id) || null
      );
    }
  }, [trip, isOpen]);

  useEffect(() => {
    if (!initialFormData) return;
    
    // Check formData changes
    const keys = Object.keys(formData);
    const formChanged = keys.some(key => {
      const initialValue = initialFormData[key];
      const currentValue = formData[key];
      if (initialValue === currentValue) return false;
      // Handle null vs empty string
      if ((initialValue === null || initialValue === "") && (currentValue === null || currentValue === "")) return false;
      // Handle numeric string comparison
      if (!isNaN(initialValue) && !isNaN(currentValue) && String(initialValue) !== "" && String(currentValue) !== "") {
        if (Number(initialValue) === Number(currentValue)) return false;
      }
      return true;
    });

    // Check plannedStops changes
    const stopsChanged = JSON.stringify(plannedStops) !== JSON.stringify(initialPlannedStops);

    setIsDirty(formChanged || stopsChanged);
  }, [formData, initialFormData, plannedStops, initialPlannedStops]);

  const validateField = (name, value, currentData) => {
    if (!name) return '';
    if (name === 'end_time') {
      const start = currentData.start_time;
      if (start && value && value < start) return 'End time cannot be before start time';
    }
    if (name === 'start_time') {
      const end = currentData.end_time;
      if (end && value && end < value) return 'Start time cannot be after end time';
    }
    if (name === 'scheduled_pickup_date' || name === 'scheduled_delivery_date') {
      const pickup = currentData.scheduled_pickup_date;
      const delivery = currentData.scheduled_delivery_date;
      if (pickup && delivery && delivery < pickup) return 'Scheduled delivery cannot be before scheduled pickup';
    }
    if (name === 'actual_pickup_date' || name === 'actual_delivery_date') {
      const pickup = currentData.actual_pickup_date;
      const delivery = currentData.actual_delivery_date;
      const today = new Date().toISOString().split('T')[0];
      
      if (pickup && pickup > today) return 'Actual pickup cannot be in the future';
      if (delivery && delivery > today) return 'Actual delivery cannot be in the future';
      if (pickup && delivery && delivery < pickup) return 'Actual delivery cannot be before actual pickup';
    }
    if (name === 'primary_vehicle_id' || name === 'alternate_vehicle_id') {
      const primary = currentData.primary_vehicle_id;
      const alternate = currentData.alternate_vehicle_id;
      if (primary && alternate && String(primary) === String(alternate)) return 'Primary and alternate vehicle must be different';
    }
    if (name === 'primary_driver_id' || name === 'alternate_driver_id') {
      const primary = currentData.primary_driver_id;
      const alternate = currentData.alternate_driver_id;
      if (primary && alternate && String(primary) === String(alternate)) return 'Primary and alternate driver must be different';
    }
    return '';
  };

  const isPickupType = (t) => t === 'PICKUP' || t === 'PICKUP_AND_DELIVERY';
  const isDeliveryType = (t) => t === 'DELIVERY' || t === 'PICKUP_AND_DELIVERY';

  const validateStops = (stops = plannedStops) => {
    // Collect all potential stops: Origin (PICKUP), then multi-stops, then Destination (DELIVERY)
    const allStops = [
      ...(formData.origin_address?.trim() ? [{ stop_type: 'PICKUP', location_address: formData.origin_address }] : []),
      ...stops.filter(s => s.location_address?.trim()),
      ...(formData.destination_address?.trim() ? [{ stop_type: 'DELIVERY', location_address: formData.destination_address }] : [])
    ].map((s, idx) => ({ ...s, idx }));

    const pickupIndices = allStops.filter((s) => isPickupType(s.stop_type)).map((s) => s.idx);
    const deliveryIndices = allStops.filter((s) => isDeliveryType(s.stop_type)).map((s) => s.idx);
    
    const errors = [];
    if (!pickupIndices.length) errors.push('Need at least one pickup (Origin or stop).');
    if (!deliveryIndices.length) errors.push('Need at least one delivery (Destination or stop).');
    if (allStops.length > 0 && allStops[0].stop_type !== 'PICKUP') {
      errors.push('First stop must be PICKUP.');
    }
    if (allStops.length > 0 && allStops[allStops.length - 1].stop_type !== 'DELIVERY') {
      errors.push('Last stop must be DELIVERY.');
    }
    
    if (pickupIndices.length && deliveryIndices.length) {
      if (Math.max(...pickupIndices) > Math.min(...deliveryIndices)) {
        errors.push('Last pickup cannot be after first delivery.');
      }
    }
    setStopErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    validateStops(plannedStops);
  }, [formData.origin_address, formData.destination_address, plannedStops]);

  const normalizeBoundaryStopTypes = (stops) => {
    if (!Array.isArray(stops) || stops.length === 0) return stops;
    return stops.map((s, i) => {
      if (i === 0) return { ...s, stop_type: 'PICKUP' };
      if (i === stops.length - 1) return { ...s, stop_type: 'DELIVERY' };
      return s;
    });
  };

  const addStopRow = () => {
    setPlannedStops((prev) => {
      const next = normalizeBoundaryStopTypes([
        ...prev,
        {
          stop_type: 'PICKUP_AND_DELIVERY',
          location_address: '',
          instructions: '',
          scheduled_arrival: '',
          scheduled_departure: '',
          order_id: activeRouteOrderId || formData.order_id || null,
        },
      ]);
      validateStops(next);
      return next;
    });
  };

  const removeStopRow = (index) => {
    setPlannedStops((prev) => {
      const next = normalizeBoundaryStopTypes(prev.filter((_, i) => i !== index));
      validateStops(next);
      return next;
    });
  };

  const updateStopRow = (index, key, value) => {
    setPlannedStops((prev) => {
      let next = prev.map((s, i) => (i === index ? { ...s, [key]: value } : s));
      
      // Bi-directional sync back to formData if origin (0) or destination (last) is updated
      if (key === 'location_address') {
        if (index === 0) {
          setFormData(f => ({ ...f, origin_address: value }));
        } else if (index === next.length - 1) {
          setFormData(f => ({ ...f, destination_address: value }));
        }
      }
      
      next = normalizeBoundaryStopTypes(next);
      validateStops(next);
      return next;
    });
  };

  const handleStopDragStart = (index) => setDragIdx(index);
  const handleStopDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIdx(index);
  };
  const handleStopDrop = (index) => {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setPlannedStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      const normalized = normalizeBoundaryStopTypes(next);
      validateStops(normalized);
      return normalized;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      const parseMoney = (v) => {
        const n = Number.parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };
      const hasValue = (v) => v !== '' && v !== null && v !== undefined;
      const deriveKeys = new Set([
        'booked_price',
        'tds_percentage',
        'total_freight_charge',
        'total_accessorial_charge',
        'total_tax',
      ]);
      if (deriveKeys.has(name)) {
        if (hasValue(next.booked_price) && hasValue(next.tds_percentage)) {
          next.tds_amount = ((parseMoney(next.booked_price) * parseMoney(next.tds_percentage)) / 100).toFixed(2);
        } else {
          next.tds_amount = '';
        }
        if (hasValue(next.total_freight_charge) || hasValue(next.total_accessorial_charge) || hasValue(next.total_tax)) {
          next.total_bill_amount = (
            parseMoney(next.total_freight_charge) +
            parseMoney(next.total_accessorial_charge) +
            parseMoney(next.total_tax)
          ).toFixed(2);
        } else {
          next.total_bill_amount = '';
        }
      }
      
      // Auto-fill vehicle details when primary_vehicle_id changes
      if (name === 'primary_vehicle_id' && value) {
        const selectedVehicle = vehicles.find(v => String(v.id) === String(value));
        if (selectedVehicle) {
          next.vehicle_number = selectedVehicle.registration_number || "";
          next.vehicle_type_code = selectedVehicle.vehicle_type?.type_code || selectedVehicle.vehicle_type_code || "";
          next.vehicle_owner_name = selectedVehicle.owner_name || "";
        }
      }

      // Sync address fields with plannedStops (Multi-stop Planner)
      if (name === 'origin_address') {
        setPlannedStops(stops => {
          const nextStops = [...stops];
          if (nextStops.length > 0) {
            nextStops[0] = { ...nextStops[0], location_address: value, stop_type: 'PICKUP' };
          } else {
            nextStops.push({ stop_type: 'PICKUP', location_address: value, instructions: '', scheduled_arrival: '', scheduled_departure: '' });
          }
          return nextStops;
        });
      } else if (name === 'destination_address') {
        setPlannedStops(stops => {
          const nextStops = [...stops];
          if (nextStops.length > 1) {
            nextStops[nextStops.length - 1] = { ...nextStops[nextStops.length - 1], location_address: value, stop_type: 'DELIVERY' };
          } else if (nextStops.length === 1) {
            nextStops.push({ stop_type: 'DELIVERY', location_address: value, instructions: '', scheduled_arrival: '', scheduled_departure: '' });
          } else {
             // If both are being added, destination should be second. But handled by origin first usually.
             nextStops.push({ stop_type: 'PICKUP', location_address: prev.origin_address || '', instructions: '', scheduled_arrival: '', scheduled_departure: '' });
             nextStops.push({ stop_type: 'DELIVERY', location_address: value, instructions: '', scheduled_arrival: '', scheduled_departure: '' });
          }
          return nextStops;
        });
      }

      const err = validateField(name, next[name], next);
      const startTimeErr = validateField('start_time', next.start_time, next);
      const endTimeErr = validateField('end_time', next.end_time, next);
      const scheduledDateErr = validateField('scheduled_delivery_date', next.scheduled_delivery_date, next);
      const actualDateErr = validateField('actual_delivery_date', next.actual_delivery_date, next);
      const vehiclePairErr = validateField('alternate_vehicle_id', next.alternate_vehicle_id, next);
      const driverPairErr = validateField('alternate_driver_id', next.alternate_driver_id, next);

      setFieldErrors(p => ({
        ...p,
        [name]: err,
        start_time: startTimeErr,
        end_time: endTimeErr,
        scheduled_delivery_date: scheduledDateErr,
        actual_delivery_date: actualDateErr,
        primary_vehicle_id: vehiclePairErr,
        alternate_vehicle_id: vehiclePairErr,
        primary_driver_id: driverPairErr,
        alternate_driver_id: driverPairErr
      }));

      return next;
    });
  };

  const handleOrderChange = (id) => {
    const order = orders.find(o => String(o.id) === String(id));
    setFormData(prev => ({
      ...prev,
      order_id: id,
      lr_number: order ? order.lr_number : "",
      reference_number: order ? (order.reference_number || prev.reference_number || '') : prev.reference_number,
      trip_type: order ? (order.order_type || prev.trip_type || "FTL") : prev.trip_type,
      status: order ? 'ASSIGNED' : (prev.status || 'CREATED'),
      origin_address: order ? (order.consignor_address || prev.origin_address || '') : prev.origin_address,
      destination_address: order ? (order.consignee_address || prev.destination_address || '') : prev.destination_address,
      vehicle_type_code: order ? (order.vehicle_type_preference || prev.vehicle_type_code || '') : prev.vehicle_type_code,
    }));
  };

  const handleNext = () => {
    if (hasErrors) return;
    if (currentStep === 3 && !validateStops()) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (hasErrors) return;
    if (currentStep === 3 && !validateStops()) return;
    
    const payload = {
      ...formData
    };
    
    // 1. Update the Trip itself
    updateTripMutation.mutate({ id: trip.id, data: payload }, {
      onSuccess: async () => {
        try {
          // 2. Only handle NEWLY ADDED stops in the planner
          const promises = [];

          const currentStopsCount = tripStops?.length || 0;

          plannedStops.forEach((stop, idx) => {
            const stopData = {
              ...stop,
              order_id: stop.order_id || activeRouteOrderId || null,
              stop_sequence: currentStopsCount + idx + 1,
              trip_id: trip.id
            };
            
            // Remove temp id if present
            const finalStopData = { ...stopData };
            delete finalStopData.id;

            promises.push(createStopMutation.mutateAsync(finalStopData));
          });

          if (promises.length > 0) {
            await Promise.all(promises);
          }
          
          onClose();
        } catch (error) {
          console.error("Error creating new stops:", error);
          toast.error("Trip updated, but some new stops failed to save.");
        }
      }
    });
  };

  if (!isOpen) return null;

  const inputClass = "w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-blue-500 transition-all";

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Edit Trip</h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">#{formData.trip_number}</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Horizontal Stepper */}
        <div className="px-8 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 -z-0"></div>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                  <div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border-2 ${
                      isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      'bg-white border-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50">
          <form id="edit-trip-form-list" onSubmit={handleUpdate} className="space-y-6">
            
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100/50"><FileText size={24} /></div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">General Information</h2>
                  <ScopeBadge variant="lr" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <FieldGroup label="linked orders">
                    <div className="flex flex-wrap gap-2">
                      {linkedOrdersForTrip.map(order => (
                        <button
                          key={order.id}
                          type="button"
                          className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100"
                          onClick={() => navigate(`/tenant/dashboard/orders/${order.id}`)}
                        >
                          {order.lr_number} ({order.order_type || 'NA'})
                        </button>
                      ))}
                    </div>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <FieldGroup label="lr_number">
                    <div className="space-y-1.5">
                      <input type="text" name="lr_number" className={inputClass} value={formData.lr_number || ""} placeholder="Auto-filled" disabled readOnly />
                      {formData.order_id && (
                        <button
                          type="button"
                          className="text-[11px] font-bold text-[#0052CC] hover:underline"
                          onClick={() => navigate(`/tenant/dashboard/orders/${formData.order_id}`)}
                        >
                          View Order
                        </button>
                      )}
                    </div>
                  </FieldGroup>
                  <FieldGroup label="reference_number">
                    {formData.order_id ? (
                      <div className="space-y-1.5">
                        <input type="text" name="reference_number" className={inputClass} value={formData.reference_number || ""} placeholder="PO-12345" disabled readOnly />
                        <button
                          type="button"
                          className="text-[11px] font-bold text-[#0052CC] hover:underline"
                          onClick={() => navigate(`/tenant/dashboard/orders/${formData.order_id}`)}
                        >
                          Edit on Order
                        </button>
                      </div>
                    ) : (
                      <input type="text" name="reference_number" className={inputClass} value={formData.reference_number || ""} onChange={handleInputChange} placeholder="PO-12345" />
                    )}
                  </FieldGroup>
                  <FieldGroup label="trip_type">
                    <select name="trip_type" className={inputClass} value={formData.trip_type || ""} onChange={handleInputChange}>
                      <option value="FTL">FTL</option>
                      <option value="LTL">LTL</option>
                      <option value="CONTAINER">CONTAINER</option>
                      <option value="COURIER">COURIER</option>
                      <option value="MULTI_DROP">MULTI DROP</option>
                    </select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <FieldGroup label="status">
                    <select name="status" className={inputClass} value={formData.status || ""} onChange={handleInputChange}>
                      {statusOptions.map((status, idx) => (
                        <option key={status} value={status} disabled={idx === 0}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="created_date">
                    <input type="date" name="created_date" className={inputClass} value={formData.created_date || ""} onChange={handleInputChange} disabled readOnly />
                  </FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100/50"><Truck size={24} /></div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Fleet & Team Allocation</h2>
                  <ScopeBadge variant="trip" />
                </div>
                <p className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 inline-block">Applies to all linked LRs</p>
                <div className="grid grid-cols-2 gap-6">
                  <FieldGroup label="Primary vehicle">
                    <select className={inputClass} value={formData.primary_vehicle_id || ""} onChange={e => {
                      const val = e.target.value;
                      const selectedVehicle = vehicles.find(v => String(v.id) === String(val));
                      setFormData(prev => ({ 
                        ...prev, 
                        primary_vehicle_id: val,
                        vehicle_number: selectedVehicle?.registration_number || prev.vehicle_number,
                        vehicle_type_code: selectedVehicle?.vehicle_type?.type_code || selectedVehicle?.vehicle_type_code || prev.vehicle_type_code,
                        vehicle_owner_name: selectedVehicle?.owner_name || prev.vehicle_owner_name
                      }));
                    }}>
                       <option value="">Select Vehicle</option>
                       {vehicles.map(v => {
                          const tripNum = busyVehicles[String(v.id)];
                          const isDisabled = String(formData.alternate_vehicle_id) === String(v.id) || !!tripNum;
                          return (
                            <option key={v.id} value={v.id} disabled={isDisabled}>
                              {v.registration_number} {tripNum ? `(On Trip: ${tripNum})` : ''}
                            </option>
                          );
                       })}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="primary_driver_id">
                    <select name="primary_driver_id" className={inputClass} value={formData.primary_driver_id || ""} onChange={handleInputChange}>
                      <option value="">Select Primary Driver</option>
                      {drivers.map(d => {
                        const tripNum = busyDrivers[String(d.id)];
                        const isDisabled = String(formData.alternate_driver_id) === String(d.id) || !!tripNum;
                        return (
                          <option key={d.id} value={d.id} disabled={isDisabled}>
                            {d.user?.first_name} {d.user?.last_name} {tripNum ? `(On Trip: ${tripNum})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                  <FieldGroup label="alternate_vehicle_id">
                    <select name="alternate_vehicle_id" className={inputClass} value={formData.alternate_vehicle_id || ""} onChange={handleInputChange}>
                      <option value="">None</option>
                      {vehicles
                        .filter(v => String(formData.primary_vehicle_id) !== String(v.id))
                        .map(v => {
                          const tripNum = busyVehicles[String(v.id)];
                          return (
                            <option key={v.id} value={v.id} disabled={!!tripNum}>
                              {v.registration_number} {tripNum ? `(On Trip: ${tripNum})` : ''}
                            </option>
                          );
                        })}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="alternate_driver_id">
                    <select name="alternate_driver_id" className={inputClass} value={formData.alternate_driver_id || ""} onChange={handleInputChange}>
                      <option value="">None</option>
                      {drivers
                        .filter(d => String(formData.primary_driver_id) !== String(d.id))
                        .map(d => {
                          const tripNum = busyDrivers[String(d.id)];
                          return (
                            <option key={d.id} value={d.id} disabled={!!tripNum}>
                              {d.user?.first_name} {d.user?.last_name} {tripNum ? `(On Trip: ${tripNum})` : ''}
                            </option>
                          );
                        })}
                    </select>
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <FieldGroup label="vehicle_number"><input type="text" name="vehicle_number" className={inputClass} value={formData.vehicle_number || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="vehicle_type_code">
                    <select name="vehicle_type_code" className={inputClass} value={formData.vehicle_type_code || ""} onChange={handleInputChange}>
                      <option value="">Select Vehicle Type</option>
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.type_code}>{vt.type_code} - {vt.type_name}</option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="vehicle_owner_name"><input type="text" name="vehicle_owner_name" className={inputClass} value={formData.vehicle_owner_name || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100/50"><MapPin size={24} /></div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Route & Schedule</h2>
                  <ScopeBadge variant="lr" />
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 flex gap-6 relative overflow-hidden group mb-8">
                  {/* Visual Journey Line */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10 w-6 pt-7">
                    <div className="w-5 h-5 rounded-full bg-[#4a6cf7] border-4 border-white shadow-sm flex items-center justify-center text-[9px] text-white font-black shrink-0">1</div>
                    <div className="flex-1 w-0.5 border-l-2 border-dashed border-gray-200 my-1"></div>
                    <div className="w-5 h-5 rounded-full bg-[#10b981] border-4 border-white shadow-sm flex items-center justify-center text-[9px] text-white font-black shrink-0">2</div>
                  </div>

                  {/* Input Stack */}
                  <div className="flex-1 space-y-10">
                    <div className="relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-6 left-0 flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-[#4a6cf7] border-2 border-white shadow-sm" /> Origin address
                      </label>
                      <textarea 
                        name="origin_address" 
                        rows="2" 
                        className={`${inputClass} !bg-white focus:shadow-lg focus:shadow-blue-50/50 transition-all !resize-none`} 
                        value={formData.origin_address || ""} 
                        onChange={handleInputChange} 
                        placeholder="Enter starting point..." 
                      />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-6 left-0 flex items-center gap-4">
                        <MapPin size={10} className="text-[#10b981]" /> Destination address
                      </label>
                      <textarea 
                        name="destination_address" 
                        rows="2" 
                        className={`${inputClass} !bg-white focus:shadow-lg focus:shadow-emerald-50/50 transition-all !resize-none`} 
                        value={formData.destination_address || ""} 
                        onChange={handleInputChange} 
                        placeholder="Enter drop-off point..." 
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40 mt-6">
                  <div className="mb-4">
                    <LRTabStrip
                      linkedOrders={linkedOrdersForTrip.map((order) => ({ order_id: order.id, lr_number: order.lr_number }))}
                      activeOrderId={activeRouteOrderId}
                      onChange={setActiveRouteOrderId}
                    />
                  </div>
                  <div className={`mb-4 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    stopErrors.length
                      ? 'border-red-200 bg-red-50 text-red-700 animate-pulse'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}>
                    {stopErrors.length
                      ? stopErrors.join(' ')
                      : 'Stop sequence valid: at least one pickup and one delivery in the correct order.'}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700">Multi-stop Planner</h3>
                    <button type="button" onClick={addStopRow} className="text-xs font-bold text-[#4a6cf7] underline">+ Add Stop</button>
                  </div>
                  <div className="space-y-3">
                    {plannedStops.map((stop, idx) => (
                      <div
                        key={`stop-${idx}`}
                        className={`grid grid-cols-12 gap-2 items-end bg-white border rounded-lg p-3 transition-all duration-200 ${
                          dragOverIdx === idx ? 'border-blue-300 shadow-md' : 'border-gray-200'
                        }`}
                        onDragOver={(e) => handleStopDragOver(e, idx)}
                        onDrop={() => handleStopDrop(idx)}
                      >
                        <div
                          className="col-span-1 flex items-center justify-center cursor-grab text-gray-400"
                          draggable
                          onDragStart={() => handleStopDragStart(idx)}
                          onDragEnd={() => {
                            setDragIdx(null);
                            setDragOverIdx(null);
                          }}
                        >
                          <GripVertical size={16} />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                          <select
                            className={inputClass}
                            value={stop.stop_type}
                            disabled={idx === 0 || idx === plannedStops.length - 1}
                            onChange={(e) => updateStopRow(idx, 'stop_type', e.target.value)}
                          >
                            <option value="PICKUP">PICKUP</option>
                            <option value="DELIVERY">DELIVERY</option>
                            <option value="PICKUP_AND_DELIVERY">PICKUP_AND_DELIVERY</option>
                            <option value="TRANSIT">TRANSIT</option>
                            <option value="BREAK">BREAK</option>
                            <option value="FUEL">FUEL</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </div>
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Order</label>
                          <select
                            className={inputClass}
                            value={stop.order_id || ""}
                            onChange={(e) => updateStopRow(idx, 'order_id', e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {linkedOrdersForTrip.map(order => (
                              <option key={order.id} value={order.id}>{order.lr_number}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Location Address</label>
                          <input className={inputClass} value={stop.location_address} onChange={(e) => updateStopRow(idx, 'location_address', e.target.value)} placeholder="Stop address" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">ETA</label>
                          <input type="datetime-local" className={inputClass} value={stop.scheduled_arrival} onChange={(e) => updateStopRow(idx, 'scheduled_arrival', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">ETD</label>
                          <input type="datetime-local" className={inputClass} value={stop.scheduled_departure} onChange={(e) => updateStopRow(idx, 'scheduled_departure', e.target.value)} />
                        </div>
                        <div className="col-span-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase">#</label>
                           <div className="h-9 flex items-center justify-center font-bold text-gray-400 bg-gray-50 rounded-lg border border-gray-100">{idx + 1}</div>
                        </div>
                        <div className="col-span-1">
                          <button type="button" onClick={() => removeStopRow(idx)} className="w-full h-9 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="col-span-12">
                           <input 
                             className={`${inputClass} !py-1 text-xs`} 
                             value={stop.instructions || ""} 
                             onChange={(e) => updateStopRow(idx, 'instructions', e.target.value)} 
                             placeholder="Instructions (optional)" 
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6 mt-8">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="scheduled_pickup_date" error={fieldErrors.scheduled_pickup_date}>
                      <input type="date" name="scheduled_pickup_date" className={inputClass} value={formData.scheduled_pickup_date || ""} onChange={handleInputChange} />
                    </FieldGroup>
                    <FieldGroup label="actual_pickup_date" error={fieldErrors.actual_pickup_date}>
                      <input type="date" name="actual_pickup_date" className={inputClass} value={formData.actual_pickup_date || ""} onChange={handleInputChange} />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="scheduled_delivery_date" error={fieldErrors.scheduled_delivery_date}>
                      <input type="date" name="scheduled_delivery_date" className={inputClass} value={formData.scheduled_delivery_date || ""} onChange={handleInputChange} />
                    </FieldGroup>
                    <FieldGroup label="actual_delivery_date" error={fieldErrors.actual_delivery_date}>
                      <input type="date" name="actual_delivery_date" className={inputClass} value={formData.actual_delivery_date || ""} onChange={handleInputChange} />
                    </FieldGroup>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <FieldGroup label="start_time" error={fieldErrors.start_time}><input type="datetime-local" name="start_time" className={inputClass} value={formData.start_time || ""} onChange={handleInputChange} /></FieldGroup>
                  <FieldGroup label="end_time" error={fieldErrors.end_time}><input type="datetime-local" name="end_time" className={inputClass} value={formData.end_time || ""} onChange={handleInputChange} /></FieldGroup>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100/50"><Gauge size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-[#172B4D] tracking-tight">Metrics & Performance</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Journey efficiency & operational data</p>
                  </div>
                </div>
                
                <div className="max-w-4xl">
                  <GroupHeader title="Distance" />
                  <MetricsRow label="total_distance" suffix="KM">
                    <input type="number" name="total_distance_km" className={inputClass} value={formData.total_distance_km || ""} onChange={handleInputChange} placeholder="0" />
                  </MetricsRow>
                  <MetricsRow label="start_odometer" suffix="KM">
                    <input type="number" name="start_odometer_km" className={inputClass} value={formData.start_odometer_km || ""} onChange={handleInputChange} placeholder="Start Reading" />
                  </MetricsRow>
                  <MetricsRow label="end_odometer" suffix="KM">
                    <input type="number" name="end_odometer_km" className={inputClass} value={formData.end_odometer_km || ""} onChange={handleInputChange} placeholder="End Reading" />
                  </MetricsRow>

                  <GroupHeader title="Fuel" />
                  <MetricsRow label="estimated_fuel" suffix="L">
                    <div className="flex items-center gap-3">
                      <input type="number" name="estimated_fuel_liters" className={`${inputClass} !bg-gray-50/50`} value={formData.estimated_fuel_liters || ""} onChange={handleInputChange} placeholder="Auto-calculated" />
                      <button type="button" className="text-[10px] font-black text-[#0052CC] uppercase tracking-tighter hover:underline whitespace-nowrap">From route</button>
                    </div>
                  </MetricsRow>
                  <MetricsRow label="actual_fuel_used" suffix="L">
                    <input type="number" name="actual_fuel_liters" className={inputClass} value={formData.actual_fuel_liters || ""} onChange={handleInputChange} placeholder="Pump reading" />
                  </MetricsRow>
                  <MetricsRow label="fuel_rate_per_litre" suffix="₹/L">
                    <input type="number" name="fuel_rate_per_liter" className={inputClass} value={formData.fuel_rate_per_liter || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>

                  <GroupHeader title="Operations" />
                  <MetricsRow label="damage_count" helpText="Number of damaged items">
                    <input type="number" min="0" name="damage_count" className={inputClass} value={formData.damage_count} onChange={handleInputChange} placeholder="0" />
                  </MetricsRow>
                  <MetricsRow label="pod_turnaround_days" helpText="Proof of delivery days">
                    <input type="number" min="0" name="pod_turnaround_days" className={inputClass} value={formData.pod_turnaround_days || ""} onChange={handleInputChange} placeholder="0" />
                  </MetricsRow>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-sm border border-rose-100/50"><DollarSign size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-[#172B4D] tracking-tight">Financials & Audits</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Billing & settlement details</p>
                  </div>
                </div>
                
                <div className="max-w-4xl">
                  {linkedOrdersForTrip.length > 0 && (
                    <>
                      <GroupHeader title="LR Specific (Read-only)" />
                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 mb-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">lr finance scope</span>
                          <LRTabStrip
                            linkedOrders={linkedOrdersForTrip.map((o) => ({ order_id: o.id, lr_number: o.lr_number }))}
                            activeOrderId={activeRouteOrderId}
                            onChange={setActiveRouteOrderId}
                            maxVisible={5}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                            <p className="font-black text-amber-800 uppercase tracking-wider">Freight (LR)</p>
                            <p className="mt-1 text-gray-700">₹ {activeFinanceOrder?.freight_charges || '0.00'}</p>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                            <p className="font-black text-amber-800 uppercase tracking-wider">Consignment Value</p>
                            <p className="mt-1 text-gray-700">₹ {activeFinanceOrder?.consignment_value || '0.00'}</p>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                            <p className="font-black text-amber-800 uppercase tracking-wider">Advance Received</p>
                            <p className="mt-1 text-gray-700">₹ {activeFinanceOrder?.advance_received || '0.00'}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <GroupHeader title="Customer Billing" />
                  <MetricsRow label="total_freight_charge" suffix="₹">
                    <input type="number" name="total_freight_charge" className={inputClass} value={formData.total_freight_charge || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="total_accessorial_charge" suffix="₹">
                    <input type="number" name="total_accessorial_charge" className={inputClass} value={formData.total_accessorial_charge || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="total_tax" suffix="₹">
                    <input type="number" name="total_tax" className={inputClass} value={formData.total_tax || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="total_bill_amount" suffix="₹">
                    <input type="number" name="total_bill_amount" className={`${inputClass} !bg-blue-50/30 text-blue-700 font-black`} value={formData.total_bill_amount || ""} onChange={handleInputChange} placeholder="Auto" readOnly />
                  </MetricsRow>

                  <GroupHeader title="Owner / Carrier Hire" />
                  <MetricsRow label="booked_price" suffix="₹">
                    <input type="number" name="booked_price" className={inputClass} value={formData.booked_price || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="tds" suffix="%">
                    <input type="number" name="tds_percentage" className={inputClass} value={formData.tds_percentage || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="tds_amount" suffix="₹">
                    <input type="number" name="tds_amount" className={`${inputClass} !bg-gray-50/70 text-gray-500`} value={formData.tds_amount || ""} onChange={handleInputChange} placeholder="Auto" readOnly />
                  </MetricsRow>
                  <MetricsRow label="broker_commission" suffix="₹">
                    <input type="number" name="broker_commission" className={inputClass} value={formData.broker_commission || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>

                  <GroupHeader title="Adjustments" />
                  <MetricsRow label="incentive_amount" suffix="₹">
                    <input type="number" name="incentive_amount" className={inputClass} value={formData.incentive_amount || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="late_fee" suffix="₹">
                    <input type="number" name="late_fee" className={inputClass} value={formData.late_fee || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="part_load_charge" suffix="₹">
                    <input type="number" name="part_load_charge" className={inputClass} value={formData.part_load_charge || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>
                  <MetricsRow label="damage_amount" suffix="₹">
                    <input type="number" name="damage_amount" className={inputClass} value={formData.damage_amount || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>

                  <GroupHeader title="Settlement Status" />
                  <MetricsRow label="payment_received_amount" suffix="₹">
                    <input type="number" name="payment_received_amount" className={inputClass} value={formData.payment_received_amount || ""} onChange={handleInputChange} placeholder="0.00" />
                  </MetricsRow>

                  <div className="h-4" />
                  <div className="grid grid-cols-2 gap-6">
                    <FieldGroup label="pod_received_date"><input type="date" name="pod_received_date" className={inputClass} value={formData.pod_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                    <FieldGroup label="payment_received_date"><input type="date" name="payment_received_date" className={inputClass} value={formData.payment_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                  </div>

                  <div className="flex gap-8 items-center bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-6 transition-all hover:bg-white hover:shadow-sm">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" name="is_billed" checked={formData.is_billed || false} onChange={handleInputChange} className="w-5 h-5 rounded-lg text-blue-600 border-gray-300" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b] group-hover:text-[#4a6cf7] transition-colors">Is Billed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" name="is_paid" checked={formData.is_paid || false} onChange={handleInputChange} className="w-5 h-5 rounded-lg text-blue-600 border-gray-300" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b] group-hover:text-[#4a6cf7] transition-colors">Is Paid</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100/50"><Package size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-[#172B4D] tracking-tight">Cargo</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Linked cargo items for this trip</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  {cargoLoading ? (
                    <p className="text-sm text-gray-500">Loading cargo...</p>
                  ) : cargoItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No cargo linked. Use the Cargo module or Trip detail Cargo tab to add items.</p>
                  ) : (
                    <div className="space-y-2">
                      {cargoItems.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#172B4D]">{item.item_code || String(item.id).slice(-8)} - {item.description}</p>
                            <p className="text-xs text-gray-500">{item.commodity_type || 'GENERAL'} | Qty {item.quantity} | {item.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {trip?.id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest border border-blue-100"
                  >
                    Open Full Trip View (Cargo Tab)
                  </button>
                )}
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-8">
                   <FieldGroup label="POD Received Date"><input type="date" name="pod_received_date" className={inputClass} value={formData.pod_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                   <FieldGroup label="Remarks">
                     <textarea name="remarks" rows="3" className={inputClass} value={formData.remarks || ""} onChange={handleInputChange} />
                   </FieldGroup>
                </div>
                <FieldGroup label="Version">
                   <input type="number" name="version" className={inputClass} value={formData.version || 1} readOnly disabled />
                </FieldGroup>
              </div>
            )}
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-4">
             <button 
               type="button"
               onClick={handlePrev}
               disabled={currentStep === 1}
               className="flex items-center gap-2 px-5 py-2 text-gray-500 font-bold text-[11px] uppercase tracking-widest hover:bg-white rounded-lg transition-all disabled:opacity-0 active:scale-95 border border-transparent hover:border-gray-200"
             >
               <ChevronLeft size={16} /> Previous
             </button>
             
             {isDirty && (
               <button 
                 type="button"
                 onClick={handleUpdate}
                 disabled={updateTripMutation.isLoading || hasErrors}
                 className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
               >
                 {updateTripMutation.isLoading ? 'Syncing...' : 'Update'} <Save size={14} />
               </button>
             )}
          </div>
          
          <div className="flex gap-3">
            {currentStep < steps.length ? (
              <button 
                type="button"
                onClick={handleNext}
                disabled={hasErrors}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                form="edit-trip-form-list"
                type="submit"
                disabled={updateTripMutation.isLoading || !isDirty || hasErrors}
                className="flex items-center gap-2 px-10 py-2.5 bg-[#1e293b] text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                {updateTripMutation.isLoading ? 'Syncing...' : 'Submit'} <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ViewTripModal({ isOpen, onClose, tripId }) {
  const { data: trip, isLoading } = useTripDetail(tripId);
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];

  const getDriverDisplay = (id) => {
    if (!id) return 'Unassigned';
    const d = drivers.find(dr => dr.id === id);
    if (!d) return 'Unassigned';
    return `${d.user?.first_name || 'Driver'} ${d.user?.last_name || ''}`.trim();
  };

  const getVehicleDisplay = (id) => {
    if (!id) return 'Unassigned';
    const v = vehicles.find(vh => vh.id === id);
    if (!v) return 'Unassigned';
    return v.registration_number || v.registration || 'Unassigned';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Journey Overview" subtitle={trip?.trip_number || 'TRP-N/A'}>
      {isLoading ? (
        <div className="flex justify-center items-center h-80"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4a6cf7]"></div></div>
      ) : trip ? (
        <div className="space-y-8">
          <div className="bg-[#172B4D] p-6 rounded-2xl flex items-center justify-between shadow-2xl">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trip Reference</p>
              <p className="text-2xl font-bold text-white tracking-tighter">{trip.trip_number || 'N/A'}</p>
            </div>
            <div className="text-right space-y-2">
               <StatusBadge status={trip.status} />
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 block">{trip.trip_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                   <SectionHeader icon={MapPin} title="Operational flow" />
                   <div className="space-y-6 relative">
                      <div className="absolute left-[7px] top-[24px] bottom-[18px] w-0.5 border-l-2 border-dashed border-gray-100"></div>
                      <div className="flex items-start gap-4">
                         <div className="w-4 h-4 rounded-full bg-[#4a6cf7] border-4 border-white shadow-sm mt-1 z-10 transition-transform hover:scale-125"></div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase">Origin Address</p>
                            <p className="text-sm font-bold text-gray-800 leading-relaxed">{trip.origin_address || 'Not specified'}</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm mt-1 z-10 transition-transform hover:scale-125"></div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase">Destination Address</p>
                            <p className="text-sm font-bold text-gray-800 leading-relaxed">{trip.destination_address || 'Not specified'}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <SectionHeader icon={Calendar} title="Timing ledger" />
                   <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sch. Pickup</p><p className="font-bold text-gray-800 text-sm">{trip.scheduled_pickup_date ? formatDate(trip.scheduled_pickup_date) : '-'}</p></div>
                      <div><p className="text-xs font-bold text-[#4a6cf7] uppercase tracking-widest">Act. Pickup</p><p className="font-bold text-[#4a6cf7] text-sm">{trip.actual_pickup_date ? formatDate(trip.actual_pickup_date) : '-'}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sch. Delivery</p><p className="font-bold text-gray-800 text-sm">{trip.scheduled_delivery_date ? formatDate(trip.scheduled_delivery_date) : '-'}</p></div>
                      <div><p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Act. Delivery</p><p className="font-bold text-emerald-600 text-sm">{trip.actual_delivery_date ? formatDate(trip.actual_delivery_date) : '-'}</p></div>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <SectionHeader icon={Truck} title="Fleet resources" />
                   <div className="space-y-5">
                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#4a6cf7] transition-colors group-hover:bg-[#4a6cf7] group-hover:text-white"><User size={22} /></div>
                         <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-400 uppercase">Primary Driver</p>
                            <p className="font-bold text-gray-800 text-sm tracking-tight">{getDriverDisplay(trip.primary_driver_id || trip.driver_id)}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 transition-colors group-hover:bg-gray-800 group-hover:text-white"><Truck size={22} /></div>
                         <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-400 uppercase">Active Vehicle</p>
                            <p className="font-bold text-gray-800 text-sm tracking-tight">{getVehicleDisplay(trip.primary_vehicle_id || trip.vehicle_id)}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none"><DollarSign size={80} /></div>
                   <SectionHeader icon={DollarSign} title="Financial Meta" />
                   <div className="grid grid-cols-2 gap-y-6">
                      <div><p className="text-xs font-bold text-gray-400 uppercase">Total Freight</p><p className="text-xl font-bold text-[#4a6cf7] tracking-tighter">₹{trip.total_freight_charge}</p></div>
                      <div><p className="text-xs font-bold text-gray-400 uppercase">Total Tax</p><p className="text-sm font-bold text-gray-800">₹{trip.total_tax}</p></div>
                      <div className="col-span-2 pt-4 mt-2 border-t border-gray-50">
                         <div className="flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Start ODO</p><p className="font-bold text-gray-800 text-sm">{trip.start_odometer_km || '-'} KM</p></div>
                            <div className="flex-1 flex justify-center"><ChevronRight size={12} className="text-gray-200" /></div>
                            <div className="text-right"> <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">End ODO</p><p className="font-bold text-emerald-600 text-sm">{trip.end_odometer_km || '-'} KM</p></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {trip.remarks && (
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200 flex gap-4">
               <FileText size={20} className="text-gray-300 shrink-0 mt-1" />
               <div className="space-y-1.5"><p className="text-xs font-bold text-gray-400 uppercase">Instructional Remarks</p><p className="text-sm font-bold text-gray-600 leading-relaxed italic">"{trip.remarks}"</p></div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-20 font-bold uppercase tracking-widest text-[10px]">Journey data unreachable</div>
      )}

      <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
        <button onClick={onClose} className="px-6 py-2 text-white bg-[#172B4D] rounded-lg font-bold text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all">Close Journey View</button>
      </div>
    </Modal>
  );
}

export function AddStopsModal({ isOpen, onClose, tripId, nextSequenceNumber, onSuccess }) {
  const [plannedStops, setPlannedStops] = useState([
    { stop_type: 'PICKUP', location_address: '', instructions: '', scheduled_arrival: '', scheduled_departure: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [stopErrors, setStopErrors] = useState([]);

  const validateStops = (stops = plannedStops) => {
    const errors = [];
    const hasLocation = stops.some(s => s.location_address?.trim());
    if (!hasLocation) errors.push("At least one stop must have a location address.");
    setStopErrors(errors);
    return errors.length === 0;
  };

  const addStopRow = () => {
    setPlannedStops(prev => [
      ...prev,
      { stop_type: 'DELIVERY', location_address: '', instructions: '', scheduled_arrival: '', scheduled_departure: '' }
    ]);
  };

  const removeStopRow = (index) => {
    setPlannedStops(prev => prev.filter((_, i) => i !== index));
  };

  const updateStopRow = (index, key, value) => {
    setPlannedStops(prev => {
      const next = prev.map((s, i) => i === index ? { ...s, [key]: value } : s);
      validateStops(next);
      return next;
    });
  };

  const handleStopDragStart = (index) => setDragIdx(index);
  const handleStopDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIdx(index);
  };
  const handleStopDrop = (index) => {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setPlannedStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStops()) return;
    
    setIsLoading(true);
    try {
      // Filter out empty rows and then iterate
      const stopsToCreate = plannedStops.filter(s => s.location_address?.trim());
      for (let i = 0; i < stopsToCreate.length; i++) {
        const stop = stopsToCreate[i];
        await tripsApi.createStop(tripId, {
          stop_sequence: nextSequenceNumber + i,
          stop_type: stop.stop_type,
          location_address: stop.location_address,
          instructions: stop.instructions,
          scheduled_arrival: stop.scheduled_arrival || null,
          scheduled_departure: stop.scheduled_departure || null,
          stop_status: 'PENDING'
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Batch stop creation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><MapPin size={24} /></div>
             <div>
               <h2 className="text-xl font-black text-gray-800 tracking-tight">Add Trip Stops</h2>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Multi-stop Planner</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className={`mb-6 rounded-2xl border px-4 py-3 text-xs font-bold transition-all flex items-center gap-3 ${
              stopErrors.length
                ? 'border-red-100 bg-red-50 text-red-600'
                : 'border-emerald-100 bg-emerald-50 text-emerald-600'
            }`}>
              {stopErrors.length ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              {stopErrors.length ? stopErrors.join(' ') : 'Plan your journey sequence here. You can add multiple stops and reorder them.'}
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">Stop Sequence</h3>
              <button 
                type="button" 
                onClick={addStopRow} 
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                + Add Stop Row
              </button>
            </div>

            <div className="space-y-4">
              {plannedStops.map((stop, idx) => (
                <div
                  key={`stop-${idx}`}
                  className={`grid grid-cols-12 gap-3 items-end bg-white border rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-gray-100 ${
                    dragOverIdx === idx ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-200'
                  }`}
                  onDragOver={(e) => handleStopDragOver(e, idx)}
                  onDrop={() => handleStopDrop(idx)}
                >
                  <div
                    className="col-span-1 flex items-center justify-center cursor-grab text-gray-300 hover:text-gray-500 transition-colors"
                    draggable
                    onDragStart={() => handleStopDragStart(idx)}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  >
                    <GripVertical size={20} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Type</label>
                    <select className={inputClass} value={stop.stop_type} disabled={idx === 0 || idx === plannedStops.length - 1} onChange={(e) => {
                      updateStopRow(idx, 'stop_type', e.target.value);
                    }}>
                      <option value="PICKUP">PICKUP</option>
                      <option value="DELIVERY">DELIVERY</option>
                      <option value="PICKUP_AND_DELIVERY">PICKUP_AND_DELIVERY</option>
                      <option value="TRANSIT">TRANSIT</option>
                      <option value="BREAK">BREAK</option>
                      <option value="FUEL">FUEL</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Location Address</label>
                    <input className={inputClass} value={stop.location_address} onChange={(e) => updateStopRow(idx, 'location_address', e.target.value)} placeholder="Complete address" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">ETA (Sch Arrival)</label>
                    <input type="datetime-local" className={inputClass} value={stop.scheduled_arrival} onChange={(e) => updateStopRow(idx, 'scheduled_arrival', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">ETD (Sch Departure)</label>
                    <input type="datetime-local" className={inputClass} value={stop.scheduled_departure} onChange={(e) => updateStopRow(idx, 'scheduled_departure', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block text-center">Seq</label>
                     <div className="h-9 flex items-center justify-center font-black text-gray-400 bg-gray-50 rounded-xl border border-gray-100">{nextSequenceNumber + idx}</div>
                  </div>
                  <div className="col-span-1 text-right">
                    <button type="button" onClick={() => removeStopRow(idx)} className="h-9 w-9 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all ml-auto">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="col-span-12 mt-1 px-1">
                     <input 
                       className={`${inputClass} !py-1.5 text-[11px] font-medium bg-gray-50/50 border-dashed`} 
                       value={stop.instructions || ""} 
                       onChange={(e) => updateStopRow(idx, 'instructions', e.target.value)} 
                       placeholder="Special instructions for this stop (optional)..." 
                     />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading || stopErrors.length > 0}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#172B4D] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Saving Stops...' : 'Add All Stops to Trip'} <Save size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
