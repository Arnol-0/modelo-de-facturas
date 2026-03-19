// Pure text parsing utilities (no pdfjs dependency).
// This file is safe to import from Node tests.

export function extractInvoiceFieldsFromText(text) {
  const clean = normalizeText(text)
  return {
    vendor: pickVendor(clean),
    number: pickInvoiceNumber(clean),
    date: pickDateISO(clean),
    ...pickTotal(clean),
  }
}

function normalizeText(text) {
  const t = String(text || '')
    .replace(/\r/g, '')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\u00A0/g, ' ') // nbsp
  return t
    .split('\n')
    .map((l) => l.replace(/\s{2,}/g, ' ').trim())
    .filter((l) => l.length)
    .join('\n')
}

function pickVendor(t) {
  const lines = t
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 14)

  const bad = /invoice|factura|boleta|folio|rut|giro|total|date|fecha|amount|monto|neto|iva/i
  const candidate = lines.find((l) => l.length >= 3 && l.length <= 60 && /[a-zA-ZÁÉÍÓÚÑ]/.test(l) && !bad.test(l))
  return candidate || ''
}

function pickInvoiceNumber(t) {
  const patterns = [
    /\bfolio\s*(?:n\u00B0|nº|no\.?|nro\.?|#)?\s*[:\-]?\s*([0-9]{3,})\b/i,
    /\b(?:factura|boleta|nota\s+de\s+cr[eé]dito|nota\s+de\s+d[eé]bito)\s*(?:electr[oó]nica)?\s*(?:n\u00B0|nº|no\.?|nro\.?|#)?\s*[:\-]?\s*([0-9]{3,})\b/i,
    /(?:invoice|factura)\s*(?:no\.?|n\.?|#)?\s*([A-Z0-9][A-Z0-9\-\/]{3,})/i,
    /\bINV[-\s]?([0-9]{3,}|[0-9]{2,4}[-\/][0-9]{2,})\b/i,
  ]

  for (const p of patterns) {
    const m = t.match(p)
    if (m) return String(m[1]).toUpperCase()
  }
  return ''
}

function pickDateISO(t) {
  const m1 = t.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/)
  if (m1) {
    const dd = Number(m1[1])
    const mm = Number(m1[2])
    const yyyy = Number(m1[3].length === 2 ? `20${m1[3]}` : m1[3])
    const d = new Date(Date.UTC(yyyy, mm - 1, dd))
    return Number.isNaN(d.getTime()) ? '' : d.toISOString()
  }

  const mEs = t.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})\b/i
  )
  if (mEs) {
    const dd = Number(mEs[1])
    const monthWord = String(mEs[2]).toLowerCase()
    const yyyy = Number(mEs[3])
    const months = {
      enero: 1,
      febrero: 2,
      marzo: 3,
      abril: 4,
      mayo: 5,
      junio: 6,
      julio: 7,
      agosto: 8,
      septiembre: 9,
      setiembre: 9,
      octubre: 10,
      noviembre: 11,
      diciembre: 12,
    }
    const mm = months[monthWord]
    if (mm) {
      const d = new Date(Date.UTC(yyyy, mm - 1, dd))
      return Number.isNaN(d.getTime()) ? '' : d.toISOString()
    }
  }

  const m2 = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (m2) {
    const d = new Date(`${m2[1]}-${m2[2]}-${m2[3]}T00:00:00.000Z`)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString()
  }

  return ''
}

function pickTotal(t) {
  const lines = t
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

  const totalKeywords = /(total\s*(a\s*pagar)?|monto\s*total|total\s*general|total\s*factura|total\s*documento|total\s*cobrar|total\s*c\.?\s*iva\s*incl\.?|total\s*con\s*iva|importe\s*total|amount\s*due|total\s*due)/i
  const candidates = [...lines].reverse().filter((l) => totalKeywords.test(l)).slice(0, 8)
  const fallback = lines.slice(-50)
  const searchSpace = (candidates.length ? candidates : fallback).join(' \n ')

  const amounts = extractMoneyCandidates(searchSpace)
  if (!amounts.length) return { total: null, currency: 'CLP' }

  amounts.sort((a, b) => b.value - a.value)
  const best = amounts[0]
  return { total: best.value, currency: best.currency || 'CLP' }
}

function parseMoney(s) {
  const str = String(s).replace(/\u00A0/g, ' ').replace(/\s/g, '')
  const cleaned = str.replace(/(CLP|PESOS|\$)/gi, '')

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  const hasComma = lastComma !== -1
  const hasDot = lastDot !== -1

  if (hasDot && !hasComma) {
    const n = Number(cleaned.replace(/\./g, ''))
    return Number.isFinite(n) ? n : null
  }

  const decSep = lastComma > lastDot ? ',' : '.'
  const normalized = cleaned
    .replace(new RegExp(`\\${decSep}`), 'DEC')
    .replace(/[.,]/g, '')
    .replace('DEC', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function extractMoneyCandidates(text) {
  const region = String(text || '')
  const re = /(CLP|\$|PESOS)?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{1,2})?|[0-9]{4,}(?:[.,][0-9]{1,2})?)/gi

  const out = []
  let m
  while ((m = re.exec(region))) {
    const sym = (m[1] || '').toUpperCase()
    const raw = m[2]
    const val = parseMoney(`${sym} ${raw}`)
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      out.push({ value: val, currency: sym === '$' || sym === 'PESOS' ? 'CLP' : sym || '' })
    }
  }
  return out
}
