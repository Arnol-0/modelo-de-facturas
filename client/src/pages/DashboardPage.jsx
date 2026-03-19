import React, { useEffect, useMemo, useState } from 'react'
import KpiCard from '../components/ui/KpiCard'
import InvoicesTable from '../components/ui/InvoicesTable'
import { subscribeInvoices } from '../state/mockStore'
import Icon from '../components/ui/Icon'
import { filterInvoicesByRange, getPeriodRange } from '../state/dateRange'

const PERIOD_KEY = 'facturapro_dashboard_period_v1'

export default function DashboardPage({ onUploadClick }) {
  const [all, setAll] = useState([])
  const [period, setPeriod] = useState(() => {
    try {
      return localStorage.getItem(PERIOD_KEY) || 'month'
    } catch {
      return 'month'
    }
  })
  useEffect(() => subscribeInvoices(setAll), [])

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_KEY, period)
    } catch {}
  }, [period])

  const inPeriod = useMemo(() => {
    const range = getPeriodRange(period)
    return filterInvoicesByRange(all, range)
  }, [all, period])

  const invoices = useMemo(() => {
    return [...inPeriod]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [inPeriod])

  const totals = useMemo(() => {
    const paid = inPeriod.filter((i) => i.status === 'paid')
    const pending = inPeriod.filter((i) => i.status === 'pending')
    const sum = (arr) => arr.reduce((acc, x) => acc + x.total, 0)
    return {
      totalSpent: sum(paid),
      totalPending: sum(pending),
      count: inPeriod.length,
    }
  }, [inPeriod])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Bienvenido de nuevo, Alex</h2>
          <p>Aquí tienes el resumen de tu actividad financiera de este mes.</p>
        </div>
        <div className="segmented">
          <button className={period === 'month' ? 'seg active' : 'seg'} onClick={() => setPeriod('month')}>
            Mes
          </button>
          <button className={period === 'quarter' ? 'seg active' : 'seg'} onClick={() => setPeriod('quarter')}>
            Trimestre
          </button>
          <button className={period === 'year' ? 'seg active' : 'seg'} onClick={() => setPeriod('year')}>
            Año
          </button>
        </div>
      </div>

      <div className="kpis">
        <KpiCard title="Total Gastado" value={formatCurrency(totals.totalSpent)} delta={+12.5} tone="good" />
        <KpiCard title="Total Pendiente" value={formatCurrency(totals.totalPending)} delta={-4.2} tone="warn" />
        <KpiCard title="Cantidad de Facturas" value={String(totals.count)} delta={+8} tone="info" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h3>Facturas Recientes</h3>
            <a className="link" href="#invoices">Ver todas</a>
          </div>
          <InvoicesTable rows={invoices} compact />
        </section>

        <section className="card upload-card">
          <div className="upload-hero">
            <div className="upload-icon" aria-hidden="true">
              <Icon name="cloudUpload" size={28} />
            </div>
            <h3>Subida rápida</h3>
            <p>Arrastra tus facturas PDF aquí o haz clic para buscarlas en tu ordenador.</p>
            <button className="primary-btn" onClick={onUploadClick}>Seleccionar Archivos</button>
          </div>
          <div className="mini-list">
            <div className="mini-title">Próximos Vencimientos</div>
            <div className="mini-item">
              <div>
                <div className="mini-name">Suministros Eléctricos S.A.</div>
                <div className="mini-sub">Vence en 2 días</div>
              </div>
              <div className="mini-amount">{formatCurrency(342100)}</div>
            </div>
            <div className="mini-item">
              <div>
                <div className="mini-name">Alquiler Oficina Central</div>
                <div className="mini-sub">Vence en 5 días</div>
              </div>
              <div className="mini-amount">{formatCurrency(1200000)}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}
