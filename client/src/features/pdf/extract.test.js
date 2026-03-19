import { extractInvoiceFieldsFromText } from './parseText.js'

function expect(cond, msg) {
  if (!cond) throw new Error(msg)
}

function closeTo(a, b, eps = 0.01) {
  return Math.abs(a - b) <= eps
}

function run() {
  // Typical Chilean electronic invoice
  {
    const text = `
FACTURA ELECTRÓNICA
FOLIO: 123456
RUT: 76.123.456-7
RAZÓN SOCIAL EMISOR SPA
FECHA EMISIÓN: 18/03/2026
NETO $ 1.000.000
IVA (19%) $ 190.000
TOTAL A PAGAR $ 1.190.000
    `.trim()

    const out = extractInvoiceFieldsFromText(text)
    expect(out.number === '123456', 'should extract folio number')
    expect(out.currency === 'CLP', 'should default currency to CLP')
    expect(out.total === 1190000, `should extract total 1.190.000, got ${out.total}`)
    expect(!!out.date, 'should extract date')
  }

  // Total line with CLP keyword and thousand separators
  {
    const text = `
SERVICIOS EJEMPLO LTDA
Fecha: 18 de marzo de 2026
Total general: CLP 2.345.678
    `.trim()

    const out = extractInvoiceFieldsFromText(text)
    expect(out.total === 2345678, `should extract 2.345.678, got ${out.total}`)
    expect(!!out.date, 'should extract spanish date')
  }

  // Decimals with comma
  {
    const text = `
Factura
Total a pagar: $ 1.234.567,89
    `.trim()

    const out = extractInvoiceFieldsFromText(text)
    expect(closeTo(out.total, 1234567.89), `should extract decimals, got ${out.total}`)
  }

  console.log('extract.test.js: PASS')
}

run()
