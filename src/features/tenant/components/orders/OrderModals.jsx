import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateOrder, useUpdateOrder, useSyncCargo } from '../../queries/orders/ordersQuery';
import { useCustomers, useCustomerAddresses } from '../../queries/customers/customersQuery';
import { useVehicleTypes } from '../../queries/vehicles/vehicletypeQuery';

const ORDER_TYPES = ['FTL', 'LTL', 'CONTAINER', 'COURIER', 'MULTI_DROP'];

const EMPTY_FORM = {
  reference_number: '',
  order_type: 'FTL',
  billing_customer_id: '',
  consignor_id: '',
  consignee_id: '',
  broker_id: '',
  pickup_date: '',
  delivery_date: '',
  lr_receiving_date: '',
  booking_date: '',
  vehicle_type_preference: '',
  vehicle_size: '',
  seal_number: '',
  consignor_address: '',
  consignee_address: '',
  consignor_invoice_no: '',
  e_way_bill_no: '',
  road_permit_no: '',
  to_be_billed_at: '',
  freight_charges: '0',
  consignment_value: '',
  advance_received: '0',
  notes: '',
};

function ModalShell({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function getCustomerName(customer) {
  return customer?.legal_name || customer?.trading_name || customer?.customer_code || customer?.id || 'Unknown';
}

function normalizeAddress(address) {
  if (!address || typeof address !== 'object') return '';
  const segments = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  return segments.join(', ');
}

function OrderForm({ mode, initialData = null, onClose }) {
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const syncCargo = useSyncCargo();
  const [form, setForm] = useState(EMPTY_FORM);
  const [cargoItems, setCargoItems] = useState([{ item_code: '', description: '', quantity: '1', commodity_type: 'GENERAL' }]);

  const { data: customersData } = useCustomers({ page_size: 200, is_active: true });
  const customers = customersData?.results || (Array.isArray(customersData) ? customersData : []);
  const { data: vehicleTypesData } = useVehicleTypes({ page_size: 200, is_active: true });
  const vehicleTypes = vehicleTypesData?.results || [];

  const { data: consignorAddressesData } = useCustomerAddresses(form.consignor_id || null);
  const { data: consigneeAddressesData } = useCustomerAddresses(form.consignee_id || null);
  const consignorAddresses = consignorAddressesData?.results || (Array.isArray(consignorAddressesData) ? consignorAddressesData : []);
  const consigneeAddresses = consigneeAddressesData?.results || (Array.isArray(consigneeAddressesData) ? consigneeAddressesData : []);

  useEffect(() => {
    if (!initialData) {
      setForm(EMPTY_FORM);
      setCargoItems([{ item_code: '', description: '', quantity: '1', commodity_type: 'GENERAL' }]);
      return;
    }
    setForm({
      ...EMPTY_FORM,
      ...initialData,
      freight_charges: initialData.freight_charges != null ? String(initialData.freight_charges) : '0',
      consignment_value: initialData.consignment_value != null ? String(initialData.consignment_value) : '',
      advance_received: initialData.advance_received != null ? String(initialData.advance_received) : '0',
    });
    setCargoItems([{ item_code: '', description: '', quantity: '1', commodity_type: 'GENERAL' }]);
  }, [initialData]);

  const billingOptions = useMemo(() => customers, [customers]);

  const onChange = (key) => (e) => {
    const value = e?.target?.value ?? '';
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAutoAddressFill = (role, customerId) => {
    if (!customerId) return;
    const list = role === 'consignor' ? consignorAddresses : consigneeAddresses;
    const firstAddress = list?.[0];
    if (!firstAddress) return;
    const nextValue = normalizeAddress(firstAddress);
    if (!nextValue) return;
    if (role === 'consignor') {
      setForm((prev) => ({ ...prev, consignor_address: prev.consignor_address || nextValue }));
    } else {
      setForm((prev) => ({ ...prev, consignee_address: prev.consignee_address || nextValue }));
    }
  };

  useEffect(() => {
    handleAutoAddressFill('consignor', form.consignor_id);
  }, [form.consignor_id, consignorAddressesData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    handleAutoAddressFill('consignee', form.consignee_id);
  }, [form.consignee_id, consigneeAddressesData]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPayload = () => {
    const nullable = new Set([
      'consignor_id',
      'consignee_id',
      'broker_id',
      'pickup_date',
      'delivery_date',
      'lr_receiving_date',
      'booking_date',
      'consignment_value',
      'vehicle_type_preference',
    ]);
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, nullable.has(key) && value === '' ? null : value])
    );
    payload.freight_charges = payload.freight_charges === '' ? '0' : payload.freight_charges;
    payload.advance_received = payload.advance_received === '' ? '0' : payload.advance_received;
    return payload;
  };

  const isSaving = createOrder.isPending || updateOrder.isPending;
  const isSyncingCargo = syncCargo.isPending;

  const normalizedCargoItems = useMemo(
    () =>
      cargoItems
        .map((row) => ({
          item_code: (row.item_code || '').trim(),
          description: (row.description || row.item_code || '').trim(),
          quantity: Number(row.quantity || 0),
          commodity_type: row.commodity_type || 'GENERAL',
        }))
        .filter((row) => (row.description || row.item_code) && row.quantity > 0),
    [cargoItems]
  );

  const submit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (mode === 'edit' && initialData?.id) {
      updateOrder.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: async () => {
            onClose?.();
          }
        }
      );
      return;
    }
    createOrder.mutate(payload, {
      onSuccess: async (order) => {
        const orderId = order?.id;
        try {
          if (orderId && normalizedCargoItems.length) {
            await syncCargo.mutateAsync({
              order_id: orderId,
              trip_id: null,
              items: normalizedCargoItems,
            });
          }
        } catch (_) {
          toast.error('LR created, but cargo sync failed. Please retry from Cargo module.')
        } finally {
          onClose?.();
        }
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Reference Number">
          <input className={INPUT_CLASS} value={form.reference_number} onChange={onChange('reference_number')} />
        </Field>
        <Field label="Order Type" required>
          <select className={INPUT_CLASS} value={form.order_type} onChange={onChange('order_type')}>
            {ORDER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Booking Date">
          <input type="date" className={INPUT_CLASS} value={form.booking_date || ''} onChange={onChange('booking_date')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Billing Customer" required>
          <select className={INPUT_CLASS} value={form.billing_customer_id} onChange={onChange('billing_customer_id')}>
            <option value="">Select billing customer</option>
            {billingOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {getCustomerName(customer)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Consignor">
          <select className={INPUT_CLASS} value={form.consignor_id || ''} onChange={onChange('consignor_id')}>
            <option value="">Select consignor</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {getCustomerName(customer)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Consignee">
          <select className={INPUT_CLASS} value={form.consignee_id || ''} onChange={onChange('consignee_id')}>
            <option value="">Select consignee</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {getCustomerName(customer)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Consignor Address">
          <textarea rows={2} className={INPUT_CLASS} value={form.consignor_address} onChange={onChange('consignor_address')} />
        </Field>
        <Field label="Consignee Address">
          <textarea rows={2} className={INPUT_CLASS} value={form.consignee_address} onChange={onChange('consignee_address')} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Pickup Date">
          <input type="date" className={INPUT_CLASS} value={form.pickup_date || ''} onChange={onChange('pickup_date')} />
        </Field>
        <Field label="Delivery Date">
          <input type="date" className={INPUT_CLASS} value={form.delivery_date || ''} onChange={onChange('delivery_date')} />
        </Field>
        <Field label="LR Receiving Date">
          <input type="date" className={INPUT_CLASS} value={form.lr_receiving_date || ''} onChange={onChange('lr_receiving_date')} />
        </Field>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-700">Invoice Details</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Vehicle Type">
            <select
              className={INPUT_CLASS}
              value={form.vehicle_type_preference || ''}
              onChange={onChange('vehicle_type_preference')}
            >
              <option value="">Select vehicle type</option>
              {vehicleTypes.map((vehicleType) => (
                <option key={vehicleType.id} value={vehicleType.type_code}>
                  {vehicleType.type_code} - {vehicleType.type_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle Size">
            <input className={INPUT_CLASS} value={form.vehicle_size} onChange={onChange('vehicle_size')} />
          </Field>
          <Field label="Seal Number">
            <input className={INPUT_CLASS} value={form.seal_number} onChange={onChange('seal_number')} />
          </Field>
          <Field label="Consignor Invoice No.">
            <input className={INPUT_CLASS} value={form.consignor_invoice_no} onChange={onChange('consignor_invoice_no')} />
          </Field>
          <Field label="E-Way Bill No.">
            <input className={INPUT_CLASS} value={form.e_way_bill_no} onChange={onChange('e_way_bill_no')} />
          </Field>
          <Field label="Road Permit No.">
            <input className={INPUT_CLASS} value={form.road_permit_no} onChange={onChange('road_permit_no')} />
          </Field>
          <Field label="To Be Billed At">
            <input className={INPUT_CLASS} value={form.to_be_billed_at} onChange={onChange('to_be_billed_at')} />
          </Field>
          <Field label="Freight Charges">
            <input type="number" min="0" step="0.01" className={INPUT_CLASS} value={form.freight_charges} onChange={onChange('freight_charges')} />
          </Field>
          <Field label="Consignment Value">
            <input type="number" min="0" step="0.01" className={INPUT_CLASS} value={form.consignment_value} onChange={onChange('consignment_value')} />
          </Field>
          <Field label="Advance Received">
            <input type="number" min="0" step="0.01" className={INPUT_CLASS} value={form.advance_received} onChange={onChange('advance_received')} />
          </Field>
        </div>
      </div>

      {mode === 'create' && (
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">LR Cargo Items</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              onClick={() =>
                setCargoItems((prev) => [
                  ...prev,
                  { item_code: '', description: '', quantity: '1', commodity_type: 'GENERAL' }
                ])
              }
            >
              <Plus size={12} /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {cargoItems.map((row, idx) => (
              <div key={`cargo-${idx}`} className="grid grid-cols-12 gap-2">
                <input
                  className={`${INPUT_CLASS} col-span-2`}
                  placeholder="Item code"
                  value={row.item_code}
                  onChange={(e) =>
                    setCargoItems((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, item_code: e.target.value } : r))
                    )
                  }
                />
                <input
                  className={`${INPUT_CLASS} col-span-5`}
                  placeholder="Cargo description"
                  value={row.description}
                  onChange={(e) =>
                    setCargoItems((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r))
                    )
                  }
                />
                <input
                  type="number"
                  min="1"
                  className={`${INPUT_CLASS} col-span-2`}
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) =>
                    setCargoItems((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                    )
                  }
                />
                <select
                  className={`${INPUT_CLASS} col-span-2`}
                  value={row.commodity_type}
                  onChange={(e) =>
                    setCargoItems((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, commodity_type: e.target.value } : r))
                    )
                  }
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="HAZARDOUS">HAZARDOUS</option>
                  <option value="PERISHABLE">PERISHABLE</option>
                  <option value="FRAGILE">FRAGILE</option>
                  <option value="HIGH_VALUE">HIGH_VALUE</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <button
                  type="button"
                  className="col-span-1 rounded-xl border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() =>
                    setCargoItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
                  }
                  title="Remove cargo row"
                >
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Field label="Notes">
        <textarea rows={3} className={INPUT_CLASS} value={form.notes} onChange={onChange('notes')} />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving || isSyncingCargo ? 'Saving...' : mode === 'edit' ? 'Update Order' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}

export function CreateOrderModal({ isOpen, onClose }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Create Order">
      <OrderForm mode="create" onClose={onClose} />
    </ModalShell>
  );
}

export function EditOrderModal({ isOpen, onClose, order }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Edit Order">
      <OrderForm mode="edit" initialData={order} onClose={onClose} />
    </ModalShell>
  );
}

