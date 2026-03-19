export function applyInvoiceQuery(rows, { q, status, sort }) {
  const query = (q || '').trim().toLowerCase()

  let out = rows
  if (query) {
    out = out.filter((r) => {
      return (
        r.vendor.toLowerCase().includes(query) ||
        r.number.toLowerCase().includes(query) ||
        String(r.date).toLowerCase().includes(query)
      )
    })
  }

  if (status && status !== 'all') {
    out = out.filter((r) => r.status === status)
  }

  out = [...out]
  out.sort((a, b) => {
    switch (sort) {
      case 'date_asc':
        return new Date(a.date) - new Date(b.date)
      case 'date_desc':
        return new Date(b.date) - new Date(a.date)
      case 'total_asc':
        return a.total - b.total
      case 'total_desc':
        return b.total - a.total
      case 'vendor_asc':
        return a.vendor.localeCompare(b.vendor)
      default:
        return 0
    }
  })
  return out
}
