import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { extractInvoiceFieldsFromText } from './parseText'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export async function extractFromPdfFile(file) {
  const buf = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: buf })
  const pdf = await loadingTask.promise

  let text = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items.map((it) => it.str).join(' ')
    text += `\n${pageText}`
  }

  const extracted = extractInvoiceFieldsFromText(text)
  return { text, extracted }
}

// Re-export so UI code can import from one place if needed.
export { extractInvoiceFieldsFromText }
