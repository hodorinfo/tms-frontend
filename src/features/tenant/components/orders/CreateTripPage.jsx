import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Save, X, FileText, Truck, 
  MapPin, Gauge, DollarSign, CheckCircle2, AlertCircle, GripVertical, Circle, Package
} from 'lucide-react';
import { useCreateTrip, useOrders, useTrips } from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';
import { tripsApi } from '../../api/orders/ordersEndpoint';
import LRTabStrip from './trip/LRTabStrip';
import ScopeBadge from './trip/ScopeBadge';

// --- Reusable UI Components (matching previous standardization) ---
const formatLabel = (str) => {
  if (!str) return "";
  // Remove _id or _code suffix for cleaner labels
  const cleanStr = str.replace(/_id$/i, '').replace(/_code$/i, '');
  return cleanStr
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const FieldGroup = ({ label, children, required, error }) => (
  <div className="flex flex-col">
    <label className="block text-gray-700 font-medium mb-1 text-sm">
      {formatLabel(label)}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <span className="text-[10px] text-red-500 font-bold mt-1 animate-in fade-in slide-in-from-top-1">{error}</span>}
  </div>
);

const GroupHeader = ({ title }) => (
  <div className="bg-gray-50/80 px-4 py-2 border-x border-t border-gray-200 first:rounded-t-2xl mt-6 first:mt-0">
    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</h3>
  </div>
);

const MetricsRow = ({ label, children, suffix, helpText }) => (
  <div className="flex border-x border-b border-gray-200 last:rounded-b-2xl overflow-hidden group">
    <div className="w-[35%] bg-gray-50/30 px-5 py-3.5 border-r border-gray-100 flex items-center transition-colors group-hover:bg-blue-50/30">
      <label className="text-xs font-bold text-gray-600 group-hover:text-[#4a6cf7] transition-colors">{formatLabel(label)}</label>
    </div>
    <div className="w-[65%] px-5 py-2.5 flex items-center gap-4 bg-white transition-colors group-hover:bg-blue-50/10">
      <div className="flex-1">{children}</div>
      {suffix && <span className="text-[10px] font-black text-gray-400 uppercase w-10 text-right">{suffix}</span>}
      {helpText && <span className="text-[10px] font-medium text-gray-400 italic hidden sm:block whitespace-nowrap">{helpText}</span>}
    </div>
  </div>
);

const inputClass = "w-full p-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-[#4a6cf7] outline-none transition-all text-sm font-bold text-slate-600 placeholder:text-gray-300 shadow-sm";
const buildRouteState = (orderId = null, origin = "", destination = "") => ({
  order_id: orderId,
  origin_address: origin,
  destination_address: destination,
  scheduled_pickup_date: null,
  scheduled_delivery_date: null,
  actual_pickup_date: null,
  actual_delivery_date: null,
  start_time: null,
  end_time: null,
  stops: [
    { stop_type: 'PICKUP', location_address: origin, order_id: orderId, instructions: '', scheduled_arrival: '', scheduled_departure: '' },
    { stop_type: 'DELIVERY', location_address: destination, order_id: orderId, instructions: '', scheduled_arrival: '', scheduled_departure: '' },
  ],
});
const TRIP_STATUS_OPTIONS = [
  { value: 'CREATED', label: 'Created' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function CreateTripPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const createTripMutation = useCreateTrip();

  // Queries for lookups
  const { data: ordersData } = useOrders({ page_size: 100 });
  const ordersDataResults = ordersData?.results || [];
  const orders = useMemo(() => ordersDataResults.filter(o => 
    ['DRAFT', 'CONFIRMED'].includes(o.status)
  ), [ordersDataResults]);
  const { data: driversData } = useDrivers({ page_size: 100 });
  const drivers = driversData?.results || [];
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const vehicles = vehiclesData?.results || [];
  const { data: vehicleTypesData } = useVehicleTypes({ page_size: 200 });
  const vehicleTypes = vehicleTypesData?.results || [];

  // Fetch all active trips to determine driver/vehicle availability
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
    order_id: "", order_ids: [], reference_number: "", trip_type: "FTL", status: "CREATED",
    primary_vehicle_id: null, vehicle_number: "", vehicle_type_code: "", vehicle_owner_name: "",
    primary_driver_id: null, alternate_vehicle_id: null, alternate_driver_id: null,
    origin_address: "", destination_address: "",
    created_date: new Date().toISOString().split('T')[0],
    scheduled_pickup_date: null, scheduled_delivery_date: null,
    actual_pickup_date: null, actual_delivery_date: null,
    start_time: null, end_time: null,
    total_distance_km: null, start_odometer_km: null, end_odometer_km: null,
    estimated_fuel_liters: null, actual_fuel_liters: null, fuel_rate_per_liter: null,
    damage_count: 0, pod_turnaround_days: null,
    booked_price: null, total_freight_charge: "0.00", total_accessorial_charge: "0.00", total_tax: "0.00",
    tds_percentage: "0.00", tds_amount: "0.00", incentive_amount: "0.00", late_fee: "0.00",
    part_load_charge: "0.00", damage_amount: "0.00", broker_commission: "0.00",
    total_bill_amount: "0.00", payment_received_amount: "0.00", payment_received_date: null,
    pod_received_date: null, is_billed: false, is_paid: false,
    remarks: "", version: 1
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeRouteOrderId, setActiveRouteOrderId] = useState(null);
  const [routesByOrder, setRoutesByOrder] = useState({});
  const selectedOrders = useMemo(
    () => orders.filter((o) => (formData.order_ids || []).includes(String(o.id))),
    [orders, formData.order_ids]
  );
  const selectedOrder = selectedOrders[0] || null;

  const hasErrors = Object.values(fieldErrors).some(err => err && err !== '');
  const [stopErrors, setStopErrors] = useState([]);
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('order_id');

  useEffect(() => {
    if (orderIdFromUrl && orders.length > 0) {
      handleOrdersChange([orderIdFromUrl]);
    }
  }, [orderIdFromUrl, orders]);

  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const activeRoute = useMemo(
    () => routesByOrder[activeRouteOrderId] || buildRouteState(activeRouteOrderId),
    [routesByOrder, activeRouteOrderId]
  );

  const steps = [
    { id: 1, name: 'General Info', icon: FileText },
    { id: 2, name: 'Fleet & Team', icon: Truck },
    { id: 3, name: 'Route & Schedule', icon: MapPin },
    { id: 4, name: 'Metrics', icon: Gauge },
    { id: 5, name: 'Financials', icon: DollarSign },
    { id: 6, name: 'Cargo', icon: Package },
    { id: 7, name: 'Review', icon: CheckCircle2 }
  ];

  const validateField = (name, value, currentData) => {
    if (name === 'pod_turnaround_days') {
      if (value === '' || value === null) return '';
      const n = Number(value);
      if (Number.isNaN(n)) return 'Enter a valid number';
      if (n < 0) return 'Must be 0 or more';
    }
    if (name === 'damage_count') {
      if (value === '' || value === null) return '';
      const n = Number(value);
      if (Number.isNaN(n)) return 'Enter a valid number';
      if (n < 0) return 'Must be 0 or more';
    }
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
      // Use local date instead of UTC date to avoid false "future" errors near timezone boundaries.
      const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      if (name === 'actual_pickup_date' && pickup && pickup > today) return 'Actual pickup cannot be in the future';
      if (name === 'actual_delivery_date') {
        if (delivery && delivery > today) return 'Actual delivery cannot be in the future';
        if (pickup && delivery && delivery < pickup) return 'Actual delivery cannot be before actual pickup';
      }
    }
    if (name === 'alternate_vehicle_id' || name === 'primary_vehicle_id') {
      if (
        currentData.primary_vehicle_id &&
        currentData.alternate_vehicle_id &&
        String(currentData.primary_vehicle_id) === String(currentData.alternate_vehicle_id)
      ) return 'Primary and alternate vehicle must be different';
    }
    if (name === 'alternate_driver_id' || name === 'primary_driver_id') {
      if (
        currentData.primary_driver_id &&
        currentData.alternate_driver_id &&
        String(currentData.primary_driver_id) === String(currentData.alternate_driver_id)
      ) return 'Primary and alternate driver must be different';
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-fill vehicle details when primary_vehicle_id changes
      if (name === 'primary_vehicle_id' && value) {
        const selectedVehicle = vehicles.find(v => String(v.id) === String(value));
        if (selectedVehicle) {
          next.vehicle_number = selectedVehicle.registration_number || "";
          next.vehicle_type_code = selectedVehicle.vehicle_type?.type_code || selectedVehicle.vehicle_type_code || "";
          next.vehicle_owner_name = selectedVehicle.owner_name || "";
        }
      }

      const err = validateField(name, next[name], next);
      const vehiclePairErr = validateField('alternate_vehicle_id', next.alternate_vehicle_id, next);
      const driverPairErr = validateField('alternate_driver_id', next.alternate_driver_id, next);
      const scheduledDateErr = validateField('scheduled_delivery_date', next.scheduled_delivery_date, next);
      const actualDateErr = validateField('actual_delivery_date', next.actual_delivery_date, next);
      const actualPickupErr = validateField('actual_pickup_date', next.actual_pickup_date, next);
      const startTimeErr = validateField('start_time', next.start_time, next);
      const endTimeErr = validateField('end_time', next.end_time, next);
      setFieldErrors((p) => ({
        ...p,
        [name]: err,
        primary_vehicle_id: vehiclePairErr,
        alternate_vehicle_id: vehiclePairErr,
        primary_driver_id: driverPairErr,
        alternate_driver_id: driverPairErr,
        scheduled_delivery_date: scheduledDateErr,
        actual_pickup_date: actualPickupErr,
        actual_delivery_date: actualDateErr,
        start_time: startTimeErr,
        end_time: endTimeErr,
      }));
      return next;
    });
  };

  const handleOrdersChange = (ids) => {
    const selected = orders.filter(o => ids.includes(String(o.id)));
    const firstOrder = selected[0];
    const lastOrder = selected[selected.length - 1] || firstOrder;
    const newOrigin = firstOrder?.consignor_address || "";
    const newDest = lastOrder?.consignee_address || "";

    setFormData(prev => ({
      ...prev,
      order_ids: ids,
      order_id: ids[0] || "",
      lr_number: selected.map(o => o.lr_number).filter(Boolean).join(', '),
      reference_number: firstOrder ? (firstOrder.reference_number || "") : "",
      trip_type: firstOrder ? (firstOrder.order_type || prev.trip_type || "FTL") : prev.trip_type,
      status: firstOrder ? 'ASSIGNED' : (prev.status || 'CREATED'),
      vehicle_type_code: firstOrder ? (firstOrder.vehicle_type_preference || prev.vehicle_type_code || '') : prev.vehicle_type_code,
      origin_address: newOrigin,
      destination_address: newDest,
    }));
    setRoutesByOrder(prev => {
      const next = {};
      ids.forEach((id, index) => {
        const order = selected.find(o => String(o.id) === String(id));
        const fallbackOrigin = order?.consignor_address || "";
        const fallbackDestination = order?.consignee_address || "";
        next[id] = prev[id] || buildRouteState(id, fallbackOrigin, fallbackDestination);
      });
      return next;
    });
    setActiveRouteOrderId(ids[0] || null);
  };

  const validateStops = (stops = []) => {
    const allStops = [...(stops || []).filter(s => s.location_address?.trim())].map((s, idx) => ({ ...s, idx }));

    const pickupIndices = allStops.filter((s) => s.stop_type === 'PICKUP').map((s) => s.idx);
    const deliveryIndices = allStops.filter((s) => s.stop_type === 'DELIVERY').map((s) => s.idx);
    
    const errors = [];
    if (pickupIndices.length === 0) errors.push('Add at least one pickup stop (Origin or stop).');
    if (deliveryIndices.length === 0) errors.push('Add at least one delivery stop (Destination or stop).');
    
    if (pickupIndices.length > 0 && deliveryIndices.length > 0) {
      const lastPickupIdx = Math.max(...pickupIndices);
      const invalidDelivery = deliveryIndices.some((i) => i <= lastPickupIdx);
      if (invalidDelivery) errors.push('All delivery stops must come after pickup stops.');
    }
    setStopErrors(errors);
    return errors.length === 0;
  };

  const updateActiveRoute = (updater) => {
    if (!activeRouteOrderId) return;
    setRoutesByOrder(prev => {
      const current = prev[activeRouteOrderId] || buildRouteState(activeRouteOrderId);
      const nextRoute = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeRouteOrderId]: nextRoute };
    });
  };

  const handleRouteFieldChange = (name, value) => {
    updateActiveRoute((route) => {
      const next = { ...route, [name]: value };
      if (name === 'origin_address' || name === 'destination_address') {
        const stops = [...(route.stops || [])];
        if (stops.length > 0) {
          stops[0] = {
            ...stops[0],
            stop_type: 'PICKUP',
            order_id: route.order_id || activeRouteOrderId || null,
            location_address: name === 'origin_address' ? value : (stops[0].location_address || ''),
          };
        }
        if (stops.length > 1) {
          const lastIdx = stops.length - 1;
          stops[lastIdx] = {
            ...stops[lastIdx],
            stop_type: 'DELIVERY',
            order_id: route.order_id || activeRouteOrderId || null,
            location_address: name === 'destination_address' ? value : (stops[lastIdx].location_address || ''),
          };
        }
        next.stops = stops;
      }
      return next;
    });
  };

  useEffect(() => {
    validateStops(activeRoute.stops || []);
  }, [activeRouteOrderId, routesByOrder]);

  const handleNext = () => {
    if (hasErrors) return;
    if (currentStep === 3 && !validateStops(activeRoute.stops || [])) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vehiclePairErr = validateField('alternate_vehicle_id', formData.alternate_vehicle_id, formData);
    const driverPairErr = validateField('alternate_driver_id', formData.alternate_driver_id, formData);
    const scheduledDateErr = validateField('scheduled_delivery_date', formData.scheduled_delivery_date, formData);
    const actualDateErr = validateField('actual_delivery_date', formData.actual_delivery_date, formData);
    const actualPickupErr = validateField('actual_pickup_date', formData.actual_pickup_date, formData);
    const startTimeErr = validateField('start_time', formData.start_time, formData);
    const endTimeErr = validateField('end_time', formData.end_time, formData);

    if (vehiclePairErr || driverPairErr || scheduledDateErr || actualPickupErr || actualDateErr || startTimeErr || endTimeErr) {
      setFieldErrors((p) => ({
        ...p,
        primary_vehicle_id: vehiclePairErr,
        alternate_vehicle_id: vehiclePairErr,
        primary_driver_id: driverPairErr,
        alternate_driver_id: driverPairErr,
        scheduled_delivery_date: scheduledDateErr,
        actual_pickup_date: actualPickupErr,
        actual_delivery_date: actualDateErr,
        start_time: startTimeErr,
        end_time: endTimeErr,
      }));
      return;
    }
    for (const orderId of (formData.order_ids || [])) {
      const route = routesByOrder[orderId];
      if (!route || !validateStops(route.stops || [])) {
        setActiveRouteOrderId(orderId);
        return;
      }
    }
    if (currentStep < steps.length) {
      handleNext();
      return;
    }
    const primaryOrderId = formData.order_ids?.[0] || null;
    const fallbackRoute = Object.values(routesByOrder || {}).find(Boolean) || null;
    const primaryRoute = routesByOrder[primaryOrderId] || fallbackRoute || buildRouteState(primaryOrderId);
    const scheduledPickupDate = primaryRoute.scheduled_pickup_date || formData.scheduled_pickup_date || null;
    const scheduledDeliveryDate = primaryRoute.scheduled_delivery_date || formData.scheduled_delivery_date || null;

    if (!scheduledPickupDate || !scheduledDeliveryDate) {
      setFieldErrors((p) => ({
        ...p,
        scheduled_pickup_date: !scheduledPickupDate ? 'Scheduled pickup date is required' : '',
        scheduled_delivery_date: !scheduledDeliveryDate ? 'Scheduled delivery date is required' : '',
      }));
      setCurrentStep(3);
      return;
    }

    const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const normalizedActualPickupDate =
      primaryRoute.actual_pickup_date && primaryRoute.actual_pickup_date <= todayLocal
        ? primaryRoute.actual_pickup_date
        : null;
    const normalizedActualDeliveryDate =
      primaryRoute.actual_delivery_date && primaryRoute.actual_delivery_date <= todayLocal
        ? primaryRoute.actual_delivery_date
        : null;
    const payload = {
      ...formData,
      order_ids: formData.order_ids || [],
      order_id: formData.order_ids?.[0] || formData.order_id || null,
      origin_address: primaryRoute.origin_address || null,
      destination_address: primaryRoute.destination_address || null,
      scheduled_pickup_date: scheduledPickupDate,
      scheduled_delivery_date: scheduledDeliveryDate,
      actual_pickup_date: normalizedActualPickupDate,
      actual_delivery_date: normalizedActualDeliveryDate,
      start_time: primaryRoute.start_time || null,
      end_time: primaryRoute.end_time || null,
      pod_turnaround_days: formData.pod_turnaround_days === '' ? null : formData.pod_turnaround_days,
      total_distance_km: formData.total_distance_km === '' ? null : formData.total_distance_km,
      start_odometer_km: formData.start_odometer_km === '' ? null : formData.start_odometer_km,
      end_odometer_km: formData.end_odometer_km === '' ? null : formData.end_odometer_km,
      estimated_fuel_liters: formData.estimated_fuel_liters === '' ? null : formData.estimated_fuel_liters,
      actual_fuel_liters: formData.actual_fuel_liters === '' ? null : formData.actual_fuel_liters,
      fuel_rate_per_liter: formData.fuel_rate_per_liter === '' ? null : formData.fuel_rate_per_liter,
      damage_count:
        formData.damage_count === '' || formData.damage_count === null || Number.isNaN(Number.parseInt(formData.damage_count, 10))
          ? 0
          : Number.parseInt(formData.damage_count, 10),
      booked_price: formData.booked_price === '' ? null : formData.booked_price,
      payment_received_date: formData.payment_received_date || null,
      pod_received_date: formData.pod_received_date || null,
    };
    try {
      const createdTrip = await createTripMutation.mutateAsync(payload);
      const tripId = createdTrip?.id;

      if (tripId) {
        const stopPayloads = (formData.order_ids || []).flatMap((orderId) => {
          const route = routesByOrder[orderId];
          return (route?.stops || []).map((s) => ({
            ...s,
            order_id: s.order_id || orderId,
          }));
        })
          .map((s, idx) => ({
            stop_sequence: idx + 1,
            stop_type: s.stop_type,
            location_address: s.location_address || '',
            order_id: s.order_id || null,
            instructions: s.instructions || '',
            scheduled_arrival: s.scheduled_arrival || null,
            scheduled_departure: s.scheduled_departure || null,
            stop_status: 'PENDING',
          }))
          .filter((s) => s.location_address);

        for (const stop of stopPayloads) {
          await tripsApi.createStop(tripId, stop);
        }
      }

      navigate(`/tenant/dashboard/orders/trips/${tripId}`);
    } catch (_) {
      // toast is already handled by query layer
    }
  };

  const addStopRow = () => {
    updateActiveRoute((route) => {
      const prev = route.stops || [];
      const next = [...prev];
      // Insert before the last element (the terminal delivery stop)
      const lastIdx = Math.max(0, next.length - 1);
      next.splice(lastIdx, 0, {
        stop_type: 'PICKUP',
        location_address: '',
        order_id: activeRouteOrderId || formData.order_ids?.[0] || null,
        instructions: '',
        scheduled_arrival: '',
        scheduled_departure: '',
      });
      validateStops(next);
      return { ...route, stops: next };
    });
  };

  const removeStopRow = (index) => {
    updateActiveRoute((route) => {
      const prev = route.stops || [];
      const next = prev.filter((_, i) => i !== index);
      validateStops(next);
      return { ...route, stops: next };
    });
  };

  const updateStopRow = (index, key, value) => {
    updateActiveRoute((route) => {
      const prev = route.stops || [];
      const next = prev.map((s, i) => (
        i === index ? { ...s, [key]: value, order_id: route.order_id || activeRouteOrderId || s.order_id || null } : s
      ));
      validateStops(next);
      return { ...route, stops: next };
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
    updateActiveRoute((route) => {
      const prev = route.stops || [];
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      validateStops(next);
      return { ...route, stops: next };
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const primaryRoutePreview = routesByOrder[formData.order_ids?.[0]] || buildRouteState(formData.order_ids?.[0] || null);

  return (
    <div className="flex-1 bg-[#F8FAFC] min-h-0 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] tracking-tight">Plan New Trip</h1>
          </div>
          <button 
            onClick={() => navigate('/tenant/dashboard/orders/trips')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Horizontal Stepper */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-0"></div>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                      isActive ? 'bg-[#4a6cf7] border-[#4a6cf7] text-white shadow-lg shadow-blue-100 scale-110' : 
                      isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[#4a6cf7]' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-8 flex-1">
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-blue-50 text-[#4a6cf7] rounded-lg"><FileText size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">General Information</h2>
                    <ScopeBadge variant="lr" />
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    <FieldGroup label="orders">
                      <div className="border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2">
                        {orders.map((o) => {
                          const checked = (formData.order_ids || []).includes(String(o.id));
                          return (
                            <label key={o.id} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const current = new Set(formData.order_ids || []);
                                  if (e.target.checked) current.add(String(o.id));
                                  else current.delete(String(o.id));
                                  handleOrdersChange(Array.from(current));
                                }}
                              />
                              <span>{o.lr_number} - {o.status}</span>
                            </label>
                          );
                        })}
                      </div>
                    </FieldGroup>
                  </div>
                  {(formData.order_ids || []).length > 0 && (
                    <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/40">
                      <LRTabStrip
                        linkedOrders={selectedOrders.map((o) => ({ order_id: o.id, lr_number: o.lr_number }))}
                        activeOrderId={activeRouteOrderId}
                        onChange={setActiveRouteOrderId}
                      />
                      {selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId)) && (
                        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                            <p className="font-black text-amber-800 uppercase tracking-wider">Consignor</p>
                            <p className="text-gray-700 mt-1">{selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.consignor_address || '—'}</p>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                            <p className="font-black text-amber-800 uppercase tracking-wider">Consignee</p>
                            <p className="text-gray-700 mt-1">{selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.consignee_address || '—'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-8">
                    <FieldGroup label="lr_number">
                      <input
                        type="text"
                        className={inputClass}
                        value={selectedOrders.map(o => o.lr_number).filter(Boolean).join(', ')}
                        placeholder="Auto-filled from selected order"
                        disabled
                        readOnly
                      />
                    </FieldGroup>
                    <FieldGroup label="reference_number">
                      <input
                        type="text"
                        name="reference_number"
                        className={inputClass}
                        value={formData.reference_number}
                        onChange={handleInputChange}
                        placeholder="PO-12345"
                        disabled={Boolean(formData.order_ids?.length)}
                        readOnly={Boolean(formData.order_ids?.length)}
                      />
                    </FieldGroup>
                    <FieldGroup label="trip_type (operational)">
                      <select name="trip_type" className={inputClass} value={formData.trip_type} onChange={handleInputChange}>
                        <option value="FTL">Full Truck Load (FTL)</option>
                        <option value="LTL">Less than Truck Load (LTL)</option>
                        <option value="CONTAINER">Container</option>
                        <option value="COURIER">Courier</option>
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="status">
                    <select name="status" className={inputClass} value={formData.status} onChange={handleInputChange}>
                      {TRIP_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FieldGroup>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Fleet & Team Allocation</h2>
                    <ScopeBadge variant="trip" />
                  </div>
                  <p className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 inline-block">Applies to all linked LRs</p>
                  <div className="grid grid-cols-2 gap-8">
                    <FieldGroup label="primary_vehicle_id">
                      <select name="primary_vehicle_id" className={inputClass} value={formData.primary_vehicle_id || ""} onChange={handleInputChange}>
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
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-8">
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
                  <div className="grid grid-cols-3 gap-8 mt-4">
                     <FieldGroup label="vehicle_number"><input type="text" name="vehicle_number" className={inputClass} value={formData.vehicle_number} onChange={handleInputChange} /></FieldGroup>
                     <FieldGroup label="vehicle_type_code">
                      <select name="vehicle_type_code" className={inputClass} value={formData.vehicle_type_code || ""} onChange={handleInputChange}>
                        <option value="">Select Vehicle Type</option>
                        {vehicleTypes.map((vt) => (
                          <option key={vt.id} value={vt.type_code}>
                            {vt.type_code} - {vt.type_name}
                          </option>
                        ))}
                      </select>
                     </FieldGroup>
                     <FieldGroup label="vehicle_owner_name"><input type="text" name="vehicle_owner_name" className={inputClass} value={formData.vehicle_owner_name} onChange={handleInputChange} /></FieldGroup>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Route & Schedule</h2>
                    <ScopeBadge variant="lr" />
                  </div>
                  {(formData.order_ids || []).length > 0 && (
                    <div className="mb-2">
                      <LRTabStrip
                        linkedOrders={selectedOrders.map((o) => ({ order_id: o.id, lr_number: o.lr_number }))}
                        activeOrderId={activeRouteOrderId}
                        onChange={setActiveRouteOrderId}
                      />
                    </div>
                  )}
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-6 left-0 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#4a6cf7] border-2 border-white shadow-sm" /> Origin address
                        </label>
                        <textarea 
                          name="origin_address" 
                          rows="2" 
                          className={`${inputClass} !bg-white focus:shadow-lg focus:shadow-blue-50/50 transition-all !resize-none`} 
                          value={activeRoute.origin_address || ""} 
                          onChange={(e) => handleRouteFieldChange('origin_address', e.target.value)} 
                          placeholder="Enter starting point..." 
                        />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-6 left-0 flex items-center gap-2">
                          <MapPin size={10} className="text-[#10b981]" /> Destination address
                        </label>
                        <textarea 
                          name="destination_address" 
                          rows="2" 
                          className={`${inputClass} !bg-white focus:shadow-lg focus:shadow-emerald-50/50 transition-all !resize-none`} 
                          value={activeRoute.destination_address || ""} 
                          onChange={(e) => handleRouteFieldChange('destination_address', e.target.value)} 
                          placeholder="Enter drop-off point..." 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40">
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
                      <button type="button" onClick={addStopRow} className="text-xs font-bold text-[#4a6cf7]">+ Add Stop</button>
                    </div>
                    <div className="space-y-3">
                      {(activeRoute.stops || []).map((stop, idx) => (
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
                            <select className={inputClass} value={stop.stop_type} onChange={(e) => updateStopRow(idx, 'stop_type', e.target.value)}>
                              <option value="PICKUP">PICKUP</option>
                              <option value="DELIVERY">DELIVERY</option>
                                      <option value="TRANSIT">TRANSIT</option>
                                      <option value="BREAK">BREAK</option>
                                      <option value="FUEL">FUEL</option>
                              <option value="OTHER">OTHER</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Order LR</label>
                            <input
                              className={`${inputClass} bg-gray-50`}
                              value={selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.lr_number || 'Unassigned'}
                              readOnly
                            />
                          </div>
                          <div className="col-span-2">
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
                            <input className={`${inputClass} bg-gray-50`} value={idx + 1} readOnly />
                          </div>
                          <div className="col-span-1">
                            <button 
                              type="button" 
                              onClick={() => removeStopRow(idx)} 
                              disabled={idx === 0 || idx === (activeRoute.stops || []).length - 1}
                              className={`w-full text-xs font-bold rounded-lg py-2 border transition-all ${
                                (idx === 0 || idx === (activeRoute.stops || []).length - 1)
                                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                  : 'text-red-600 border-red-200 hover:bg-red-50'
                              }`}
                            >
                              Del
                            </button>
                          </div>
                          <div className="col-span-12">
                            <input className={inputClass} value={stop.instructions} onChange={(e) => updateStopRow(idx, 'instructions', e.target.value)} placeholder="Instructions (optional)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-gray-50 pt-8 mt-8">
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="scheduled_pickup_date" error={fieldErrors.scheduled_pickup_date}>
                        <input type="date" name="scheduled_pickup_date" className={inputClass} value={activeRoute.scheduled_pickup_date || ""} onChange={(e) => handleRouteFieldChange('scheduled_pickup_date', e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="scheduled_delivery_date" error={fieldErrors.scheduled_delivery_date}>
                        <input type="date" name="scheduled_delivery_date" className={inputClass} value={activeRoute.scheduled_delivery_date || ""} onChange={(e) => handleRouteFieldChange('scheduled_delivery_date', e.target.value)} />
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="actual_pickup_date" error={fieldErrors.actual_pickup_date}>
                        <input type="date" name="actual_pickup_date" className={inputClass} value={activeRoute.actual_pickup_date || ""} onChange={(e) => handleRouteFieldChange('actual_pickup_date', e.target.value)} />
                      </FieldGroup>
                      <FieldGroup label="actual_delivery_date" error={fieldErrors.actual_delivery_date}>
                        <input type="date" name="actual_delivery_date" className={inputClass} value={activeRoute.actual_delivery_date || ""} onChange={(e) => handleRouteFieldChange('actual_delivery_date', e.target.value)} />
                      </FieldGroup>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                      <FieldGroup label="start_time" error={fieldErrors.start_time}><input type="datetime-local" name="start_time" className={inputClass} value={activeRoute.start_time || ""} onChange={(e) => handleRouteFieldChange('start_time', e.target.value)} /></FieldGroup>
                      <FieldGroup label="end_time" error={fieldErrors.end_time}>
                        <input type="datetime-local" name="end_time" className={inputClass} value={activeRoute.end_time || ""} onChange={(e) => handleRouteFieldChange('end_time', e.target.value)} />
                      </FieldGroup>
                  </div>
                  <FieldGroup label="created_date"><input type="date" name="created_date" className={inputClass} value={formData.created_date} onChange={handleInputChange} /></FieldGroup>
                </div>
              )}

              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-5">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100/50"><Gauge size={24} /></div>
                    <div>
                      <h2 className="text-xl font-black text-[#172B4D] tracking-tight">Metrics & Performance</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Journey efficiency & operational data</p>
                    </div>
                    <ScopeBadge variant="trip" />
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
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-5">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-sm border border-rose-100/50"><DollarSign size={24} /></div>
                    <div>
                      <h2 className="text-xl font-black text-[#172B4D] tracking-tight">Financials & Audits</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Billing & settlement details</p>
                    </div>
                    <ScopeBadge variant="trip" />
                  </div>
                  
                  <div className="max-w-4xl">
                    <GroupHeader title="Primary Charges" />
                    <MetricsRow label="booked_price" suffix="₹">
                      <input type="number" name="booked_price" className={inputClass} value={formData.booked_price || ""} onChange={handleInputChange} placeholder="0.00" />
                    </MetricsRow>
                    <MetricsRow label="total_freight_charge" suffix="₹">
                      <input type="number" name="total_freight_charge" className={inputClass} value={formData.total_freight_charge || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="total_accessorial_charge" suffix="₹">
                      <input type="number" name="total_accessorial_charge" className={inputClass} value={formData.total_accessorial_charge || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>

                    <GroupHeader title="Taxes & TDS" />
                    <MetricsRow label="total_tax" suffix="₹">
                      <input type="number" name="total_tax" className={inputClass} value={formData.total_tax || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="tds" suffix="%">
                       <input type="number" name="tds_percentage" className={inputClass} value={formData.tds_percentage || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="tds_amount" suffix="₹">
                      <input type="number" name="tds_amount" className={inputClass} value={formData.tds_amount || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>

                    <GroupHeader title="Adjustments" />
                    <MetricsRow label="incentive_amount" suffix="₹">
                      <input type="number" name="incentive_amount" className={inputClass} value={formData.incentive_amount || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="late_fee" suffix="₹">
                      <input type="number" name="late_fee" className={inputClass} value={formData.late_fee || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="part_load_charge" suffix="₹">
                      <input type="number" name="part_load_charge" className={inputClass} value={formData.part_load_charge || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="damage_amount" suffix="₹">
                      <input type="number" name="damage_amount" className={inputClass} value={formData.damage_amount || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>

                    <GroupHeader title="Final Settlement" />
                    <MetricsRow label="broker_commission" suffix="₹">
                      <input type="number" name="broker_commission" className={inputClass} value={formData.broker_commission || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="total_bill_amount" suffix="₹">
                      <input type="number" name="total_bill_amount" className={`${inputClass} !bg-blue-50/30 text-blue-700 font-black`} value={formData.total_bill_amount || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    <MetricsRow label="payment_received_amount" suffix="₹">
                      <input type="number" name="payment_received_amount" className={inputClass} value={formData.payment_received_amount || "0.00"} onChange={handleInputChange} />
                    </MetricsRow>
                    
                    <div className="h-4" />
                    <div className="grid grid-cols-2 gap-6">
                      <FieldGroup label="pod_received_date"><input type="date" name="pod_received_date" className={inputClass} value={formData.pod_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                      <FieldGroup label="payment_received_date"><input type="date" name="payment_received_date" className={inputClass} value={formData.payment_received_date || ""} onChange={handleInputChange} /></FieldGroup>
                    </div>

                    <div className="flex gap-8 items-center bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-6 transition-all hover:bg-white hover:shadow-sm">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name="is_billed" checked={formData.is_billed || false} onChange={handleInputChange} className="w-5 h-5 rounded-lg text-[#4a6cf7] border-gray-300 focus:ring-[#4a6cf7]" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b] group-hover:text-[#4a6cf7] transition-colors">is_billed</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" name="is_paid" checked={formData.is_paid || false} onChange={handleInputChange} className="w-5 h-5 rounded-lg text-[#4a6cf7] border-gray-300 focus:ring-[#4a6cf7]" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b] group-hover:text-[#4a6cf7] transition-colors">is_paid</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-sm">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Cargo Planning</h2>
                    <ScopeBadge variant="trip" />
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 space-y-3">
                    <p className="text-sm font-semibold text-[#172B4D]">
                      Cargo is trip-scoped and will be added right after trip creation.
                    </p>
                    <p className="text-xs text-gray-600">
                      Best practice for a single trip: create the trip first, then add only its own cargo items from the Trip Cargo tab or Cargo module with this trip preselected.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-sm">
                   <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle2 size={20} /></div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Review & Finalize</h2>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Save size={16} /> Summary</h3>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">trip_number</span><span className="font-bold text-gray-700">Auto-generated on create</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Route</span><span className="font-bold text-gray-700">{primaryRoutePreview.origin_address && primaryRoutePreview.destination_address ? `${primaryRoutePreview.origin_address} → ${primaryRoutePreview.destination_address}` : 'Not fully specified'}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">trip_type</span><span className="font-bold text-gray-700">{formData.trip_type}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">status</span><span className="font-bold text-blue-600">{formData.status}</span></div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">LR-wise Summary</h4>
                    <div className="space-y-2">
                      {selectedOrders.map((o) => {
                        const route = routesByOrder[o.id] || buildRouteState(o.id);
                        return (
                          <details key={o.id} className="rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-2">
                            <summary className="cursor-pointer text-xs font-bold text-[#172B4D]">{o.lr_number}</summary>
                            <p className="text-xs text-gray-600 mt-2">{route.origin_address || '—'} {'->'} {route.destination_address || '—'}</p>
                            <p className="text-xs text-gray-500 mt-1">Stops: {(route.stops || []).filter((s) => (s.location_address || '').trim()).length}</p>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <FieldGroup label="version"><input type="number" name="version" className={inputClass} value={formData.version} onChange={handleInputChange} /></FieldGroup>
                  </div>
                  <FieldGroup label="remarks">
                    <textarea name="remarks" rows="4" className={inputClass} value={formData.remarks} onChange={handleInputChange} placeholder="Any final details for the execution team..." />
                  </FieldGroup>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-[#4a6cf7] shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      By submitting this form, you are initializing a new journey lifecycle in the TMS Command Center. Resources will be tentatively locked for this shipment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <button 
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-all disabled:opacity-0"
              >
                <ChevronLeft size={18} /> Previous Step
              </button>
              
              <div className="flex gap-4">
                {currentStep < steps.length ? (
                  <button 
                    key="next-btn"
                    type="button"
                    onClick={handleNext}
                    disabled={hasErrors || (currentStep === 3 && stopErrors.length > 0)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#4a6cf7] text-white font-bold text-sm rounded-xl hover:bg-[#3b59d9] shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    Next Step <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    key="submit-btn"
                    type="submit"
                    disabled={createTripMutation.isPending || hasErrors}
                    className="flex items-center gap-2 px-10 py-2.5 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    {createTripMutation.isPending ? 'Syncing...' : 'Create Trip'} <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
