import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatClp(n) {
  return CLP.format(typeof n === 'number' && Number.isFinite(n) ? n : 0)
}

export function formatDateShort(iso) {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleDateString('es-CL')
}

function safeFilename(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\-_\.]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function exportStatsToExcel({
  filename,
  meta,
  indicators,
  invoices,
  monthlySeries,
}) {
  const wb = XLSX.utils.book_new()

  const indicatorRows = [
    ['Reporte', meta?.title || 'Estadísticas'],
    ['Período', meta?.periodLabel || '—'],
    ['Generado', new Date().toLocaleString('es-CL')],
    [],
    ['Indicador', 'Valor'],
    ['Promedio mensual', indicators?.avg ?? 0],
    ['Mes con mayor gasto', indicators?.maxLabel || '—'],
    ['Monto mayor', indicators?.maxTotal ?? 0],
    ['Tendencia (último vs anterior)', `${Number.isFinite(indicators?.trend) ? indicators.trend.toFixed(1) : '0.0'}%`],
  ]

  const wsIndicators = XLSX.utils.aoa_to_sheet(indicatorRows)
  wsIndicators['!cols'] = [{ wch: 28 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsIndicators, 'Indicadores')

  const seriesRows = [
    ['Mes', 'Total (CLP)'],
    ...(monthlySeries || []).map((x) => [x.label, x.total || 0]),
  ]
  const wsSeries = XLSX.utils.aoa_to_sheet(seriesRows)
  wsSeries['!cols'] = [{ wch: 10 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsSeries, 'Serie mensual')

  const invoiceRows = [
    ['N°', 'Proveedor', 'Fecha', 'Estado', 'Total (CLP)'],
    ...(invoices || []).map((inv) => [
      inv.number,
      inv.vendor,
      formatDateShort(inv.date),
      inv.status === 'paid' ? 'Pagada' : 'Pendiente',
      inv.total || 0,
    ]),
  ]
  const wsInvoices = XLSX.utils.aoa_to_sheet(invoiceRows)
  wsInvoices['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 12 }, { wch: 12 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'Facturas')

  const outName = safeFilename(filename || 'punto_factura_estadisticas.xlsx')
  XLSX.writeFile(wb, outName)
}

export function exportStatsToPdf({
  filename,
  meta,
  indicators,
  invoices,
  monthlySeries,
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(meta?.title || 'Reporte de Estadísticas', 40, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(120)
  doc.text(meta?.periodLabel || 'Período: —', 40, 68)
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 40, 86)

  // KPI cards (simple boxes)
  const boxY = 110
  const boxH = 58
  const gap = 12
  const boxW = (doc.internal.pageSize.getWidth() - 40 * 2 - gap * 2) / 3

  const kpis = [
    { label: 'Promedio mensual', value: formatClp(indicators?.avg ?? 0) },
    { label: 'Mes mayor', value: indicators?.maxLabel || '—', sub: formatClp(indicators?.maxTotal ?? 0) },
    {
      label: 'Tendencia',
      value: `${Number.isFinite(indicators?.trend) ? indicators.trend.toFixed(1) : '0.0'}%`,
      accent: (indicators?.trend ?? 0) >= 0 ? [34, 197, 94] : [239, 68, 68],
    },
  ]

  kpis.forEach((k, i) => {
    const x = 40 + i * (boxW + gap)
    doc.setDrawColor(255, 255, 255)
    doc.setFillColor(245, 247, 255)
    doc.roundedRect(x, boxY, boxW, boxH, 10, 10, 'F')

    doc.setTextColor(80)
    doc.setFontSize(10)
    doc.text(k.label, x + 14, boxY + 20)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    if (k.accent) doc.setTextColor(...k.accent)
    else doc.setTextColor(20)
    doc.text(String(k.value), x + 14, boxY + 42)

    if (k.sub) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(90)
      doc.text(String(k.sub), x + 14, boxY + 56)
    }
    doc.setFont('helvetica', 'normal')
  })

  // Series mini-table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30)
  doc.text('Gasto mensual (resumen)', 40, boxY + boxH + 34)

  autoTable(doc, {
    startY: boxY + boxH + 44,
    head: [['Mes', 'Total']],
    body: (monthlySeries || []).map((x) => [x.label, formatClp(x.total || 0)]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 160, halign: 'right' } },
    margin: { left: 40, right: 40 },
  })

  // Invoice detail table
  const nextY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 24 : 520
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Facturas del período', 40, nextY)

  autoTable(doc, {
    startY: nextY + 10,
    head: [['N°', 'Proveedor', 'Fecha', 'Estado', 'Total']],
    body: (invoices || []).map((inv) => [
      inv.number,
      inv.vendor,
      formatDateShort(inv.date),
      inv.status === 'paid' ? 'Pagada' : 'Pendiente',
      formatClp(inv.total || 0),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 180 },
      2: { cellWidth: 70 },
      3: { cellWidth: 70 },
      4: { cellWidth: 80, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
  })

  const outName = safeFilename(filename || 'punto_factura_estadisticas.pdf')
  doc.save(outName)
}
