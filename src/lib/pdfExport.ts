import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const FIREBASE_STORAGE_ORIGIN = 'https://firebasestorage.googleapis.com'

// 1.50 inch = 38.1 mm (header and footer margin each)
const HEADER_FOOTER_INCH = 1.5
const MM_PER_INCH = 25.4
const marginTopMm = HEADER_FOOTER_INCH * MM_PER_INCH   // 38.1 mm
const marginBottomMm = HEADER_FOOTER_INCH * MM_PER_INCH

/** CORS এড়াতে Firebase Storage ইমেজ URL গুলোকে dev proxy URL এ বদলানো (কেবল same-origin request) */
function useProxyUrlsForFirebaseImages(root: HTMLElement): Array<{ img: HTMLImageElement; originalSrc: string }> {
  const origin = window.location.origin
  const proxyPrefix = `${origin}/__firebase-storage-proxy`
  const restored: Array<{ img: HTMLImageElement; originalSrc: string }> = []
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = (img as HTMLImageElement).src
    if (src && src.startsWith(FIREBASE_STORAGE_ORIGIN)) {
      const rest = src.slice(FIREBASE_STORAGE_ORIGIN.length)
      ;(img as HTMLImageElement).src = proxyPrefix + rest
      restored.push({ img: img as HTMLImageElement, originalSrc: src })
    }
  })
  return restored
}

function restoreOriginalUrls(restored: Array<{ img: HTMLImageElement; originalSrc: string }>) {
  restored.forEach(({ img, originalSrc }) => { img.src = originalSrc })
}

/** লেটারহেড URL কে ডেটা URL এ রূপান্তর (CORS এড়াতে Firebase হলে proxy ব্যবহার) */
function getLetterheadDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const origin = window.location.origin
    const proxyPrefix = `${origin}/__firebase-storage-proxy`
    const src = url.startsWith(FIREBASE_STORAGE_ORIGIN) ? proxyPrefix + url.slice(FIREBASE_STORAGE_ORIGIN.length) : url
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          resolve(c.toDataURL('image/png', 1.0))
        } else resolve(null)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export interface ExportPdfOptions {
  /** PDF পৃষ্ঠার ব্যাকগ্রাউন্ড হিসেবে ব্যবহার করার লেটারহেড ইমেজ URL (সেটিংস থেকে) */
  letterheadUrl?: string
}

export async function exportQuotationToPdf(
  elementId: string,
  filename: string = 'quotation.pdf',
  options: ExportPdfOptions = {}
): Promise<void> {
  const { letterheadUrl } = options
  const el = document.getElementById(elementId)
  if (!el) throw new Error('PDF content element not found')

  const restored = useProxyUrlsForFirebaseImages(el)
  const waitForImages = (): Promise<void> =>
    Promise.all(
      Array.from(el.querySelectorAll('img')).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve()
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
      )
    ).then(() => {})

  await waitForImages()

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  restoreOriginalUrls(restored)

  let letterheadDataUrl: string | null = null
  if (letterheadUrl) {
    letterheadDataUrl = await getLetterheadDataUrl(letterheadUrl)
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const marginSide = 10
  const contentWidth = pageWidth - marginSide * 2
  const contentHeightPerPage = pageHeight - marginTopMm - marginBottomMm
  const fullImgHeightMm = (canvas.height * contentWidth) / canvas.width

  const scaleY = canvas.height / fullImgHeightMm // px per mm

  let heightLeft = fullImgHeightMm
  let pageIndex = 0
  let sourceYmm = 0

  while (heightLeft > 0) {
    if (pageIndex > 0) pdf.addPage()

    if (letterheadDataUrl) {
      pdf.addImage(letterheadDataUrl, 'PNG', 0, 0, pageWidth, pageHeight)
    }

    const sliceHeightMm = Math.min(contentHeightPerPage, heightLeft)
    const sliceHeightPx = sliceHeightMm * scaleY
    const sourceYPx = sourceYmm * scaleY

    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = Math.ceil(sliceHeightPx)
    const ctx = sliceCanvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
    ctx.drawImage(canvas, 0, sourceYPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

    const sliceData = sliceCanvas.toDataURL('image/png', 1.0)
    pdf.addImage(sliceData, 'PNG', marginSide, marginTopMm, contentWidth, sliceHeightMm)

    sourceYmm += sliceHeightMm
    heightLeft -= sliceHeightMm
    pageIndex++
  }

  pdf.save(filename)
}
