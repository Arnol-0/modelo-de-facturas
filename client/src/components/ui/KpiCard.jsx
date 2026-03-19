import React from 'react'
import Icon from './Icon'

export default function KpiCard({ title, value, delta, tone = 'info' }) {
  const sign = typeof delta === 'number' ? (delta > 0 ? '+' : '') : ''
  const iconName = tone === 'good' ? 'wallet' : tone === 'warn' ? 'clock' : 'receipt'
  return (
    <div className="kpi">
      <div className="kpi-head">
        <div className={`kpi-icon ${tone}`}>
          <Icon name={iconName} size={20} />
        </div>
        <div className={delta >= 0 ? 'kpi-delta good' : 'kpi-delta bad'}>
          {typeof delta === 'number' ? `${sign}${delta}%` : ''}
        </div>
      </div>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  )
}
