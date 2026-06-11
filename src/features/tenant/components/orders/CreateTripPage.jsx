import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { 
  ChevronLeft, ChevronRight, Save, X, FileText, Truck, 
  MapPin, Gauge, DollarSign, CheckCircle2, AlertCircle, GripVertical, Circle, Package
} from 'lucide-react';
import { useCreateTrip, useOrders, useTrips, orderKeys } from '../../queries/orders/ordersQuery';
import { useDrivers } from '../../queries/drivers/driverCoreQuery';
import { useVehicles } from '../../queries/vehicles/vehicleQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';
import { toast } from 'react-hot-toast';
import { tripsApi, ordersApi } from '../../api/orders/ordersEndpoint';
import LRTabStrip from './trip/LRTabStrip';
import ScopeBadge from './trip/ScopeBadge';
import {
  toInputDate,
  formatDate,
  formatDateTime,
  DATE_INPUT_PLACEHOLDER,
} from '@/utils/dateFormat';

/** Shows selected date in dd/MM/yyyy below native date inputs. */
const DateFieldHint = ({ value, prefix }) => {
  if (!value) return null;
  return (
    <p className="text-[10px] text-gray-500 mt-1">
      {prefix ? `${prefix} ` : ''}
      <span className="font-semibold text-gray-700">{formatDate(value)}</span>
      <span className="text-gray-400 ml-1">({DATE_INPUT_PLACEHOLDER})</span>
    </p>
  );
};

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

const buildRouteState = (
  orderId = null,
  origin = '',
  destination = '',
  scheduledPickup = null,
  scheduledDelivery = null
) => ({
  order_id: orderId,
  origin_address: origin,
  destination_address: destination,
  scheduled_pickup_date: scheduledPickup,
  scheduled_delivery_date: scheduledDelivery,
  actual_pickup_date: null,
  actual_delivery_date: null,
  start_time: null,
  end_time: null,
  stops: [
    { stop_type: 'PICKUP', location_address: origin, order_id: orderId, instructions: '', scheduled_arrival: '', scheduled_departure: '' },
    { stop_type: 'DELIVERY', location_address: destination, order_id: orderId, instructions: '', scheduled_arrival: '', scheduled_departure: '' },
  ],
});

/** Merge LR booking fields into per-LR route state (addresses + schedule dates). */
const syncRouteFromOrder = (order, route, { onlyIfEmpty = true } = {}) => {
  if (!order) return route;
  const pickup = toInputDate(order.pickup_date);
  const delivery = toInputDate(order.delivery_date);
  const origin = order.consignor_address || '';
  const destination = order.consignee_address || '';

  const nextPickup = onlyIfEmpty && route.scheduled_pickup_date ? route.scheduled_pickup_date : (pickup || route.scheduled_pickup_date || null);
  const nextDelivery = onlyIfEmpty && route.scheduled_delivery_date ? route.scheduled_delivery_date : (delivery || route.scheduled_delivery_date || null);
  const nextOrigin = onlyIfEmpty && route.origin_address?.trim() ? route.origin_address : (origin || route.origin_address || '');
  const nextDestination = onlyIfEmpty && route.destination_address?.trim() ? route.destination_address : (destination || route.destination_address || '');

  const stops = [...(route.stops || [])];
  if (stops.length > 0) {
    stops[0] = {
      ...stops[0],
      stop_type: 'PICKUP',
      location_address: nextOrigin,
      order_id: route.order_id || order.id,
    };
  }
  if (stops.length > 1) {
    const lastIdx = stops.length - 1;
    stops[lastIdx] = {
      ...stops[lastIdx],
      stop_type: 'DELIVERY',
      location_address: nextDestination,
      order_id: route.order_id || order.id,
    };
  }

  return {
    ...route,
    order_id: route.order_id || order.id,
    origin_address: nextOrigin,
    destination_address: nextDestination,
    scheduled_pickup_date: nextPickup,
    scheduled_delivery_date: nextDelivery,
    stops,
  };
};

const DEFAULT_LR_FINANCE = {
  freight_charge: '',
  accessorial_charge: '',
  tax: '',
  bill_amount: '',
  booked_price: '',
  tds_percentage: '0',
  tds_amount: '',
  broker_commission: '',
  net_payable: '',
  incentive_amount: '',
  late_fee: '',
  part_load_charge: '',
  damage_amount: '',
  payment_received_amount: '',
  payment_received_date: null,
  pod_received_date: null,
  is_billed: false,
  is_paid: false,
};

const parseMoney = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const calcLRFinance = (lrf, ownershipType) => {
  const bill = (
    parseMoney(lrf.freight_charge) +
    parseMoney(lrf.accessorial_charge) +
    parseMoney(lrf.tax)
  ).toFixed(2);
  const isHired = ownershipType === 'HIRED_CARRIER';
  const tds = isHired
    ? ((parseMoney(lrf.booked_price) * parseMoney(lrf.tds_percentage)) / 100).toFixed(2)
    : '0';
  const net = isHired
    ? (parseMoney(lrf.booked_price) - parseMoney(tds) - parseMoney(lrf.broker_commission)).toFixed(2)
    : '0';
  return { ...lrf, bill_amount: bill, tds_amount: tds, net_payable: net };
};

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
    vehicle_ownership_type: "OWN_FLEET",
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
    remarks: "", version: 1
  });
  const [financeByOrder, setFinanceByOrder] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [routeFieldErrors, setRouteFieldErrors] = useState({});
  const [step3Alert, setStep3Alert] = useState('');
  const [activeRouteOrderId, setActiveRouteOrderId] = useState(null);
  const [routesByOrder, setRoutesByOrder] = useState({});
  const selectedOrders = useMemo(
    () => orders.filter((o) => (formData.order_ids || []).includes(String(o.id))),
    [orders, formData.order_ids]
  );
  const selectedOrder = selectedOrders[0] || null;
  const financeOrderQueries = useQueries({
    queries: selectedOrders.map((order) => ({
      queryKey: orderKeys.detail(order.id),
      queryFn: () => ordersApi.get(order.id),
      enabled: !!order?.id,
      staleTime: 60_000,
    })),
  });
  const financeOrderById = useMemo(
    () =>
      selectedOrders.reduce((acc, order, index) => {
        acc[String(order.id)] = financeOrderQueries[index]?.data || order;
        return acc;
      }, {}),
    [selectedOrders, financeOrderQueries]
  );
  const activeFinanceOrder =
    financeOrderById[String(activeRouteOrderId)] ||
    financeOrderById[String(selectedOrder?.id)] ||
    selectedOrder;
  const isHiredCarrier = formData.vehicle_ownership_type === 'HIRED_CARRIER';
  const activeFinance = calcLRFinance(
    financeByOrder[activeRouteOrderId] || DEFAULT_LR_FINANCE,
    formData.vehicle_ownership_type
  );
  const financeSummary = useMemo(() => {
    const rows = (formData.order_ids || []).map((id) => {
      const order = selectedOrders.find((o) => String(o.id) === String(id));
      const fin = calcLRFinance(financeByOrder[id] || DEFAULT_LR_FINANCE, formData.vehicle_ownership_type);
      return { id, order, fin };
    });
    const totals = rows.reduce(
      (acc, { fin }) => ({
        bill_amount: acc.bill_amount + parseMoney(fin.bill_amount),
        booked_price: acc.booked_price + parseMoney(fin.booked_price),
        tds_amount: acc.tds_amount + parseMoney(fin.tds_amount),
        net_payable: acc.net_payable + parseMoney(fin.net_payable),
        payment_received_amount: acc.payment_received_amount + parseMoney(fin.payment_received_amount),
      }),
      { bill_amount: 0, booked_price: 0, tds_amount: 0, net_payable: 0, payment_received_amount: 0 }
    );
    return { rows, totals };
  }, [formData.order_ids, financeByOrder, selectedOrders, formData.vehicle_ownership_type]);

  /** Route schedule fields are validated per-LR in routesByOrder, not via formData fieldErrors. */
  const ROUTE_SCOPED_ERROR_KEYS = new Set([
    'scheduled_pickup_date',
    'scheduled_delivery_date',
    'actual_pickup_date',
    'actual_delivery_date',
    'start_time',
    'end_time',
  ]);
  const hasBlockingFieldErrors = Object.entries(fieldErrors).some(
    ([key, err]) => err && err !== '' && !ROUTE_SCOPED_ERROR_KEYS.has(key)
  );
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

      if (name === 'vehicle_ownership_type' && value !== 'HIRED_CARRIER') {
        setFinanceByOrder((prevFin) => {
          const updated = { ...prevFin };
          Object.keys(updated).forEach((oid) => {
            updated[oid] = calcLRFinance(
              {
                ...updated[oid],
                booked_price: '',
                tds_percentage: '0',
                tds_amount: '0',
                broker_commission: '',
                net_payable: '0',
              },
              value
            );
          });
          return updated;
        });
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

      const err = ROUTE_SCOPED_ERROR_KEYS.has(name) ? '' : validateField(name, next[name], next);
      const vehiclePairErr = validateField('alternate_vehicle_id', next.alternate_vehicle_id, next);
      const driverPairErr = validateField('alternate_driver_id', next.alternate_driver_id, next);
      setFieldErrors((p) => {
        const merged = {
          ...p,
          [name]: err,
          primary_vehicle_id: vehiclePairErr,
          alternate_vehicle_id: vehiclePairErr,
          primary_driver_id: driverPairErr,
          alternate_driver_id: driverPairErr,
        };
        ROUTE_SCOPED_ERROR_KEYS.forEach((key) => {
          delete merged[key];
        });
        return merged;
      });
      return next;
    });
  };

  const handleOrdersChange = (ids) => {
    const selected = orders.filter(o => ids.includes(String(o.id)));
    const firstOrder = selected[0];
    const lastOrder = selected[selected.length - 1] || firstOrder;
    const newOrigin = firstOrder?.consignor_address || "";
    const newDest = lastOrder?.consignee_address || "";
    const newPickup = toInputDate(firstOrder?.pickup_date);
    const newDelivery = toInputDate(lastOrder?.delivery_date);

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
      scheduled_pickup_date: newPickup,
      scheduled_delivery_date: newDelivery,
    }));
    setRoutesByOrder(prev => {
      const next = {};
      ids.forEach((id) => {
        const order = selected.find(o => String(o.id) === String(id));
        const pickup = toInputDate(order?.pickup_date);
        const delivery = toInputDate(order?.delivery_date);
        const base =
          prev[id] ||
          buildRouteState(
            id,
            order?.consignor_address || '',
            order?.consignee_address || '',
            pickup,
            delivery
          );
        next[id] = syncRouteFromOrder(order, base, { onlyIfEmpty: Boolean(prev[id]) });
      });
      return next;
    });
    setActiveRouteOrderId(ids[0] || null);
    setFinanceByOrder((prev) => {
      const next = {};
      ids.forEach((id) => {
        const order = selected.find((o) => String(o.id) === String(id));
        if (prev[id]) {
          next[id] = prev[id];
        } else {
          next[id] = calcLRFinance(
            {
              ...DEFAULT_LR_FINANCE,
              freight_charge: order?.freight_charges != null ? String(order.freight_charges) : '',
            },
            formData.vehicle_ownership_type
          );
        }
      });
      return next;
    });
    setFieldErrors((p) => {
      const merged = { ...p };
      ROUTE_SCOPED_ERROR_KEYS.forEach((key) => {
        delete merged[key];
      });
      return merged;
    });
  };

  const handleFinanceFieldChange = (orderId, name, value) => {
    setFinanceByOrder((prev) => {
      const current = prev[orderId] || { ...DEFAULT_LR_FINANCE };
      const updated = calcLRFinance(
        { ...current, [name]: value },
        formData.vehicle_ownership_type
      );
      return { ...prev, [orderId]: updated };
    });
  };

  const handleOwnershipChange = (value) => {
    setFormData((prev) => ({ ...prev, vehicle_ownership_type: value }));
    if (value !== 'HIRED_CARRIER') {
      setFinanceByOrder((prevFin) => {
        const updated = { ...prevFin };
        Object.keys(updated).forEach((oid) => {
          updated[oid] = calcLRFinance(
            {
              ...updated[oid],
              booked_price: '',
              tds_percentage: '0',
              tds_amount: '0',
              broker_commission: '',
              net_payable: '0',
            },
            value
          );
        });
        return updated;
      });
    }
  };

  // When switching LR tab on Route & Schedule, fill missing route fields from that LR.
  useEffect(() => {
    if (!activeRouteOrderId) return;
    const order = selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId));
    if (!order) return;
    setRoutesByOrder((prev) => {
      const current = prev[activeRouteOrderId];
      if (!current) return prev;
      const synced = syncRouteFromOrder(order, current, { onlyIfEmpty: true });
      if (
        synced.origin_address === current.origin_address &&
        synced.destination_address === current.destination_address &&
        synced.scheduled_pickup_date === current.scheduled_pickup_date &&
        synced.scheduled_delivery_date === current.scheduled_delivery_date
      ) {
        return prev;
      }
      return { ...prev, [activeRouteOrderId]: synced };
    });
  }, [activeRouteOrderId, selectedOrders]);

  const enrichStopsForValidation = (stops = [], route = {}) => {
    const list = stops || [];
    return list.map((stop, idx) => {
      let location = (stop.location_address || '').trim();
      if (!location && idx === 0) location = (route.origin_address || '').trim();
      if (!location && idx === list.length - 1 && list.length > 1) {
        location = (route.destination_address || '').trim();
      }
      return { ...stop, location_address: location, idx };
    });
  };

  const computeStopErrors = (stops = [], route = {}) => {
    const enriched = enrichStopsForValidation(stops, route);
    const withAddress = enriched.filter((s) => s.location_address);

    const pickupIndices = withAddress.filter((s) => s.stop_type === 'PICKUP').map((s) => s.idx);
    const deliveryIndices = withAddress.filter((s) => s.stop_type === 'DELIVERY').map((s) => s.idx);

    const errors = [];
    if (pickupIndices.length === 0) errors.push('Add at least one pickup stop (Origin or stop).');
    if (deliveryIndices.length === 0) errors.push('Add at least one delivery stop (Destination or stop).');

    if (pickupIndices.length > 0 && deliveryIndices.length > 0) {
      const lastPickupIdx = Math.max(...pickupIndices);
      const invalidDelivery = deliveryIndices.some((i) => i <= lastPickupIdx);
      if (invalidDelivery) errors.push('All delivery stops must come after pickup stops.');
    }

    enriched.forEach((stop) => {
      const isMiddleRow = stop.idx > 0 && stop.idx < enriched.length - 1;
      const hasPartialData =
        Boolean(stop.instructions?.trim()) ||
        Boolean(stop.scheduled_arrival) ||
        Boolean(stop.scheduled_departure);
      if (isMiddleRow && (hasPartialData || stop.stop_type !== 'PICKUP') && !stop.location_address) {
        errors.push(`Stop #${stop.idx + 1}: location address is required.`);
      }
      if (
        stop.scheduled_arrival &&
        stop.scheduled_departure &&
        stop.scheduled_departure < stop.scheduled_arrival
      ) {
        errors.push(`Stop #${stop.idx + 1}: ETD cannot be before ETA.`);
      }
    });

    return errors;
  };

  const validateStops = (stops = [], route = {}) => {
    const errors = computeStopErrors(stops, route);
    setStopErrors(errors);
    return errors.length === 0;
  };

  /** Match order-service TripWriteSerializer: trip dates must stay within each linked LR booking window. */
  const validateRouteAgainstLinkedOrder = (route = {}, order = null) => {
    const errors = {};
    if (!order) return errors;
    const orderPickup = toInputDate(order.pickup_date);
    const orderDelivery = toInputDate(order.delivery_date);
    if (route.scheduled_pickup_date && orderPickup && route.scheduled_pickup_date < orderPickup) {
      errors.scheduled_pickup_date = `Cannot be before LR pickup date (${formatDate(orderPickup)}).`;
    }
    if (route.scheduled_delivery_date && orderDelivery && route.scheduled_delivery_date > orderDelivery) {
      errors.scheduled_delivery_date = `Cannot be after LR delivery date (${formatDate(orderDelivery)}).`;
    }
    return errors;
  };

  const validateTripScheduleAgainstAllOrders = (pickup, delivery, orderIds = []) => {
    const messages = [];
    const fieldErrorsByOrder = {};
    orderIds.forEach((id) => {
      const order = selectedOrders.find((o) => String(o.id) === String(id));
      if (!order) return;
      const lrLabel = order.lr_number || String(id).slice(-8);
      const orderPickup = toInputDate(order.pickup_date);
      const orderDelivery = toInputDate(order.delivery_date);
      const key = String(id);
      if (pickup && orderPickup && pickup < orderPickup) {
        messages.push(
          `LR ${lrLabel}: Trip pickup cannot be before order pickup date (${formatDate(orderPickup)}).`
        );
        fieldErrorsByOrder[key] = {
          ...(fieldErrorsByOrder[key] || {}),
          scheduled_pickup_date: `Must be on or after LR pickup (${formatDate(orderPickup)}).`,
        };
      }
      if (delivery && orderDelivery && delivery > orderDelivery) {
        messages.push(
          `LR ${lrLabel}: Trip delivery cannot be after order delivery date (${formatDate(orderDelivery)}).`
        );
        fieldErrorsByOrder[key] = {
          ...(fieldErrorsByOrder[key] || {}),
          scheduled_delivery_date: `Must be on or before LR delivery (${formatDate(orderDelivery)}).`,
        };
      }
    });
    return { messages, fieldErrorsByOrder };
  };

  const validateRouteSchedule = (route = {}, order = null) => {
    const errors = {};
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    if (!route.origin_address?.trim()) errors.origin_address = 'Origin address is required.';
    if (!route.destination_address?.trim()) errors.destination_address = 'Destination address is required.';
    if (!route.scheduled_pickup_date) errors.scheduled_pickup_date = 'Scheduled pickup date is required.';
    if (!route.scheduled_delivery_date) errors.scheduled_delivery_date = 'Scheduled delivery date is required.';
    if (
      route.scheduled_pickup_date &&
      route.scheduled_delivery_date &&
      route.scheduled_delivery_date < route.scheduled_pickup_date
    ) {
      errors.scheduled_delivery_date = 'Scheduled delivery cannot be before scheduled pickup.';
    }
    if (route.actual_pickup_date && route.actual_pickup_date > today) {
      errors.actual_pickup_date = 'Actual pickup cannot be in the future.';
    }
    if (route.actual_delivery_date && route.actual_delivery_date > today) {
      errors.actual_delivery_date = 'Actual delivery cannot be in the future.';
    }
    if (
      route.actual_pickup_date &&
      route.actual_delivery_date &&
      route.actual_delivery_date < route.actual_pickup_date
    ) {
      errors.actual_delivery_date = 'Actual delivery cannot be before actual pickup.';
    }
    if (route.start_time && route.end_time && route.end_time < route.start_time) {
      errors.end_time = 'End time cannot be before start time.';
    }
    Object.assign(errors, validateRouteAgainstLinkedOrder(route, order));
    return errors;
  };

  const getRouteValidationTargets = () => {
    const ids = formData.order_ids?.length ? formData.order_ids : [];
    if (ids.length) {
      return ids.map((id) => ({
        orderId: String(id),
        route: routesByOrder[id] || buildRouteState(id),
        lrNumber: selectedOrders.find((o) => String(o.id) === String(id))?.lr_number,
        order: selectedOrders.find((o) => String(o.id) === String(id)),
      }));
    }
    const fallbackId = activeRouteOrderId || '_route';
    return [
      {
        orderId: String(fallbackId),
        route: routesByOrder[fallbackId] || activeRoute,
        lrNumber: null,
      },
    ];
  };

  const validateStep3 = () => {
    const targets = getRouteValidationTargets();
    const allRouteErrors = {};
    const messages = [];
    let firstInvalidOrderId = null;

    targets.forEach(({ orderId, route, lrNumber, order }) => {
      const stopErrs = computeStopErrors(route.stops || [], route);
      const fieldErrs = validateRouteSchedule(route, order);
      const prefix = lrNumber ? `LR ${lrNumber}: ` : '';

      if (stopErrs.length || Object.keys(fieldErrs).length) {
        allRouteErrors[orderId] = { ...(allRouteErrors[orderId] || {}), ...fieldErrs };
        if (!firstInvalidOrderId) firstInvalidOrderId = orderId;
        stopErrs.forEach((msg) => messages.push(`${prefix}${msg}`));
        Object.values(fieldErrs).forEach((msg) => messages.push(`${prefix}${msg}`));
      }
    });

    const primaryId = formData.order_ids?.[0];
    if (primaryId) {
      const tripRoute = routesByOrder[primaryId] || {};
      const { messages: crossOrderMsgs, fieldErrorsByOrder: crossOrderFieldErrors } =
        validateTripScheduleAgainstAllOrders(
          tripRoute.scheduled_pickup_date,
          tripRoute.scheduled_delivery_date,
          formData.order_ids
        );
      crossOrderMsgs.forEach((msg) => messages.push(msg));
      Object.entries(crossOrderFieldErrors).forEach(([oid, errs]) => {
        allRouteErrors[oid] = { ...(allRouteErrors[oid] || {}), ...errs };
        if (!firstInvalidOrderId) firstInvalidOrderId = oid;
      });
    }

    setRouteFieldErrors(allRouteErrors);
    if (firstInvalidOrderId) {
      setActiveRouteOrderId(firstInvalidOrderId);
      const activeRouteForStops = routesByOrder[firstInvalidOrderId] || activeRoute;
      validateStops(activeRouteForStops?.stops || [], activeRouteForStops);
      setStep3Alert(messages.slice(0, 4).join(' • '));
      toast.error(messages[0] || 'Please fix route and schedule errors before continuing.');
      return false;
    }

    setStep3Alert('');
    setStopErrors([]);
    return true;
  };

  const applyRouteFieldValidation = (orderId, route, { updateBanner = false } = {}) => {
    if (!orderId) return;
    const key = String(orderId);
    const order = selectedOrders.find((o) => String(o.id) === key);
    const fieldErrs = validateRouteSchedule(route, order);
    const stopErrs = computeStopErrors(route.stops || [], route);
    setRouteFieldErrors((prev) => ({ ...prev, [key]: fieldErrs }));
    if (key === String(activeRouteOrderId)) {
      setStopErrors(stopErrs);
    }
    if (updateBanner && !Object.keys(fieldErrs).length && !stopErrs.length) {
      setStep3Alert('');
    }
  };

  const updateActiveRoute = (updater) => {
    if (!activeRouteOrderId) return;
    setRoutesByOrder((prev) => {
      const current = prev[activeRouteOrderId] || buildRouteState(activeRouteOrderId);
      const nextRoute = typeof updater === 'function' ? updater(current) : updater;
      applyRouteFieldValidation(activeRouteOrderId, nextRoute);
      return { ...prev, [activeRouteOrderId]: nextRoute };
    });
  };

  const activeRouteFieldErrors = routeFieldErrors[String(activeRouteOrderId)] || {};
  const activeScheduleOrder = selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId));
  const activeOrderPickup = toInputDate(activeScheduleOrder?.pickup_date);
  const activeOrderDelivery = toInputDate(activeScheduleOrder?.delivery_date);

  const handleRouteFieldChange = (name, value) => {
    if (!activeRouteOrderId) return;
    setRoutesByOrder((prev) => {
      const current = prev[activeRouteOrderId] || buildRouteState(activeRouteOrderId);
      const next = { ...current, [name]: value };
      if (name === 'origin_address' || name === 'destination_address') {
        const stops = [...(current.stops || [])];
        if (stops.length > 0) {
          stops[0] = {
            ...stops[0],
            stop_type: 'PICKUP',
            order_id: current.order_id || activeRouteOrderId || null,
            location_address: name === 'origin_address' ? value : (stops[0].location_address || ''),
          };
        }
        if (stops.length > 1) {
          const lastIdx = stops.length - 1;
          stops[lastIdx] = {
            ...stops[lastIdx],
            stop_type: 'DELIVERY',
            order_id: current.order_id || activeRouteOrderId || null,
            location_address: name === 'destination_address' ? value : (stops[lastIdx].location_address || ''),
          };
        }
        next.stops = stops;
      }
      applyRouteFieldValidation(activeRouteOrderId, next);
      return { ...prev, [activeRouteOrderId]: next };
    });
  };

  const handleNext = () => {
    if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      return;
    }
    if (currentStep === 2 && hasBlockingFieldErrors) {
      toast.error('Fix fleet and team errors before continuing.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep < steps.length) {
      handleNext();
      return;
    }

    const primaryOrderId = formData.order_ids?.[0] || activeRouteOrderId || null;
    const routeKey = primaryOrderId ? String(primaryOrderId) : '_route';
    const fallbackRoute = Object.values(routesByOrder || {}).find(Boolean) || null;
    const primaryRoute =
      routesByOrder[primaryOrderId] ||
      routesByOrder[routeKey] ||
      fallbackRoute ||
      buildRouteState(primaryOrderId);

    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    const vehiclePairErr = validateField('alternate_vehicle_id', formData.alternate_vehicle_id, formData);
    const driverPairErr = validateField('alternate_driver_id', formData.alternate_driver_id, formData);
    const routeTimeCtx = {
      start_time: primaryRoute.start_time,
      end_time: primaryRoute.end_time,
      scheduled_pickup_date: primaryRoute.scheduled_pickup_date,
      scheduled_delivery_date: primaryRoute.scheduled_delivery_date,
      actual_pickup_date: primaryRoute.actual_pickup_date,
      actual_delivery_date: primaryRoute.actual_delivery_date,
    };
    const scheduledDateErr = validateField('scheduled_delivery_date', primaryRoute.scheduled_delivery_date, routeTimeCtx);
    const actualDateErr = validateField('actual_delivery_date', primaryRoute.actual_delivery_date, routeTimeCtx);
    const actualPickupErr = validateField('actual_pickup_date', primaryRoute.actual_pickup_date, routeTimeCtx);
    const startTimeErr = validateField('start_time', primaryRoute.start_time, routeTimeCtx);
    const endTimeErr = validateField('end_time', primaryRoute.end_time, routeTimeCtx);

    if (vehiclePairErr || driverPairErr) {
      setFieldErrors((p) => ({
        ...p,
        primary_vehicle_id: vehiclePairErr,
        alternate_vehicle_id: vehiclePairErr,
        primary_driver_id: driverPairErr,
        alternate_driver_id: driverPairErr,
      }));
      toast.error(vehiclePairErr || driverPairErr || 'Fix fleet and team errors.');
      setCurrentStep(2);
      return;
    }
    if (scheduledDateErr || actualPickupErr || actualDateErr || startTimeErr || endTimeErr) {
      setRouteFieldErrors((p) => ({
        ...p,
        [routeKey]: {
          ...(p[routeKey] || {}),
          scheduled_delivery_date: scheduledDateErr,
          actual_pickup_date: actualPickupErr,
          actual_delivery_date: actualDateErr,
          start_time: startTimeErr,
          end_time: endTimeErr,
        },
      }));
      toast.error(
        scheduledDateErr ||
          actualPickupErr ||
          actualDateErr ||
          startTimeErr ||
          endTimeErr ||
          'Fix route and schedule errors.'
      );
      setCurrentStep(3);
      return;
    }
    const scheduledPickupDate = primaryRoute.scheduled_pickup_date || formData.scheduled_pickup_date || null;
    const scheduledDeliveryDate = primaryRoute.scheduled_delivery_date || formData.scheduled_delivery_date || null;

    if (!scheduledPickupDate || !scheduledDeliveryDate) {
      setRouteFieldErrors((p) => ({
        ...p,
        [routeKey]: {
          ...(p[routeKey] || {}),
          scheduled_pickup_date: !scheduledPickupDate ? 'Scheduled pickup date is required' : '',
          scheduled_delivery_date: !scheduledDeliveryDate ? 'Scheduled delivery date is required' : '',
        },
      }));
      setStep3Alert('Scheduled pickup and delivery dates are required.');
      toast.error('Scheduled pickup and delivery dates are required.');
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
      vehicle_ownership_type: formData.vehicle_ownership_type || 'OWN_FLEET',
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
      created_date: toInputDate(formData.created_date) || new Date().toISOString().split('T')[0],
      lr_finance: (formData.order_ids || []).map((orderId) => {
        const fin = calcLRFinance(financeByOrder[orderId] || DEFAULT_LR_FINANCE, formData.vehicle_ownership_type);
        const isHired = formData.vehicle_ownership_type === 'HIRED_CARRIER';
        return {
          order_id: orderId,
          freight_charge: parseMoney(fin.freight_charge),
          accessorial_charge: parseMoney(fin.accessorial_charge),
          tax: parseMoney(fin.tax),
          booked_price: isHired ? parseMoney(fin.booked_price) : 0,
          tds_percentage: isHired ? parseMoney(fin.tds_percentage) : 0,
          broker_commission: isHired ? parseMoney(fin.broker_commission) : 0,
          incentive_amount: parseMoney(fin.incentive_amount),
          late_fee: parseMoney(fin.late_fee),
          part_load_charge: parseMoney(fin.part_load_charge),
          damage_amount: parseMoney(fin.damage_amount),
          payment_received_amount: parseMoney(fin.payment_received_amount),
          payment_received_date: toInputDate(fin.payment_received_date) || null,
          pod_received_date: toInputDate(fin.pod_received_date) || null,
          is_billed: Boolean(fin.is_billed),
          is_paid: Boolean(fin.is_paid),
        };
      }),
    };
    ['lr_number', 'version'].forEach((key) => {
      delete payload[key];
    });
    try {
      const createdTrip = await createTripMutation.mutateAsync(payload);
      const tripId = createdTrip?.id;

      if (!tripId) {
        toast.error('Trip could not be created. Please try again.');
        return;
      }

      const stopPayloads = (formData.order_ids || []).flatMap((orderId) => {
        const route = routesByOrder[orderId];
        const enriched = enrichStopsForValidation(route?.stops || [], route || {});
        return enriched.map((s) => ({
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

      try {
        for (const stop of stopPayloads) {
          await tripsApi.createStop(tripId, stop);
        }
      } catch {
        toast.error('Trip created, but some stops could not be saved. Opening trip detail.');
      }

      navigate(`/tenant/dashboard/orders/trips/${tripId}`);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.message;
      if (msg && typeof msg === 'string') {
        toast.error(msg);
      }
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
      return { ...route, stops: next };
    });
  };

  const removeStopRow = (index) => {
    updateActiveRoute((route) => {
      const prev = route.stops || [];
      const next = prev.filter((_, i) => i !== index);
      return { ...route, stops: next };
    });
  };

  const updateStopRow = (index, key, value) => {
    updateActiveRoute((route) => {
      const prev = route.stops || [];
      const next = prev.map((s, i) => (
        i === index ? { ...s, [key]: value, order_id: route.order_id || activeRouteOrderId || s.order_id || null } : s
      ));
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
                              <span>
                                {o.lr_number} - {o.status}
                                {o.pickup_date || o.delivery_date ? (
                                  <span className="text-gray-400 font-normal">
                                    {' '}
                                    · {formatDate(o.pickup_date)} → {formatDate(o.delivery_date)}
                                  </span>
                                ) : null}
                              </span>
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
                            <p className="font-black text-amber-800 uppercase tracking-wider">Pickup (from LR)</p>
                            <p className="text-gray-700 mt-1 font-semibold">
                              {formatDate(selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.pickup_date) || '—'}
                            </p>
                            <p className="text-gray-600 mt-1">{selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.consignor_address || '—'}</p>
                          </div>
                          <div className="rounded-lg border border-amber-100 bg-amber-50 p-2">
                            <p className="font-black text-amber-800 uppercase tracking-wider">Delivery (from LR)</p>
                            <p className="text-gray-700 mt-1 font-semibold">
                              {formatDate(selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.delivery_date) || '—'}
                            </p>
                            <p className="text-gray-600 mt-1">{selectedOrders.find((o) => String(o.id) === String(activeRouteOrderId))?.consignee_address || '—'}</p>
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

                  <GroupHeader title="Vehicle Ownership" />
                  <div className="border-x border-b border-gray-200 rounded-b-2xl bg-white px-5 py-4 mb-6 space-y-3">
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="vehicle_ownership_type"
                          value="OWN_FLEET"
                          checked={formData.vehicle_ownership_type === 'OWN_FLEET'}
                          onChange={() => handleOwnershipChange('OWN_FLEET')}
                          className="w-4 h-4 text-[#4a6cf7] border-gray-300"
                        />
                        <span className="text-sm font-bold text-gray-700">Own Fleet</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="vehicle_ownership_type"
                          value="HIRED_CARRIER"
                          checked={formData.vehicle_ownership_type === 'HIRED_CARRIER'}
                          onChange={() => handleOwnershipChange('HIRED_CARRIER')}
                          className="w-4 h-4 text-[#4a6cf7] border-gray-300"
                        />
                        <span className="text-sm font-bold text-gray-700">Hired Carrier</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {isHiredCarrier
                        ? 'External carrier hired. Booked price, TDS, and broker commission are entered per LR in Step 5.'
                        : 'Your company owns this truck. Carrier billing is not applicable — fuel and driver costs go via Expenses.'}
                    </p>
                  </div>

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
                     <FieldGroup label="vehicle_owner_name">
                       <input
                         type="text"
                         name="vehicle_owner_name"
                         className={`${inputClass}${!isHiredCarrier ? ' !bg-gray-50' : ''}`}
                         value={formData.vehicle_owner_name}
                         onChange={handleInputChange}
                         readOnly={!isHiredCarrier}
                         placeholder={isHiredCarrier ? 'Carrier / owner name' : 'Auto from company'}
                       />
                     </FieldGroup>
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
                    <div className="mb-2 space-y-3">
                      <LRTabStrip
                        linkedOrders={selectedOrders.map((o) => ({ order_id: o.id, lr_number: o.lr_number }))}
                        activeOrderId={activeRouteOrderId}
                        onChange={(id) => {
                          setActiveRouteOrderId(id);
                          setStep3Alert('');
                        }}
                      />
                      {activeScheduleOrder && (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                            <p className="font-black text-blue-800 uppercase tracking-wider">LR Pickup Date</p>
                            <p className="text-gray-800 mt-1 font-semibold">
                              {activeScheduleOrder?.pickup_date ? formatDate(activeScheduleOrder.pickup_date) : '—'}
                            </p>
                            <p className="text-[10px] text-blue-700 mt-1">Trip pickup must be on or after this date.</p>
                          </div>
                          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                            <p className="font-black text-blue-800 uppercase tracking-wider">LR Delivery Date</p>
                            <p className="text-gray-800 mt-1 font-semibold">
                              {activeScheduleOrder?.delivery_date ? formatDate(activeScheduleOrder.delivery_date) : '—'}
                            </p>
                            <p className="text-[10px] text-blue-700 mt-1">Trip delivery must be on or before this date.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(formData.order_ids || []).length > 1 && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 font-medium">
                      This trip uses the <strong>first linked LR</strong> schedule when saving
                      {primaryRoutePreview.scheduled_pickup_date || primaryRoutePreview.scheduled_delivery_date ? (
                        <>
                          {' '}
                          (
                          {formatDate(primaryRoutePreview.scheduled_pickup_date)} →{' '}
                          {formatDate(primaryRoutePreview.scheduled_delivery_date)}
                          )
                        </>
                      ) : null}
                      . Those dates must be valid for every LR on the trip.
                    </p>
                  )}
                  {step3Alert && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Fix the following before continuing</p>
                        <p className="text-xs mt-1 font-medium">{step3Alert}</p>
                      </div>
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
                          className={`${inputClass} !bg-white focus:shadow-lg focus:shadow-blue-50/50 transition-all !resize-none ${activeRouteFieldErrors.origin_address ? 'border-red-300' : ''}`} 
                          value={activeRoute.origin_address || ""} 
                          onChange={(e) => handleRouteFieldChange('origin_address', e.target.value)} 
                          placeholder="Enter starting point..." 
                        />
                        {activeRouteFieldErrors.origin_address && (
                          <p className="text-[10px] text-red-500 font-bold mt-1">{activeRouteFieldErrors.origin_address}</p>
                        )}
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest absolute -top-6 left-0 flex items-center gap-2">
                          <MapPin size={10} className="text-[#10b981]" /> Destination address
                        </label>
                        <textarea 
                          name="destination_address" 
                          rows="2" 
                          className={`${inputClass} !bg-white focus:shadow-lg focus:shadow-emerald-50/50 transition-all !resize-none ${activeRouteFieldErrors.destination_address ? 'border-red-300' : ''}`} 
                          value={activeRoute.destination_address || ""} 
                          onChange={(e) => handleRouteFieldChange('destination_address', e.target.value)} 
                          placeholder="Enter drop-off point..." 
                        />
                        {activeRouteFieldErrors.destination_address && (
                          <p className="text-[10px] text-red-500 font-bold mt-1">{activeRouteFieldErrors.destination_address}</p>
                        )}
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
                      <FieldGroup label="scheduled_pickup_date" required error={activeRouteFieldErrors.scheduled_pickup_date}>
                        <input
                          type="date"
                          name="scheduled_pickup_date"
                          className={inputClass}
                          min={activeOrderPickup || undefined}
                          value={activeRoute.scheduled_pickup_date || ""}
                          onChange={(e) => handleRouteFieldChange('scheduled_pickup_date', e.target.value)}
                        />
                        {activeScheduleOrder?.pickup_date && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            Earliest allowed: {formatDate(activeScheduleOrder.pickup_date)}
                          </p>
                        )}
                        <DateFieldHint value={activeRoute.scheduled_pickup_date} prefix="Selected" />
                      </FieldGroup>
                      <FieldGroup label="scheduled_delivery_date" required error={activeRouteFieldErrors.scheduled_delivery_date}>
                        <input
                          type="date"
                          name="scheduled_delivery_date"
                          className={inputClass}
                          min={activeRoute.scheduled_pickup_date || activeOrderPickup || undefined}
                          max={activeOrderDelivery || undefined}
                          value={activeRoute.scheduled_delivery_date || ""}
                          onChange={(e) => handleRouteFieldChange('scheduled_delivery_date', e.target.value)}
                        />
                        {activeScheduleOrder?.delivery_date && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            Latest allowed: {formatDate(activeScheduleOrder.delivery_date)}
                          </p>
                        )}
                        <DateFieldHint value={activeRoute.scheduled_delivery_date} prefix="Selected" />
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldGroup label="actual_pickup_date" error={activeRouteFieldErrors.actual_pickup_date}>
                        <input type="date" name="actual_pickup_date" className={inputClass} value={activeRoute.actual_pickup_date || ""} onChange={(e) => handleRouteFieldChange('actual_pickup_date', e.target.value)} />
                        <DateFieldHint value={activeRoute.actual_pickup_date} prefix="Selected" />
                      </FieldGroup>
                      <FieldGroup label="actual_delivery_date" error={activeRouteFieldErrors.actual_delivery_date}>
                        <input type="date" name="actual_delivery_date" className={inputClass} value={activeRoute.actual_delivery_date || ""} onChange={(e) => handleRouteFieldChange('actual_delivery_date', e.target.value)} />
                        <DateFieldHint value={activeRoute.actual_delivery_date} prefix="Selected" />
                      </FieldGroup>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                      <FieldGroup label="start_time" error={activeRouteFieldErrors.start_time}>
                        <input type="datetime-local" name="start_time" className={inputClass} value={activeRoute.start_time || ""} onChange={(e) => handleRouteFieldChange('start_time', e.target.value)} />
                        {activeRoute.start_time ? (
                          <p className="text-[10px] text-gray-500 mt-1">{formatDateTime(activeRoute.start_time)}</p>
                        ) : null}
                      </FieldGroup>
                      <FieldGroup label="end_time" error={activeRouteFieldErrors.end_time}>
                        <input type="datetime-local" name="end_time" className={inputClass} value={activeRoute.end_time || ""} onChange={(e) => handleRouteFieldChange('end_time', e.target.value)} />
                        {activeRoute.end_time ? (
                          <p className="text-[10px] text-gray-500 mt-1">{formatDateTime(activeRoute.end_time)}</p>
                        ) : null}
                      </FieldGroup>
                  </div>
                  <FieldGroup label="created_date">
                    <input type="date" name="created_date" className={inputClass} value={formData.created_date} onChange={handleInputChange} />
                    <DateFieldHint value={formData.created_date} prefix="Trip created" />
                  </FieldGroup>
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        Per-LR billing · {isHiredCarrier ? 'Hired Carrier' : 'Own Fleet'}
                      </p>
                    </div>
                    <ScopeBadge variant="lr" />
                  </div>

                  <div className="max-w-4xl">
                    {(selectedOrders || []).length > 0 ? (
                      <>
                        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 mb-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">LR finance scope</span>
                            <LRTabStrip
                              linkedOrders={selectedOrders.map((o) => ({ order_id: o.id, lr_number: o.lr_number }))}
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

                        <GroupHeader title="Customer Billing" />
                        <MetricsRow label="freight_charge" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.freight_charge || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'freight_charge', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <MetricsRow label="accessorial_charge" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.accessorial_charge || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'accessorial_charge', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <MetricsRow label="tax" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.tax || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'tax', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <MetricsRow label="bill_amount" suffix="₹">
                          <input type="number" className={`${inputClass} !bg-blue-50/30 text-blue-700 font-black`} value={activeFinance.bill_amount || ''} readOnly placeholder="Auto" />
                        </MetricsRow>

                        {isHiredCarrier && (
                          <>
                            <GroupHeader title="Carrier / Owner" />
                            <MetricsRow label="booked_price" suffix="₹">
                              <input type="number" className={inputClass} value={activeFinance.booked_price || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'booked_price', e.target.value)} placeholder="0.00" />
                            </MetricsRow>
                            <MetricsRow label="tds_percentage" suffix="%">
                              <input type="number" className={inputClass} value={activeFinance.tds_percentage || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'tds_percentage', e.target.value)} placeholder="0.00" />
                            </MetricsRow>
                            <MetricsRow label="tds_amount" suffix="₹">
                              <input type="number" className={`${inputClass} !bg-gray-50/70 text-gray-500`} value={activeFinance.tds_amount || ''} readOnly placeholder="Auto" />
                            </MetricsRow>
                            <MetricsRow label="broker_commission" suffix="₹">
                              <input type="number" className={inputClass} value={activeFinance.broker_commission || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'broker_commission', e.target.value)} placeholder="0.00" />
                            </MetricsRow>
                            <MetricsRow label="net_payable" suffix="₹">
                              <input type="number" className={`${inputClass} !bg-emerald-50/40 text-emerald-700 font-black`} value={activeFinance.net_payable || ''} readOnly placeholder="Auto" />
                            </MetricsRow>
                          </>
                        )}

                        {!isHiredCarrier && (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3 mb-4 text-xs text-gray-500">
                            Own fleet — no carrier hire cost. Vehicle running costs are tracked via Expenses after trip creation.
                          </div>
                        )}

                        <GroupHeader title="Adjustments" />
                        <MetricsRow label="incentive_amount" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.incentive_amount || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'incentive_amount', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <MetricsRow label="late_fee" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.late_fee || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'late_fee', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <MetricsRow label="part_load_charge" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.part_load_charge || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'part_load_charge', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <MetricsRow label="damage_amount" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.damage_amount || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'damage_amount', e.target.value)} placeholder="0.00" />
                        </MetricsRow>

                        <GroupHeader title="Settlement" />
                        <MetricsRow label="payment_received_amount" suffix="₹">
                          <input type="number" className={inputClass} value={activeFinance.payment_received_amount || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'payment_received_amount', e.target.value)} placeholder="0.00" />
                        </MetricsRow>
                        <div className="grid grid-cols-2 gap-6 border-x border-b border-gray-200 px-5 py-4 bg-white">
                          <FieldGroup label="pod_received_date">
                            <input type="date" className={inputClass} value={activeFinance.pod_received_date || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'pod_received_date', e.target.value || null)} />
                            <DateFieldHint value={activeFinance.pod_received_date} prefix="POD received" />
                          </FieldGroup>
                          <FieldGroup label="payment_received_date">
                            <input type="date" className={inputClass} value={activeFinance.payment_received_date || ''} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'payment_received_date', e.target.value || null)} />
                            <DateFieldHint value={activeFinance.payment_received_date} prefix="Payment received" />
                          </FieldGroup>
                        </div>
                        <div className="flex gap-8 items-center bg-gray-50/50 p-5 border-x border-b border-gray-200 rounded-b-2xl mb-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={activeFinance.is_billed || false} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'is_billed', e.target.checked)} className="w-5 h-5 rounded-lg text-[#4a6cf7] border-gray-300" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b]">is_billed</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={activeFinance.is_paid || false} onChange={(e) => handleFinanceFieldChange(activeRouteOrderId, 'is_paid', e.target.checked)} className="w-5 h-5 rounded-lg text-[#4a6cf7] border-gray-300" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#64748b]">is_paid</span>
                          </label>
                        </div>

                        <GroupHeader title="Billing Summary (All LRs)" />
                        <div className="border-x border-b border-gray-200 rounded-b-2xl overflow-x-auto bg-white">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500">
                              <tr>
                                <th className="text-left px-4 py-2">LR</th>
                                <th className="text-right px-4 py-2">Bill Amount</th>
                                {isHiredCarrier && (
                                  <>
                                    <th className="text-right px-4 py-2">Booked</th>
                                    <th className="text-right px-4 py-2">TDS</th>
                                    <th className="text-right px-4 py-2">Net</th>
                                  </>
                                )}
                                <th className="text-right px-4 py-2">Paid Recd.</th>
                                <th className="text-left px-4 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {financeSummary.rows.map(({ id, order, fin }) => (
                                <tr key={id} className="border-t border-gray-100">
                                  <td className="px-4 py-2 font-bold text-gray-700">{order?.lr_number || id}</td>
                                  <td className="px-4 py-2 text-right">₹ {fin.bill_amount || '0.00'}</td>
                                  {isHiredCarrier && (
                                    <>
                                      <td className="px-4 py-2 text-right">₹ {fin.booked_price || '0.00'}</td>
                                      <td className="px-4 py-2 text-right">₹ {fin.tds_amount || '0.00'}</td>
                                      <td className="px-4 py-2 text-right">₹ {fin.net_payable || '0.00'}</td>
                                    </>
                                  )}
                                  <td className="px-4 py-2 text-right">₹ {fin.payment_received_amount || '0.00'}</td>
                                  <td className="px-4 py-2">
                                    {fin.is_billed ? '✅ Billed' : '⬜ Unbilled'}
                                    {fin.is_paid ? ' · Paid' : ''}
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-gray-200 bg-gray-50 font-black">
                                <td className="px-4 py-2">TOTAL</td>
                                <td className="px-4 py-2 text-right">₹ {financeSummary.totals.bill_amount.toFixed(2)}</td>
                                {isHiredCarrier && (
                                  <>
                                    <td className="px-4 py-2 text-right">₹ {financeSummary.totals.booked_price.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">₹ {financeSummary.totals.tds_amount.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">₹ {financeSummary.totals.net_payable.toFixed(2)}</td>
                                  </>
                                )}
                                <td className="px-4 py-2 text-right">₹ {financeSummary.totals.payment_received_amount.toFixed(2)}</td>
                                <td className="px-4 py-2" />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Select at least one LR in Step 1 to enter billing details.</p>
                    )}
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
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Ownership</span><span className="font-bold text-gray-700">{isHiredCarrier ? 'Hired Carrier' : 'Own Fleet'}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Scheduled pickup</span><span className="font-bold text-gray-700">{primaryRoutePreview.scheduled_pickup_date ? formatDate(primaryRoutePreview.scheduled_pickup_date) : '—'}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Scheduled delivery</span><span className="font-bold text-gray-700">{primaryRoutePreview.scheduled_delivery_date ? formatDate(primaryRoutePreview.scheduled_delivery_date) : '—'}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Created date</span><span className="font-bold text-gray-700">{formData.created_date ? formatDate(formData.created_date) : '—'}</span></div>
                      <div className="flex flex-col"><span className="text-gray-400 text-xs font-bold uppercase">Total bill (all LRs)</span><span className="font-bold text-emerald-700">₹ {financeSummary.totals.bill_amount.toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">LR-wise Summary</h4>
                    <div className="space-y-2">
                      {selectedOrders.map((o) => {
                        const route = routesByOrder[o.id] || buildRouteState(o.id);
                        const fin = calcLRFinance(financeByOrder[o.id] || DEFAULT_LR_FINANCE, formData.vehicle_ownership_type);
                        return (
                          <details key={o.id} className="rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-2">
                            <summary className="cursor-pointer text-xs font-bold text-[#172B4D]">
                              {o.lr_number} · Bill ₹ {fin.bill_amount || '0.00'}
                              {fin.is_billed ? ' · ✅ Billed' : ' · ⬜ Unbilled'}
                            </summary>
                            <p className="text-xs text-gray-600 mt-2">{route.origin_address || '—'} {'->'} {route.destination_address || '—'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Schedule: {route.scheduled_pickup_date ? formatDate(route.scheduled_pickup_date) : '—'}
                              {' → '}
                              {route.scheduled_delivery_date ? formatDate(route.scheduled_delivery_date) : '—'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Stops: {(route.stops || []).filter((s) => (s.location_address || '').trim()).length}</p>
                            {isHiredCarrier ? (
                              <p className="text-xs text-gray-600 mt-1">
                                Carrier: Booked ₹ {fin.booked_price || '0.00'} · TDS ₹ {fin.tds_amount || '0.00'} · Net ₹ {fin.net_payable || '0.00'}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1 italic">Own fleet — no carrier cost</p>
                            )}
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
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#4a6cf7] text-white font-bold text-sm rounded-xl hover:bg-[#3b59d9] shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    Next Step <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    key="submit-btn"
                    type="submit"
                    disabled={createTripMutation.isPending}
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
