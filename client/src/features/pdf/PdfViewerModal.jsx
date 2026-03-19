import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'

/**
 * Simple PDF viewer.
 * - If `file` is provided, we render it via object URL.
 * - If not, we show a friendly message (because localStorage can't store File objects).
 */
export default function PdfViewerModal({ open, onClose, file, filename }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!open) return
    if (!file) {
      setUrl('')
      return
    }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [open, file])

  const title = useMemo(() => {
    if (filename) return `PDF: ${filename}`
    return 'Ver PDF'
  }, [filename])

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {url ? (
        <div style={{ height: '70vh' }}>
          <iframe title={title} src={url} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }} />
        </div>
      ) : (
        <div className="notice">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Esta factura no tiene un PDF disponible en este dispositivo.</div>
          <div className="muted">
            En el modo demo, el archivo PDF no se guarda en localStorage. Si acabas de subirlo, vuelve a abrirlo desde la misma sesión.
          </div>
        </div>
      )}
    </Modal>
  )
}
