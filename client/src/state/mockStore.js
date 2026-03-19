import { getMockInvoices } from './mockData'

// Store en memoria + localStorage para demo.
const KEY = 'facturapro_mock_invoices_v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return getMockInvoices()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : getMockInvoices()
  } catch {
    return getMockInvoices()
  }
}

let invoices = load()
const listeners = new Set()

// In-memory PDF cache (session only). We intentionally don't persist File objects.
const pdfFilesByInvoiceId = new Map()

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(invoices))
  } catch {}
  for (const fn of listeners) fn(invoices)
}

export function subscribeInvoices(fn) {
  listeners.add(fn)
  fn(invoices)
  return () => listeners.delete(fn)
}

export function addInvoiceFromExtract(extracted) {
  const id = String(Date.now())
  const inv = {
    id,
    number: extracted.number || `INV-${id.slice(-6)}`,
    vendor: extracted.vendor || 'Proveedor'
    ,
    date: extracted.date || new Date().toISOString(),
    total: typeof extracted.total === 'number' ? extracted.total : 0,
    status: 'pending',
    history: [{ at: new Date().toISOString(), from: 'paid', to: 'pending' }],
    pdfFilename: extracted.pdfFilename,
  }

  // Keep the original PDF File available for viewing during the session.
  if (extracted?.pdfFile) {
    pdfFilesByInvoiceId.set(id, extracted.pdfFile)
  }

  invoices = [inv, ...invoices]
  emit()
  return inv
}

export function getInvoicePdfFile(id) {
  return pdfFilesByInvoiceId.get(String(id)) || null
}

export function toggleInvoiceStatus(id) {
  invoices = invoices.map((x) => {
    if (x.id !== id) return x
    const next = x.status === 'paid' ? 'pending' : 'paid'
    return {
      ...x,
      status: next,
      history: [{ at: new Date().toISOString(), from: x.status, to: next }, ...(x.history || [])],
    }
  })
  emit()
}

export function getInvoicesSnapshot() {
  return invoices
}
