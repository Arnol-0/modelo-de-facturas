import React, { useEffect, useMemo, useState } from 'react'
import InvoicesTable from '../components/ui/InvoicesTable'
import ConfirmModal from '../components/ui/ConfirmModal'
import { applyInvoiceQuery } from '../state/query'
import { getInvoicePdfFile, subscribeInvoices, toggleInvoiceStatus } from '../state/mockStore'
import PdfViewerModal from '../features/pdf/PdfViewerModal'

export default function InvoicesPage() {
  const [all, setAll] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('date_desc')
  const [page, setPage] = useState(1)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerInvoice, setViewerInvoice] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmInvoiceId, setConfirmInvoiceId] = useState(null)

  useEffect(() => {
    return subscribeInvoices(setAll)
  }, [])

  const rows = useMemo(
    () => applyInvoiceQuery(all, { q, status, sort }),
    [all, q, status, sort]
  )

  // reset page when query changes
  useEffect(() => {
    setPage(1)
  }, [q, status, sort])

  const pageSize = 10
  const totalPages = useMemo(() => Math.max(1, Math.ceil(rows.length / pageSize)), [rows.length])
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])

  const onToggleStatus = (id) => {
    const inv = all.find((x) => x.id === id)
    if (!inv) return

    // Only confirm when moving from paid -> pending
    if (inv.status === 'paid') {
      setConfirmInvoiceId(id)
      setConfirmOpen(true)
      return
    }

    toggleInvoiceStatus(id)
  }

  const confirmInvoice = useMemo(() => {
    if (!confirmInvoiceId) return null
    return all.find((x) => x.id === confirmInvoiceId) || null
  }, [all, confirmInvoiceId])

  const onViewPdf = (invoice) => {
    setViewerInvoice(invoice)
    setViewerOpen(true)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Gestión de Facturas</h2>
          <p>Administra y realiza el seguimiento de tus facturas y pagos.</p>
        </div>
      </div>

      <section className="card">
        <div className="filters">
          <div className="filter">
            <span className="filter-label">Búsqueda</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por proveedor, número o fecha..."
            />
          </div>
          <div className="filter">
            <span className="filter-label">Estado</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              <option value="paid">Pagadas</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
          <div className="filter">
            <span className="filter-label">Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date_desc">Fecha (reciente)</option>
              <option value="date_asc">Fecha (antigua)</option>
              <option value="total_desc">Monto (mayor)</option>
              <option value="total_asc">Monto (menor)</option>
              <option value="vendor_asc">Proveedor (A→Z)</option>
            </select>
          </div>
        </div>

        <InvoicesTable rows={pagedRows} onToggleStatus={onToggleStatus} onViewPdf={onViewPdf} />

        <div className="table-footer">
          <div className="muted" style={{ fontSize: 12 }}>
            Mostrando {(rows.length ? (page - 1) * pageSize + 1 : 0)}–{Math.min(page * pageSize, rows.length)} de {rows.length}
          </div>
          <div className="pager">
            <button className="secondary-btn sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Anterior
            </button>
            <div className="pager-tabs" role="tablist" aria-label="Paginación">
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                const p = idx + 1
                return (
                  <button
                    key={p}
                    className={p === page ? 'seg active' : 'seg'}
                    onClick={() => setPage(p)}
                    role="tab"
                    aria-selected={p === page}
                  >
                    {p}
                  </button>
                )
              })}
              {totalPages > 7 ? <span className="muted" style={{ padding: '0 6px' }}>…</span> : null}
            </div>
            <button
              className="secondary-btn sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      <PdfViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        file={viewerInvoice ? getInvoicePdfFile(viewerInvoice.id) : null}
        filename={viewerInvoice?.pdfFilename}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Dejar pago pendiente"
        message={
          <>
            ¿Quieres dejar <b>pendiente</b> el pago de esta factura?
            {confirmInvoice ? (
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                {confirmInvoice.number} · {confirmInvoice.vendor}
              </div>
            ) : null}
          </>
        }
        confirmText="Sí, dejar pendiente"
        cancelText="Cancelar"
        tone="danger"
        onClose={() => {
          setConfirmOpen(false)
          setConfirmInvoiceId(null)
        }}
        onConfirm={() => {
          if (confirmInvoiceId) toggleInvoiceStatus(confirmInvoiceId)
        }}
      />
    </div>
  )
}
