import React from 'react'
import { statusClass } from './financeUtils'

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-[10px] rounded-full border font-bold ${statusClass(value)}`}>
      {value || '-'}
    </span>
  )
}
