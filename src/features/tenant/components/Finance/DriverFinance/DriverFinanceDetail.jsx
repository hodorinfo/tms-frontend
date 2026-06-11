import React, { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import FinanceDetailShell from '../Common/FinanceDetailShell'
import { asList, moneyINR } from '../Common/financeUtils'
import StatusBadge from '../Common/StatusBadge'
import { useAdvances, usePayrollEntries, usePayrollPeriods } from '../../../queries/finance/financeQuery'
import { useDriverDetail } from '../../../queries/drivers/driverCoreQuery'
import { getDriverName } from '../../Drivers/common/utils'
import { formatDate } from '@/utils/dateFormat'

const TABS = [
  { key: 'payroll', label: 'Payroll' },
  { key: 'advances', label: 'Advances' },
  { key: 'settlements', label: 'Settlements' },
]

export default function DriverFinanceDetail() {
  const { driverId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'payroll'

  const { data: driver, isLoading: driverLoading } = useDriverDetail(driverId)
  const { data: advancesData, isLoading: advancesLoading } = useAdvances({ driver_id: driverId, page_size: 100 })
  const { data: entriesData, isLoading: entriesLoading } = usePayrollEntries({ driver_id: driverId, page_size: 50 })
  const { data: periodsData } = usePayrollPeriods({ page_size: 50 })

  const advances = asList(advancesData)
  const entries = asList(entriesData)
  const periods = asList(periodsData)

  const periodMap = useMemo(() => {
    const m = {}
    periods.forEach((p) => { m[String(p.id)] = `${p.month}/${p.year}` })
    return m
  }, [periods])

  const advanceOutstanding = useMemo(() => {
    return advances
      .filter((a) => ['DISBURSED', 'APPROVED'].includes(a.status))
      .reduce((s, a) => s + Number(a.outstanding_amount || a.amount || 0), 0)
  }, [advances])

  const latestEntry = entries[0]
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true })

  if (driverLoading) {
    return <div className="p-8 text-sm text-gray-500">Loading driver finance...</div>
  }

  const name = getDriverName(driver)
  const phone = driver?.user?.phone || driver?.phone || '—'

  return (
    <FinanceDetailShell
      backTo="/tenant/dashboard/finance/drivers"
      backLabel="All Drivers"
      title={name}
      subtitle={`Driver ID: ${String(driverId).slice(0, 8)} · Phone: ${phone}`}
      summaryItems={[
        { label: 'Latest Net Pay', value: latestEntry ? moneyINR(latestEntry.net_pay) : '—' },
        { label: 'Trip Earnings', value: latestEntry ? moneyINR(latestEntry.trip_earnings) : '—' },
        { label: 'Advance Recovery', value: latestEntry ? moneyINR(latestEntry.advance_recovery) : '—' },
        { label: 'Advances Outstanding', value: moneyINR(advanceOutstanding), className: 'text-purple-600' },
        { label: 'Payroll Status', value: latestEntry?.payment_status || '—' },
      ]}
      tabs={TABS.map((t) => ({
        ...t,
        count: t.key === 'advances' ? advances.length : t.key === 'payroll' ? entries.length : undefined,
      }))}
      activeTab={activeTab}
      onTabChange={setTab}
      actions={(
        <>
          <Link
            to="/tenant/dashboard/finance/advances"
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            Request Advance
          </Link>
          <Link
            to={`/tenant/dashboard/finance/settlement/driver/${driverId}`}
            className="px-3 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90"
          >
            Driver Settlement
          </Link>
        </>
      )}
    >
      {activeTab === 'payroll' && (
        <div className="overflow-x-auto">
          {entriesLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading payroll entries...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Period</th>
                  <th className="text-right px-4 py-3">Base</th>
                  <th className="text-right px-4 py-3">Trip Earnings</th>
                  <th className="text-right px-4 py-3">Deductions</th>
                  <th className="text-right px-4 py-3">Net Pay</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No payroll entries.</td></tr>
                ) : entries.map((e) => (
                  <tr key={e.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">{periodMap[String(e.payroll_period)] || e.payroll_period}</td>
                    <td className="px-4 py-3 text-right">{moneyINR(e.base_salary)}</td>
                    <td className="px-4 py-3 text-right">{moneyINR(e.trip_earnings)}</td>
                    <td className="px-4 py-3 text-right">{moneyINR(e.total_deductions)}</td>
                    <td className="px-4 py-3 text-right font-bold">{moneyINR(e.net_pay)}</td>
                    <td className="px-4 py-3"><StatusBadge value={e.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'advances' && (
        <div className="overflow-x-auto">
          {advancesLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading advances...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Request #</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Purpose</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {advances.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No advance requests.</td></tr>
                ) : advances.map((a) => (
                  <tr key={a.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/tenant/dashboard/finance/advances/${a.id}`} className="text-[#0052CC] font-semibold hover:underline">
                        {a.request_number || String(a.id).slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{moneyINR(a.amount)}</td>
                    <td className="px-4 py-3">{formatDate(a.request_date)}</td>
                    <td className="px-4 py-3">{a.purpose || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge value={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="p-6 text-sm text-gray-600 space-y-3">
          <p>Finalize driver settlement to reconcile trip earnings, advances, and payroll for a period.</p>
          <Link
            to={`/tenant/dashboard/finance/settlement/driver/${driverId}`}
            className="inline-flex px-4 py-2 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:opacity-90"
          >
            Open Driver Settlement
          </Link>
        </div>
      )}
    </FinanceDetailShell>
  )
}
