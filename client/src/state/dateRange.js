export function getPeriodRange(period) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() // 0-11

  if (period === 'year') {
    const start = new Date(y, 0, 1, 0, 0, 0, 0)
    const end = new Date(y + 1, 0, 1, 0, 0, 0, 0)
    return { start, end }
  }

  if (period === 'quarter') {
    const qStartMonth = Math.floor(m / 3) * 3
    const start = new Date(y, qStartMonth, 1, 0, 0, 0, 0)
    const end = new Date(y, qStartMonth + 3, 1, 0, 0, 0, 0)
    return { start, end }
  }

  // default: month
  const start = new Date(y, m, 1, 0, 0, 0, 0)
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0)
  return { start, end }
}

export function filterInvoicesByRange(invoices, range) {
  const startMs = range.start.getTime()
  const endMs = range.end.getTime()
  return invoices.filter((inv) => {
    const t = new Date(inv.date).getTime()
    return Number.isFinite(t) && t >= startMs && t < endMs
  })
}
