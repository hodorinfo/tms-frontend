import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import { ordersApi } from '../../../api/orders/ordersEndpoint'
import { orderKeys } from '../../../queries/orders/ordersQuery'
import { useCustomers } from '../../../queries/customers/customersQuery'

const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export function useTripLrRows(trip) {
  const linkedOrders = useMemo(() => {
    if (!trip) return []
    if (trip.linked_orders?.length) return trip.linked_orders
    if (trip.order_id) {
      return [{
        order_id: trip.order_id,
        lr_number: trip.lr_number,
        reference_number: trip.reference_number,
      }]
    }
    return []
  }, [trip])

  const lrFinanceMap = useMemo(() => {
    const map = {}
    ;(trip?.lr_finance || []).forEach((row) => {
      map[String(row.order_id)] = row
    })
    return map
  }, [trip?.lr_finance])

  const orderQueries = useQueries({
    queries: linkedOrders.map((link) => ({
      queryKey: orderKeys.detail(link.order_id),
      queryFn: () => ordersApi.get(link.order_id),
      enabled: !!link.order_id,
      staleTime: 60_000,
    })),
  })

  const { data: customersData } = useCustomers({ page_size: 1000 })
  const customers = asList(customersData)

  const customerMap = useMemo(() => {
    const m = {}
    customers.forEach((c) => { m[String(c.id)] = c.legal_name || c.company_name || c.name })
    return m
  }, [customers])

  const rows = useMemo(
    () =>
      linkedOrders.map((link, index) => {
        const order = orderQueries[index]?.data
        const finance = lrFinanceMap[String(link.order_id)] || {}
        const freight = Number(finance.freight_charge ?? order?.freight_charges ?? 0)
        const accessorial = Number(finance.accessorial_charge ?? 0)
        const tax = Number(finance.tax ?? 0)
        const billAmount = Number(finance.bill_amount ?? freight + accessorial + tax)
        const received = Number(finance.payment_received_amount ?? 0)
        const consignorName = order?.billing_company_name
          || customerMap[String(order?.consignor_id)]
          || '—'
        const consigneeName = customerMap[String(order?.consignee_id)]
          || (order?.consignee_address || '—').split(',')[0]

        return {
          id: finance.id || link.order_id,
          order_id: link.order_id,
          lr_number: link.lr_number || order?.lr_number || '—',
          consignor_name: consignorName,
          consignee_name: consigneeName,
          freight_charge: freight,
          accessorial_charge: accessorial,
          tax,
          tds_amount: finance.tds_amount,
          bill_amount: billAmount,
          incentive_amount: finance.incentive_amount,
          late_fee: finance.late_fee,
          part_load_charge: finance.part_load_charge,
          broker_commission: finance.broker_commission,
          payment_received_amount: received,
          balance_due: Math.max(0, billAmount - received),
          is_billed: finance.is_billed ?? trip?.is_billed,
          is_paid: finance.is_paid ?? trip?.is_paid,
          order,
          finance,
        }
      }),
    [linkedOrders, orderQueries, lrFinanceMap, customerMap, trip?.is_billed, trip?.is_paid],
  )

  const isLoading = orderQueries.some((q) => q.isLoading)

  return { rows, isLoading, linkedOrders }
}
