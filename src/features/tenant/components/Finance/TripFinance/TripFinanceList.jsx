import React, { useMemo, useState } from 'react'
import { Eye, FileText, List, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import { asList, invoiceStatusForTrip, moneyINR, routeShort } from '../Common/financeUtils'
import { useTrips } from '../../../queries/orders/ordersQuery'
import { useDrivers } from '../../../queries/drivers/driverCoreQuery'
import { useVehicles } from '../../../queries/vehicles/vehicleQuery'
import { getDriverName } from '../../Drivers/common/utils'

export default function TripFinanceList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')

  const tripParams = useMemo(() => {
    const p = { page_size: 200, ordering: '-created_at' }
    if (search) p.search = search
    if (status) p.status = status
    if (vehicleId) p.primary_vehicle_id = vehicleId
    if (driverId) p.primary_driver_id = driverId
    return p
  }, [search, status, vehicleId, driverId])

  const { data, isLoading, refetch } = useTrips(tripParams)
  const { data: driversData } = useDrivers({ page_size: 500 })
  const { data: vehiclesData } = useVehicles({ page_size: 500 })
  const trips = asList(data)
  const drivers = asList(driversData)
  const vehicles = asList(vehiclesData)

  const driverMap = useMemo(() => {
    const m = {}
    drivers.forEach((d) => { m[String(d.id)] = getDriverName(d) })
    return m
  }, [drivers])

  const rows = useMemo(() => {
    return trips
      .map((trip) => {
        const freight = Number(trip.total_bill_amount || trip.total_freight_charge || 0)
        const invStatus = invoiceStatusForTrip(trip)
        return {
          ...trip,
          lr_pills: (trip.linked_orders || []).map((o) => o.lr_number).filter(Boolean).join(', ') || trip.lr_number || '—',
          route_label: routeShort(trip.origin_address, trip.destination_address),
          driver_name: driverMap[String(trip.primary_driver_id)] || '—',
          freight_total: freight,
          invoice_status: invStatus,
        }
      })
      .filter((row) => {
        if (!invoiceFilter) return true
        return row.invoice_status === invoiceFilter
      })
  }, [trips, driverMap, invoiceFilter])

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.status === 'COMPLETED').length
    const inTransit = rows.filter((r) => r.status === 'IN_TRANSIT').length
    const totalFreight = rows.reduce((s, r) => s + Number(r.freight_total || 0), 0)
    const pendingInv = rows.filter((r) => r.invoice_status === 'PENDING').length
    const unpaid = rows.filter((r) => r.invoice_status === 'RAISED').length
    return [
      { label: 'Trips', value: rows.length },
      { label: 'Completed', value: completed, className: 'text-green-600' },
      { label: 'In Transit', value: inTransit, className: 'text-blue-600' },
      { label: 'Total Freight', value: moneyINR(totalFreight) },
      { label: 'Invoice Pending', value: pendingInv, className: 'text-amber-600' },
      { label: 'Unpaid', value: unpaid, className: 'text-red-600' },
    ]
  }, [rows])

  const columns = [
    { key: 'trip_number', title: 'Trip #' },
    {
      key: 'lr_pills',
      title: 'LR(s)',
      render: (_, row) => (
        <span className="text-[11px] font-semibold text-gray-600 max-w-[140px] truncate block" title={row.lr_pills}>
          {row.lr_pills}
        </span>
      ),
    },
    { key: 'route_label', title: 'Route' },
    { key: 'status', title: 'Status' },
    { key: 'vehicle_number', title: 'Vehicle', render: (v) => v || '—' },
    { key: 'driver_name', title: 'Driver' },
    {
      key: 'freight_total',
      title: 'Freight',
      render: (v) => moneyINR(v),
    },
    { key: 'invoice_status', title: 'Invoice' },
    {
      key: 'is_billed',
      title: 'Billed',
      render: (v) => (v ? '✓' : '—'),
    },
    {
      key: 'is_paid',
      title: 'Paid',
      render: (v) => (v ? '✓' : '—'),
    },
  ]

  const secondaryFilters = (
    <>
      <select
        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="CREATED">Created</option>
        <option value="IN_TRANSIT">In Transit</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <select
        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
        value={invoiceFilter}
        onChange={(e) => setInvoiceFilter(e.target.value)}
      >
        <option value="">All invoice states</option>
        <option value="PENDING">Invoice Pending</option>
        <option value="RAISED">Raised / Unpaid</option>
        <option value="PAID">Paid</option>
      </select>
      <select
        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold max-w-[160px]"
        value={vehicleId}
        onChange={(e) => setVehicleId(e.target.value)}
      >
        <option value="">All vehicles</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>{v.registration_number || v.plate_number || v.id}</option>
        ))}
      </select>
      <select
        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold max-w-[160px]"
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
      >
        <option value="">All drivers</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>{getDriverName(d)}</option>
        ))}
      </select>
    </>
  )

  return (
    <FinanceListPage
      title="Trips & LR Finance"
      subtitle="Trip-wise revenue, expenses, invoices, and settlement in one place"
      stats={stats}
      rows={rows}
      columns={columns}
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      secondaryFilters={secondaryFilters}
      actions={(
        <Link
          to="/tenant/dashboard/finance/invoices"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          <List size={14} /> All Invoices
        </Link>
      )}
      emptyMessage="No trips match your filters"
      onRowClick={(row) => navigate(`/tenant/dashboard/finance/trips/${row.id}`)}
      rowActions={(row) => (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/trips/${row.id}`) }}
            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#EBF3FF] hover:text-[#0052CC]"
            title="View"
          >
            <Eye size={14} />
          </button>
          {row.is_billed || row.invoice_status === 'RAISED' || row.invoice_status === 'PAID' ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/trips/${row.id}?tab=invoices`) }}
              className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
              title="View Invoice"
            >
              <FileText size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/trips/${row.id}?tab=invoices`) }}
              className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-[#0052CC]"
              title="Invoice & Payments"
            >
              <FileText size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/trips/${row.id}?tab=expenses`) }}
            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
            title="Add Expense"
          >
            <Plus size={14} />
          </button>
        </>
      )}
    />
  )
}
