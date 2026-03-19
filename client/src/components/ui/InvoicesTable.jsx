import React from 'react'
import StatusBadge from './StatusBadge'
import Icon from './Icon'

export default function InvoicesTable({ rows, onToggleStatus, onViewPdf, compact = false }) {
  return (
    <div className={compact ? 'table-wrap' : 'table-wrap table-scroll'}>
      <table className={compact ? 'table compact' : 'table'}>
        <thead>
          <tr>
            <th>Factura</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            <th className="right">Monto</th>
            <th>Estado</th>
            {!compact && <th className="right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.number}</td>
              <td>{r.vendor}</td>
              <td>{formatDate(r.date)}</td>
              <td className="right">{formatCurrency(r.total)}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              {!compact && (
                <td className="right">
                  <div className="table-actions">
                    {r.pdfFilename ? (
                      <button
                        className="icon-btn icon-btn-sm"
                        title="Ver PDF"
                        aria-label="Ver PDF"
                        onClick={() => onViewPdf?.(r)}
                      >
                        <Icon name="fileText" size={18} />
                      </button>
                    ) : null}
                    <button className="secondary-btn sm" onClick={() => onToggleStatus?.(r.id)}>
                      {r.status === 'paid' ? 'Marcar Pendiente' : 'Marcar Pagada'}
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={compact ? 5 : 6} className="empty">
                No hay resultados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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

function formatDate(iso) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(d)
}
