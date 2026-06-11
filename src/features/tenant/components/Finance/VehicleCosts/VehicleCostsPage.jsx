import React, { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import FinanceListPage from '../Common/FinanceListPage'
import FinanceDetailShell from '../Common/FinanceDetailShell'
import { asList, moneyINR } from '../Common/financeUtils'
import StatusBadge from '../Common/StatusBadge'
import { useExpenses, useExpensesByVehicle } from '../../../queries/finance/financeQuery'
import { useVehicles } from '../../../queries/vehicles/vehicleQuery'

function VehicleCostDetail({ vehicleId }) {
  const navigate = useNavigate()
  const { data: vehiclesData } = useVehicles({ page_size: 500 })
  const vehicles = asList(vehiclesData)
  const vehicle = vehicles.find((v) => String(v.id) === String(vehicleId))
  const { data: expensesRaw, isLoading } = useExpensesByVehicle(vehicleId)
  const expenses = asList(expensesRaw)

  const summary = useMemo(() => {
    const fuel = expenses.filter((e) => String(e.expense_type_name || e.expense_type?.name || '').toLowerCase().includes('fuel'))
    const maintenance = expenses.filter((e) => String(e.expense_type_name || e.expense_type?.name || '').toLowerCase().includes('maint'))
    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    return {
      total,
      fuelTotal: fuel.reduce((s, e) => s + Number(e.amount || 0), 0),
      maintenanceTotal: maintenance.reduce((s, e) => s + Number(e.amount || 0), 0),
      count: expenses.length,
    }
  }, [expenses])

  const reg = vehicle?.registration_number || vehicle?.plate_number || vehicleId

  return (
    <FinanceDetailShell
      backTo="/tenant/dashboard/finance/vehicle-costs"
      backLabel="All Vehicles"
      title={reg}
      subtitle="Fuel, maintenance, and operating expenses"
      summaryItems={[
        { label: 'Total Cost', value: moneyINR(summary.total), className: 'text-red-600' },
        { label: 'Fuel', value: moneyINR(summary.fuelTotal), className: 'text-amber-600' },
        { label: 'Maintenance', value: moneyINR(summary.maintenanceTotal), className: 'text-indigo-600' },
        { label: 'Expense Count', value: summary.count },
      ]}
      actions={(
        <Link
          to={`/tenant/dashboard/vehicles/${vehicleId}`}
          className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
        >
          Open Vehicle
        </Link>
      )}
    >
      {isLoading ? (
        <p className="p-6 text-sm text-gray-500">Loading expenses...</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Expense #</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Trip</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No expenses for this vehicle.</td></tr>
            ) : expenses.map((row) => (
              <tr
                key={row.id}
                className="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer"
                onClick={() => navigate(`/tenant/dashboard/finance/expenses/${row.id}`)}
              >
                <td className="px-4 py-3">{row.expense_date}</td>
                <td className="px-4 py-3 font-semibold text-[#0052CC]">{row.expense_number}</td>
                <td className="px-4 py-3">{row.expense_type_name || row.expense_type?.name || '—'}</td>
                <td className="px-4 py-3">
                  {row.trip_id ? (
                    <Link
                      to={`/tenant/dashboard/finance/trips/${row.trip_id}`}
                      className="text-[#0052CC] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {String(row.trip_id).slice(0, 8)}
                    </Link>
                  ) : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge value={row.status} /></td>
                <td className="px-4 py-3 text-right font-semibold">{moneyINR(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </FinanceDetailShell>
  )
}

function VehicleCostsList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: vehiclesData } = useVehicles({ page_size: 500 })
  const { data: expensesData, isLoading, refetch } = useExpenses({ page_size: 1000 })
  const vehicles = asList(vehiclesData)
  const expenses = asList(expensesData)

  const costByVehicle = useMemo(() => {
    const m = {}
    expenses.forEach((e) => {
      const vid = e.vehicle_id
      if (!vid) return
      const key = String(vid)
      if (!m[key]) m[key] = { total: 0, count: 0, fuel: 0 }
      const amt = Number(e.amount || 0)
      m[key].total += amt
      m[key].count += 1
      const typeName = String(e.expense_type_name || e.expense_type?.name || '').toLowerCase()
      if (typeName.includes('fuel')) m[key].fuel += amt
    })
    return m
  }, [expenses])

  const rows = useMemo(() => {
    return vehicles
      .map((v) => {
        const costs = costByVehicle[String(v.id)] || { total: 0, count: 0, fuel: 0 }
        return {
          id: v.id,
          registration: v.registration_number || v.plate_number || String(v.id),
          vehicle_type: v.vehicle_type_code || v.vehicle_type || '—',
          expense_count: costs.count,
          fuel_cost: costs.fuel,
          total_cost: costs.total,
        }
      })
      .filter((r) => !search || r.registration.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.total_cost - a.total_cost)
  }, [vehicles, costByVehicle, search])

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.total_cost, 0)
    const withCosts = rows.filter((r) => r.expense_count > 0).length
    return [
      { label: 'Vehicles', value: rows.length },
      { label: 'With Expenses', value: withCosts },
      { label: 'Total Costs', value: moneyINR(total), className: 'text-red-600' },
    ]
  }, [rows])

  const columns = [
    { key: 'registration', title: 'Vehicle' },
    { key: 'vehicle_type', title: 'Type' },
    { key: 'expense_count', title: 'Expenses' },
    { key: 'fuel_cost', title: 'Fuel', render: (v) => moneyINR(v) },
    { key: 'total_cost', title: 'Total Cost', render: (v) => moneyINR(v) },
  ]

  return (
    <FinanceListPage
      title="Vehicle Costs"
      subtitle="Operating expenses grouped by vehicle — drill down for trip links"
      stats={stats}
      rows={rows}
      columns={columns}
      search={search}
      setSearch={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      emptyMessage="No vehicles found"
      onRowClick={(row) => navigate(`/tenant/dashboard/finance/vehicle-costs/${row.id}`)}
      rowActions={(row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/tenant/dashboard/finance/vehicle-costs/${row.id}`) }}
          className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#EBF3FF] hover:text-[#0052CC]"
        >
          <Eye size={14} />
        </button>
      )}
    />
  )
}

export default function VehicleCostsPage() {
  const { vehicleId } = useParams()
  if (vehicleId) return <VehicleCostDetail vehicleId={vehicleId} />
  return <VehicleCostsList />
}
