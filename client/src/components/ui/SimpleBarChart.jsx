import React, { useMemo } from 'react'

export default function SimpleBarChart({ data }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.total)), [data])
  return (
    <div className="chart">
      <div className="chart-bars">
        {data.map((d) => {
          const h = Math.round((d.total / max) * 100)
          return (
            <div key={d.key} className="bar">
              <div className="bar-fill" style={{ height: `${h}%` }} title={`${d.label}: ${d.total.toFixed(2)}`} />
              <div className="bar-label">{d.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
