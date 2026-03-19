import React from 'react'

export default function StatusBadge({ status }) {
  const label = status === 'paid' ? 'Pagada' : 'Pendiente'
  return <span className={status === 'paid' ? 'badge paid' : 'badge pending'}>{label}</span>
}
