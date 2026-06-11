export const asList = (data) => data?.results || (Array.isArray(data) ? data : [])

export const money = (value) =>
  Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const moneyINR = (value) => `₹ ${money(value)}`

export const statusClass = (value = '') => {
  const v = String(value).toUpperCase()
  if (['PAID', 'VERIFIED', 'APPROVED', 'DELIVERED', 'SETTLED', 'FILED', 'RECONCILED', 'COMPLETED', 'POSTED', 'FINALIZED'].includes(v)) {
    return 'bg-green-50 text-green-700 border-green-200'
  }
  if (['PENDING', 'DRAFT', 'RECEIVED', 'CALCULATED', 'PROCESSING', 'IN_TRANSIT', 'PARTIAL', 'UNPAID'].includes(v)) {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  if (['OVERDUE', 'BOUNCED', 'CANCELLED', 'REJECTED'].includes(v)) {
    return 'bg-red-50 text-red-700 border-red-200'
  }
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

export const invoiceStatusForTrip = (trip) => {
  if (trip?.is_paid) return 'PAID'
  if (trip?.is_billed) return 'RAISED'
  return 'PENDING'
}

export const routeShort = (origin, destination) => {
  const o = origin || '—'
  const d = destination || '—'
  if (o.length > 24 || d.length > 24) return `${o.slice(0, 20)}… → ${d.slice(0, 20)}…`
  return `${o} → ${d}`
}

function isHtmlErrorPayload(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trimStart()
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')
}

/** Extract human-readable validation messages from DRF / axios error payloads. */
export function formatApiErrorMessages(data) {
  if (data == null) return []
  if (typeof data === 'string') {
    if (isHtmlErrorPayload(data)) return ['Server error — please try again or contact support.']
    return [data]
  }
  if (Array.isArray(data)) {
    return data.flatMap((item) => formatApiErrorMessages(item))
  }
  if (typeof data !== 'object') return [String(data)]

  if (data.detail != null) {
    return formatApiErrorMessages(data.detail)
  }
  if (data.message != null) {
    return formatApiErrorMessages(data.message)
  }

  const messages = []
  Object.entries(data).forEach(([key, value]) => {
    if (value == null) return
    const nested = formatApiErrorMessages(value)
    if (key === 'non_field_errors') {
      messages.push(...nested)
    } else {
      nested.forEach((msg) => {
        messages.push(key === 'non_field_errors' ? msg : `${key}: ${msg}`)
      })
    }
  })
  return messages
}

export function formatApiError(data) {
  const messages = formatApiErrorMessages(data)
  return messages.length ? messages.join(' ') : 'Request failed'
}

export const BILLABLE_TRIP_STATUSES = ['COMPLETED', 'DELIVERED']

export function isTripInvoiceEligible(trip) {
  return BILLABLE_TRIP_STATUSES.includes(String(trip?.status || '').toUpperCase())
}
