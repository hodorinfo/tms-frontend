import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Truck, FileText, History, Package, Calendar, User,
  ChevronRight, Loader2, AlertCircle, Hash, Clock, CheckCircle2, XCircle,
  ShieldCheck, Download, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useOrderDetail,
  useDeleteOrder,
  useTrips,
  useCargoItems,
  useCancelOrder,
} from '../../queries/orders/ordersQuery';
import { useCustomer } from '../../queries/customers/customersQuery';
import { ordersApi } from '../../api/orders/ordersEndpoint';
import { EditOrderModal } from './OrderModals';
import { formatDate, formatDateTime, formatDateShort, toInputDate } from '@/utils/dateFormat';

const STATUS_STEPS = [
  { id: 'DRAFT', label: 'Draft', icon: Clock },
  { id: 'CONFIRMED', label: 'Confirmed', icon: ShieldCheck },
  { id: 'ASSIGNED', label: 'Assigned', icon: Truck },
  { id: 'IN_TRANSIT', label: 'In Transit', icon: Package },
  { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

const STATUS_CONFIG = {
  DRAFT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-600' },
  CONFIRMED: { color: 'text-[#0052CC]', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-[#0052CC]' },
  ASSIGNED: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-600' },
  IN_TRANSIT: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', dot: 'bg-indigo-600' },
  DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', dot: 'bg-teal-600' },
  CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-600' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'cargo', label: 'Cargo Items', icon: Package },
  { id: 'trips', label: 'Trips', icon: Truck },
  { id: 'documents', label: 'Documents', icon: FileText },
];

const DataField = ({ label, value, mono = false }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-black text-[#172B4D] ${mono ? 'font-mono' : ''} truncate`}>
      {value || '---'}
    </span>
  </div>
);

const Section = ({ title, children, icon: Icon }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
      {Icon ? <Icon size={14} className="text-[#0052CC]" /> : null}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatusStepper = ({ currentStatus }) => {
  const STATUS_TO_STEP = {
    DRAFT: 'DRAFT',
    CONFIRMED: 'CONFIRMED',
    ASSIGNED: 'ASSIGNED',
    IN_TRANSIT: 'IN_TRANSIT',
    DELAYED: 'IN_TRANSIT',
    ARRIVED: 'IN_TRANSIT',
    DISPATCHED: 'IN_TRANSIT',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'DELIVERED',
  };
  const normalizedStatus = STATUS_TO_STEP[currentStatus] || 'DRAFT';
  const currentIndex = STATUS_STEPS.findIndex((s) => s.id === normalizedStatus);

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 shadow-sm">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle size={20} />
          <span className="font-black uppercase tracking-widest text-xs">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full max-w-4xl mx-auto mb-10 px-4">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isLast = index === STATUS_STEPS.length - 1;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                isCompleted || isActive ? 'bg-[#0052CC] border-[#0052CC] text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest mt-2 absolute -bottom-6 w-24 text-center ${
                isActive ? 'text-[#0052CC]' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-[2px] mx-2 bg-gray-100 relative overflow-hidden">
                <div className={`absolute inset-0 bg-[#0052CC] transition-all duration-700 ${isCompleted ? 'translate-x-0' : '-translate-x-full'}`} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OverviewTab = ({ order, consignor, consignee, billingCustomer, navigate }) => {
  const { data: tripsData } = useTrips({ order_id: order?.id, page_size: 50 });
  const trips = tripsData?.results || [];
  const executionTrips = [...trips].sort((a, b) => new Date(a.scheduled_pickup_date || a.created_at) - new Date(b.scheduled_pickup_date || b.created_at));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Shipment Identity" icon={Package}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <DataField label="Order Number" value={order.lr_number} mono />
            <DataField label="Order Type" value={order.order_type} />
            <DataField label="Current Status" value={order.status} />
            <DataField label="Version" value={`v${order.version || 1}.0`} />
          </div>
        </Section>

        <Section title="Shipment Timeline" icon={Calendar}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <DataField label="Pickup Date" value={order.pickup_date ? formatDate(order.pickup_date) : 'Not Set'} />
            <DataField label="Delivery Date" value={order.delivery_date ? formatDate(order.delivery_date) : 'Not Set'} />
            <DataField label="LR Receiving Date" value={order.lr_receiving_date ? formatDate(order.lr_receiving_date) : 'Not Set'} />
          </div>
        </Section>
      </div>

      {executionTrips.length > 0 && (
        <Section title="Execution Dates (Read-Only)" icon={Truck}>
          <div className="space-y-3">
            {executionTrips.map((trip) => (
              <div key={trip.id} className="rounded-xl border border-gray-100 bg-white p-3 flex items-center justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                  <DataField label="Trip" value={trip.trip_number || trip.id?.slice(0, 8)} mono />
                  <DataField label="Scheduled Pickup" value={trip.scheduled_pickup_date ? formatDate(trip.scheduled_pickup_date) : 'Not Set'} />
                  <DataField label="Scheduled Delivery" value={trip.scheduled_delivery_date ? formatDate(trip.scheduled_delivery_date) : 'Not Set'} />
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)}
                  className="text-xs font-bold text-[#0052CC] hover:underline whitespace-nowrap"
                >
                  Edit on Trip
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Participants" icon={User}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/20">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Consignor (Sender)</p>
            <h4 className="text-base font-black text-[#172B4D] mt-2">{consignor?.legal_name || consignor?.name || order.consignor_id || 'Unassigned'}</h4>
            <p className="text-xs font-bold text-gray-500 uppercase">{consignor?.customer_code || 'NOT SET'}</p>
            <p className="text-xs text-gray-600 mt-3">{order.consignor_address || 'No consignor address'}</p>
          </div>
          <div className="p-5 rounded-2xl border border-green-100 bg-green-50/20">
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Consignee (Receiver)</p>
            <h4 className="text-base font-black text-[#172B4D] mt-2">{consignee?.legal_name || consignee?.name || order.consignee_id || 'Unassigned'}</h4>
            <p className="text-xs font-bold text-gray-500 uppercase">{consignee?.customer_code || 'NOT SET'}</p>
            <p className="text-xs text-gray-600 mt-3">{order.consignee_address || 'No consignee address'}</p>
          </div>
        </div>
      </Section>

      <Section title="Billing & Reference" icon={Hash}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <DataField label="Billing Customer" value={billingCustomer?.legal_name || billingCustomer?.name || order.billing_customer_id} />
          <DataField label="Billing Company Name" value={order.billing_company_name} />
          <DataField label="Customer Reference Number" value={order.reference_number} mono />
          <DataField label="Internal Notes" value={order.notes || 'No special instructions'} />
        </div>
      </Section>

      <Section title="Invoice Fields" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <DataField label="Vehicle Type" value={order.vehicle_type_preference} />
          <DataField label="Vehicle Size" value={order.vehicle_size} />
          <DataField label="Seal Number" value={order.seal_number} />
          <DataField label="Booking Date" value={order.booking_date ? formatDate(order.booking_date) : 'Not Set'} />
          <DataField label="Consignor Invoice No" value={order.consignor_invoice_no} />
          <DataField label="E-Way Bill No" value={order.e_way_bill_no} />
          <DataField label="Road Permit No" value={order.road_permit_no} />
          <DataField label="To Be Billed At" value={order.to_be_billed_at} />
          <DataField label="Freight Charges" value={order.freight_charges} />
          <DataField label="Consignment Value" value={order.consignment_value} />
          <DataField label="Advance Received" value={order.advance_received} />
        </div>
      </Section>

      <Section title="System Audit" icon={History}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          <DataField label="Created By" value={order.created_by?.slice(0, 10)} />
          <DataField label="Created On" value={order.created_at ? formatDate(order.created_at) : '---'} />
          <DataField label="Created Time" value={order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'} />
          <DataField label="Last Updated" value={order.updated_at ? formatDate(order.updated_at) : '---'} />
          <DataField label="Version" value={`v${order.version || 1}.0`} />
        </div>
      </Section>
    </div>
  );
};

const TripsTab = ({ orderId, navigate }) => {
  const { data: tripsData, isLoading } = useTrips({ order_id: orderId, page_size: 50 });
  const trips = tripsData?.results || [];
  const sortedTrips = [...trips].sort((a, b) => new Date(a.scheduled_pickup_date || a.created_at) - new Date(b.scheduled_pickup_date || b.created_at));

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-[#0052CC]" /> Loading trips...</div>;

  return (
    <div className="space-y-3">
      {sortedTrips.length > 0 ? sortedTrips.map((trip) => (
        <div key={trip.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#172B4D]">{trip.trip_number || 'TRP-NEW'}</p>
            <p className="text-xs text-gray-500 uppercase">{trip.status || 'UNASSIGNED'}</p>
          </div>
          <button onClick={() => navigate(`/tenant/dashboard/orders/trips/${trip.id}`)} className="text-xs font-bold text-[#0052CC] hover:underline">
            Open Trip
          </button>
        </div>
      )) : (
        <div className="py-16 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">No Trips Found</div>
      )}
    </div>
  );
};

const CargoTab = ({ orderId, navigate }) => {
  const { data: cargoData, isLoading } = useCargoItems({ order_id: orderId, ordering: '-created_at' });
  const cargoItems = cargoData?.results || [];

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-[#0052CC]" /> Loading cargo...</div>;
  if (!cargoItems.length) return <div className="py-16 text-center text-gray-400 text-xs font-bold uppercase tracking-wider">No Cargo Items Linked</div>;

  return (
    <div className="space-y-3">
      {cargoItems.map((item) => (
        <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#172B4D]">{item.description || 'Cargo Item'}</p>
            <p className="text-xs text-gray-500 uppercase">{item.item_code || item.id?.slice(-8)} • {item.status || 'PENDING'}</p>
          </div>
          <button onClick={() => navigate(`/tenant/dashboard/orders/cargo/${item.id}`)} className="text-xs font-bold text-[#0052CC] hover:underline">
            Open Cargo
          </button>
        </div>
      ))}
    </div>
  );
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: order, isLoading, isError, error } = useOrderDetail(id);
  const { data: orderTripsData } = useTrips({ order_id: id, page_size: 1, ordering: '-created_at' });
  const deleteOrderMutation = useDeleteOrder();
  const cancelOrderMutation = useCancelOrder();
  const linkedTrips = orderTripsData?.results || [];

  const { data: consignor } = useCustomer(typeof order?.consignor_id === 'string' ? order.consignor_id : null);
  const { data: consignee } = useCustomer(typeof order?.consignee_id === 'string' ? order.consignee_id : null);
  const { data: billingCustomer } = useCustomer(typeof order?.billing_customer_id === 'string' ? order.billing_customer_id : null);

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to permanently delete this order?')) {
      deleteOrderMutation.mutate(order.id, { onSuccess: () => navigate('/tenant/dashboard/orders') });
    }
  };

  const handleCancelClick = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(order.id);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await ordersApi.invoicePdf(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order?.lr_number || id}-invoice.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice PDF downloaded');
    } catch (e) {
      toast.error('Failed to download invoice PDF');
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 size={32} className="animate-spin text-[#0052CC]" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-[#172B4D]">Failed to load order</h2>
        <p className="text-gray-500 mt-2 mb-6 max-w-xs">{error?.message || 'Order detail could not be retrieved.'}</p>
        <button onClick={() => navigate('/tenant/dashboard/orders')} className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">
          Go Back
        </button>
      </div>
    );
  }

  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => navigate('/tenant/dashboard/orders')} className="flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
              <ArrowLeft size={16} />
              <span>All Orders</span>
            </button>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="font-semibold text-[#172B4D]">{order.lr_number}</span>
            <span className={`px-3 py-1 rounded-full text-[9px] ml-2 border ${st.bg} ${st.color} ${st.border}`}>{order.status}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const firstTrip = linkedTrips[0];
                if (firstTrip?.id) {
                  navigate(`/tenant/dashboard/orders/trips/${firstTrip.id}`);
                  return;
                }
                navigate(`/tenant/dashboard/orders/trips/new?order_id=${order.id}`);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0052CC] rounded-xl hover:bg-[#0041a3] shadow-md shadow-blue-100"
            >
              <Truck size={16} /> Open Trip Planner
            </button>
            <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
              <Edit2 size={16} /> Edit
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100">
              <Download size={16} /> Download PDF
            </button>
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <button onClick={handleCancelClick} disabled={cancelOrderMutation.isPending} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 disabled:opacity-50">
                <XCircle size={16} /> Cancel Order
              </button>
            )}
            {order.status !== 'DELIVERED' && (
              <button onClick={handleDeleteClick} disabled={deleteOrderMutation.isPending} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100">
                <Trash2 size={16} /> Delete Order
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 pt-10 pb-10 shadow-sm overflow-hidden">
          <StatusStepper currentStatus={order.status} />
          <p className="text-center text-xs text-gray-500 font-semibold">
            Status is derived from trip execution. Update status from the Trip module.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex overflow-x-auto border-b border-gray-100 px-4 bg-white">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 shrink-0 ${
                  activeTab === tab.id ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-[#172B4D] hover:bg-gray-50'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 lg:p-8 bg-gray-50/20">
            {activeTab === 'overview' && (
              <OverviewTab
                order={order}
                consignor={consignor}
                consignee={consignee}
                billingCustomer={billingCustomer}
                navigate={navigate}
              />
            )}
            {activeTab === 'trips' && <TripsTab orderId={id} navigate={navigate} />}
            {activeTab === 'cargo' && <CargoTab orderId={id} navigate={navigate} />}
            {activeTab === 'documents' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <div className="p-6 bg-white rounded-full border border-gray-100 shadow-sm mb-4">
                  <FileText size={48} className="opacity-10" />
                </div>
                <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Digital Documents</h3>
                <p className="text-xs mt-1">POD and Invoice storage coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditOrderModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} order={order} />
    </div>
  );
}
