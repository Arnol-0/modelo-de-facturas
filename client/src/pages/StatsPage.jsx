import React, { useEffect, useMemo, useState } from 'react'
import { buildMonthlySeries, getMonthWindow } from '../state/stats'
import SimpleBarChart from '../components/ui/SimpleBarChart'
import { subscribeInvoices } from '../state/mockStore'
import { exportStatsToExcel, exportStatsToPdf, formatClp } from '../utils/exporters'

export default function StatsPage() {
  const [range, setRange] = useState('6m')
  const [invoices, setInvoices] = useState([])
  useEffect(() => subscribeInvoices(setInvoices), [])

  const window = useMemo(() => getMonthWindow(range), [range])
  const invoicesInWindow = useMemo(() => {
    const startMs = window.start.getTime()
    const endMs = window.end.getTime()
    return invoices
      .filter((inv) => {
        const t = new Date(inv.date).getTime()
        return Number.isFinite(t) && t >= startMs && t < endMs
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [invoices, window])

  const series = useMemo(() => buildMonthlySeries(invoicesInWindow, range), [invoicesInWindow, range])

  const insights = useMemo(() => {
    const vals = series.map((x) => x.total)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const max = series.reduce((acc, x) => (x.total > acc.total ? x : acc), series[0] || { total: 0 })
    const last = vals[vals.length - 1] ?? 0
    const prev = vals[vals.length - 2] ?? 0
    const trend = prev === 0 ? 0 : ((last - prev) / prev) * 100
    return { avg, max, trend }
  }, [series])

  const periodLabel = useMemo(() => {
    const months = range === '3m' ? 3 : range === '12m' ? 12 : 6
    const start = window.start.toLocaleDateString('es-CL')
    const end = new Date(window.end.getTime() - 1).toLocaleDateString('es-CL')
    return `Últimos ${months} meses (${start} – ${end})`
  }, [range, window])

  function handleExportPdf() {
    exportStatsToPdf({
      filename: `facturapro_estadisticas_${range}.pdf`,
      meta: { title: 'FacturaPro — Estadísticas', periodLabel },
      indicators: {
        avg: insights.avg,
        maxLabel: insights.max?.label || '—',
        maxTotal: insights.max?.total || 0,
        trend: insights.trend,
      },
      invoices: invoicesInWindow,
      monthlySeries: series,
    })
  }

  function handleExportExcel() {
    exportStatsToExcel({
      filename: `facturapro_estadisticas_${range}.xlsx`,
      meta: { title: 'FacturaPro — Estadísticas', periodLabel },
      indicators: {
        avg: insights.avg,
        maxLabel: insights.max?.label || '—',
        maxTotal: insights.max?.total || 0,
        trend: insights.trend,
      },
      invoices: invoicesInWindow,
      monthlySeries: series,
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Estadísticas</h2>
          <p>Gastos mensuales, comparación de periodos y tendencias.</p>
        </div>
        <div className="page-head-actions">
          <div className="export-actions">
            <button className="secondary-btn sm" onClick={handleExportPdf}>
              Descargar PDF
            </button>
            <button className="secondary-btn sm" onClick={handleExportExcel}>
              Descargar Excel
            </button>
          </div>
          <div className="segmented">
          <button className={range === '3m' ? 'seg active' : 'seg'} onClick={() => setRange('3m')}>
            3M
          </button>
          <button className={range === '6m' ? 'seg active' : 'seg'} onClick={() => setRange('6m')}>
            6M
          </button>
          <button className={range === '12m' ? 'seg active' : 'seg'} onClick={() => setRange('12m')}>
            12M
          </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h3>Gastos por mes</h3>
          </div>
          <SimpleBarChart data={series} />
        </section>

        <section className="card">
          <div className="card-head">
            <h3>Indicadores</h3>
          </div>
          <div className="insights">
            <div className="insight">
              <div className="insight-label">Promedio mensual</div>
              <div className="insight-value">{formatClp(insights.avg)}</div>
            </div>
            <div className="insight">
              <div className="insight-label">Mes con mayor gasto</div>
              <div className="insight-value">{insights.max?.label || '—'}</div>
              <div className="insight-sub">{formatClp(insights.max?.total || 0)}</div>
            </div>
            <div className="insight">
              <div className="insight-label">Tendencia (último vs anterior)</div>
              <div className={insights.trend >= 0 ? 'insight-value good' : 'insight-value bad'}>
                {Number.isFinite(insights.trend) ? `${insights.trend.toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
