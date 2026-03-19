// Heurísticas simples de extracción a partir de texto del PDF.
// Mejorable: plantillas por proveedor + OCR fallback.

export function extractInvoiceFieldsFromText(text) {
  const clean = (text || '').replace(/\r/g, '')

  const vendor = pickVendor(clean)
  const number = pickInvoiceNumber(clean)
  const date = pickDateISO(clean)
  const { total, currency } = pickTotal(clean)

  return { vendor, number, date, total, currency }
}

function pickVendor(t) {
  // Primeras líneas con letras (evita 'INVOICE')
  const lines = t
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12)
  const bad = /invoice|factura|bill|total|date|fecha|amount|monto/i
  const candidate = lines.find((l) => l.length >= 3 && l.length <= 40 && /[a-zA-Z]/.test(l) && !bad.test(l))
  return candidate || null
}

function pickInvoiceNumber(t) {
  const patterns = [
    /(?:invoice|factura)\s*(?:no\.?|n\.?|#)?\s*([A-Z0-9][A-Z0-9\-\/]{3,})/i,
    /\bINV[-\s]?([0-9]{3,}|[0-9]{2,4}[-\/][0-9]{2,})\b/i,
  ]
  for (const p of patterns) {
    const m = t.match(p)
    if (m) return String(m[1]).toUpperCase().startsWith('INV') ? m[1] : `INV-${m[1]}`
  }
  return null
}

function pickDateISO(t) {
  // dd/mm/yyyy o dd-mm-yyyy
  const m1 = t.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/)
  if (m1) {
    const dd = Number(m1[1])
    const mm = Number(m1[2])
    const yyyy = Number(m1[3].length === 2 ? `20${m1[3]}` : m1[3])
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }

  // yyyy-mm-dd
  const m2 = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (m2) {
    const d = new Date(`${m2[1]}-${m2[2]}-${m2[3]}T00:00:00.000Z`)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

function pickTotal(t) {
  // Busca líneas con Total / Total Due / Importe total
  const lines = t
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

  const totalLine = [...lines]
    .reverse()
    .find((l) => /(total|importe\s*total|monto\s*total|total\s*due|amount\s*due)/i.test(l))

  const line = totalLine || lines.slice(-30).join(' ')

  // € 1.234,56 o 1,234.56 USD
  const m = line.match(/(€|EUR|\$|USD|MXN)?\s*([0-9]{1,3}([.,][0-9]{3})*([.,][0-9]{2})|[0-9]+([.,][0-9]{2}))/)
  if (!m) return { total: null, currency: null }
  const symbol = m[1] || null
  const raw = m[2]
  const total = parseMoney(raw)
  const currency = symbolToCurrency(symbol)
  return { total, currency }
}

function parseMoney(s) {
  // Heurística: si hay ',' y '.' => el último separador es decimal
  const str = String(s)
  const lastComma = str.lastIndexOf(',')
  const lastDot = str.lastIndexOf('.')
  const decSep = lastComma > lastDot ? ',' : '.'
  const normalized = str
    .replace(/[\s]/g, '')
    .replace(new RegExp(`\\${decSep}`), 'DEC')
    .replace(/[.,]/g, '')
    .replace('DEC', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function symbolToCurrency(sym) {
  if (!sym) return null
  const s = sym.toUpperCase()
  if (s === '€' || s === 'EUR') return 'EUR'
  if (s === '$' || s === 'USD') return 'USD'
  if (s === 'MXN') return 'MXN'
  return null
}
