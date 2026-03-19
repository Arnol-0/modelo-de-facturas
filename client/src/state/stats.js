const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function buildMonthlySeries(invoices, range = '6m') {
  const months = range === '3m' ? 3 : range === '12m' ? 12 : 6
  const now = new Date()
  const buckets = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    buckets.push({
      key,
      label: MONTHS_ES[d.getUTCMonth()],
      year: d.getUTCFullYear(),
      total: 0,
    })
  }

  const map = new Map(buckets.map((b) => [b.key, b]))
  for (const inv of invoices) {
    const d = new Date(inv.date)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const b = map.get(key)
    if (!b) continue
    b.total += inv.total
  }
  return buckets
}

export function getMonthWindow(range = '6m') {
  const months = range === '3m' ? 3 : range === '12m' ? 12 : 6
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0, 0)
  return { start, end, months }
}
