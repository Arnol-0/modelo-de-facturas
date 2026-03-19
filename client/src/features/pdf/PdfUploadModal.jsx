import React, { useMemo, useRef, useState } from 'react'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import { extractFromPdfFile } from './extract'

export default function PdfUploadModal({ open, onClose, onExtracted }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const canSubmit = useMemo(() => !!file && !!result && !busy, [file, result, busy])

  const pick = () => inputRef.current?.click()

  const reset = () => {
    setFile(null)
    setBusy(false)
    setError('')
    setResult(null)
  }

  const onFile = async (f) => {
    if (!f) return
    setError('')
    setFile(f)
    setBusy(true)
    try {
      const out = await extractFromPdfFile(f)
      setResult(out.extracted)

      // Small hint: if there is almost no text, it might be scanned.
      const txt = String(out.text || '').trim()
      if (txt.length < 40) {
        setError('Este PDF parece escaneado (sin texto seleccionable). Para extraer totales necesitarás OCR.')
      }
    } catch (e) {
      setError('No pude leer el PDF. Prueba con otro archivo.')
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }

  const onDragOver = (e) => e.preventDefault()

  const footer = (
    <div className="row between" style={{ width: '100%' }}>
      <button className="secondary-btn" onClick={() => (reset(), onClose?.())}>
        Cancelar
      </button>
      <div className="row" style={{ marginLeft: 'auto' }}>
        <button className="secondary-btn" onClick={reset} disabled={busy}>
          Limpiar
        </button>
        <button
          className="primary-btn"
          disabled={!canSubmit}
          onClick={() => {
            onExtracted?.({ file, extracted: result })
            reset()
            onClose?.()
          }}
        >
          Crear factura
        </button>
      </div>
    </div>
  )

  return (
    <Modal open={open} title="Subir factura PDF" onClose={onClose} footer={footer}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="dropzone" onDrop={onDrop} onDragOver={onDragOver} onClick={pick} role="button" tabIndex={0}>
        <div className="drop-icon" aria-hidden="true">
          <Icon name="paperclip" size={24} />
        </div>
        <div className="drop-title">Arrastra tu PDF aquí</div>
        <div className="drop-sub">o haz clic para seleccionar un archivo</div>
        <div className="drop-meta">
          {file ? (
            <span className="mono">{file.name}</span>
          ) : (
            <span className="muted">Máx. 12MB • PDF</span>
          )}
        </div>
      </div>

      {busy && <div className="notice">Leyendo PDF…</div>}
      {error && <div className="notice bad">{error}</div>}

      {result && (
        <div className="extract-grid">
          <Field label="Proveedor" value={result.vendor || '—'} />
          <Field label="Número" value={result.number || '—'} />
          <Field label="Fecha" value={result.date ? new Date(result.date).toLocaleDateString('es-ES') : '—'} />
          <Field
            label="Total"
            value={typeof result.total === 'number' ? formatCurrency(result.total, result.currency) : '—'}
          />
        </div>
      )}
    </Modal>
  )
}

function Field({ label, value }) {
  return (
    <div className="extract-field">
      <div className="extract-label">{label}</div>
      <div className="extract-value">{value}</div>
    </div>
  )
}

function formatCurrency(n, currency = 'CLP') {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}
