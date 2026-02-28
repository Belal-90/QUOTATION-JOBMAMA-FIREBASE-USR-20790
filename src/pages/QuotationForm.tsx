import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  createQuotation,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  uploadFile,
} from '../lib/quotationService'
import { QuotationPdfTemplate } from '../components/QuotationPdfTemplate'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import { Toast } from '../components/Toast'
import { exportQuotationToPdf } from '../lib/pdfExport'
import type { Quotation, QuotationRow } from '../types'

const DEFAULT_TERMS = [
  'Payment within the agreed timeframe (e.g., Net 30 days).',
  'Time sheet to be provided as per contract.',
  'Food arrangement as per agreement.',
  'Accommodation and transportation as per contract.',
]

const DEFAULT_GREETING = `We are pleased to submit our quotation for the supply of skilled workforce. Our team has extensive experience in similar projects and we are committed to delivering quality service.

Should you have any questions, please do not hesitate to contact us.`

function emptyRow(sl: number): QuotationRow {
  return { sl, category: '', ratePerHour: '', remarks: '' }
}

const initialFormState = (userId: string): Omit<Quotation, 'id' | 'createdAt'> => ({
  userId,
  date: new Date().toISOString().slice(0, 10).split('-').reverse().join('/'),
  supplyName: 'TAMIRAT AL SHARO FOR GENERAL CONTRACTING ESTABLISHMENT',
  supplyCrNo: '2059103505',
  supplyAddress: 'JUBAIL INDUSTRIAL CITY, KSA',
  kindAttention: '',
  clientName: '',
  clientCrNo: '',
  clientAddress: '',
  greetingText: DEFAULT_GREETING,
  rows: [emptyRow(1), emptyRow(2)],
  termsAndConditions: DEFAULT_TERMS,
  senderName: 'FATEMA KHATUN',
  senderTitle: 'Marketing Specialist & Coordinator',
  senderMobile: '0537152957',
  senderEmail: 'hossainbelal20790@gmail.com',
  signatureUrl: undefined,
  stampUrl: undefined,
  status: 'draft',
})

export function QuotationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const isEdit = id && id !== 'new'

  const [form, setForm] = useState<Omit<Quotation, 'id' | 'createdAt'> | null>(null)
  const [loading, setLoading] = useState(!!isEdit)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null)
  const [termsEditOpen, setTermsEditOpen] = useState(false)
  const [deletedCopy, setDeletedCopy] = useState<Quotation | null>(null)
  const [uploadingField, setUploadingField] = useState<'signatureUrl' | 'stampUrl' | null>(null)
  const [localPreview, setLocalPreview] = useState<{ signatureUrl?: string; stampUrl?: string }>({})

  useEffect(() => {
    if (!user) return
    if (isEdit) {
      getQuotationById(id!)
        .then((q) => {
          if (q) {
            setForm({
              userId: q.userId,
              date: q.date,
              supplyName: q.supplyName,
              supplyCrNo: q.supplyCrNo,
              supplyAddress: q.supplyAddress,
              kindAttention: q.kindAttention,
              clientName: q.clientName,
              clientCrNo: q.clientCrNo,
              clientAddress: q.clientAddress,
              greetingText: q.greetingText,
              rows: q.rows?.length ? q.rows : [emptyRow(1)],
              termsAndConditions: q.termsAndConditions?.length ? q.termsAndConditions : DEFAULT_TERMS,
              senderName: q.senderName,
              senderTitle: q.senderTitle,
              senderMobile: q.senderMobile,
              senderEmail: q.senderEmail,
              signatureUrl: q.signatureUrl,
              stampUrl: q.stampUrl,
              status: q.status ?? 'draft',
            })
          } else {
            setForm(initialFormState(user.uid))
          }
        })
        .catch(() => setForm(initialFormState(user.uid)))
        .finally(() => setLoading(false))
    } else {
      setForm(initialFormState(user.uid))
      setLoading(false)
    }
  }, [user, id, isEdit])

  const update = useCallback((patch: Partial<Quotation>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : null))
  }, [])

  const addRow = useCallback(() => {
    setForm((prev) => {
      if (!prev) return prev
      const nextSl = (prev.rows?.length ?? 0) + 1
      return { ...prev, rows: [...(prev.rows ?? []), emptyRow(nextSl)] }
    })
  }, [])

  const removeRow = useCallback((index: number) => {
    setForm((prev) => {
      if (!prev || !prev.rows?.length) return prev
      const rows = prev.rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sl: i + 1 }))
      return { ...prev, rows: rows.length ? rows : [emptyRow(1)] }
    })
  }, [])

  const updateRow = useCallback((index: number, field: keyof QuotationRow, value: string | number) => {
    setForm((prev) => {
      if (!prev || !prev.rows?.length) return prev
      const rows = [...prev.rows]
      rows[index] = { ...rows[index], [field]: value }
      return { ...prev, rows }
    })
  }, [])

  const handleSaveDraft = async () => {
    if (!user || !form) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateQuotation(id!, { ...form, status: 'draft' })
        setToast({ message: 'Quotation updated as draft.' })
      } else {
        const newId = await createQuotation(user.uid, { ...form, status: 'draft' })
        setToast({ message: 'Draft saved.' })
        navigate(`/quotation/${newId}`, { replace: true })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.'
      setToast({ message: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateQuotation = async () => {
    if (!user || !form) return
    setSaving(true)
    try {
      const payload = { ...form, status: 'completed' as const }
      if (isEdit) {
        await updateQuotation(id!, payload)
        setToast({ message: 'Quotation updated.' })
      } else {
        const newId = await createQuotation(user.uid, payload)
        navigate(`/quotation/${newId}`, { replace: true })
        setToast({ message: 'Quotation created.' })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.'
      setToast({ message: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!isEdit || !id) return
    getQuotationById(id).then((q) => {
      if (q) setDeletedCopy(q)
    })
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!id) return
    const copy = deletedCopy ? { ...deletedCopy } : null
    await deleteQuotation(id)
    setDeletedCopy(copy)
    setToast({
      message: 'Quotation deleted. Undo within 5 seconds.',
      onUndo: copy
        ? async () => {
            const { id: _id, userId: uid, createdAt: _c, ...rest } = copy
            await createQuotation(uid, rest as Parameters<typeof createQuotation>[1])
          }
        : undefined,
    })
    navigate('/dashboard', { replace: true })
  }

  const handlePrint = () => {
    const el = document.getElementById('quotation-pdf-print')
    if (!el) return
    el.classList.remove('hidden')
    const letterheadStyle = profile?.letterheadUrl
      ? `background-image:url(${profile.letterheadUrl});background-size:cover;background-repeat:no-repeat;background-position:top center;`
      : ''
    const content = el.innerHTML
    const stylesheets = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map((l) => `<link rel="stylesheet" href="${l.href}">`)
      .join('')
    const printStyles = `
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; background: #fff; font-family: system-ui, sans-serif; }
      .quotation-print-area {
        padding: 0 0.75in;
        min-height: 100vh;
        width: 100%;
        ${letterheadStyle}
      }
      #quotation-pdf-content {
        background: #fff;
        color: #000;
        padding: 0;
        width: 100%;
        max-width: none;
        margin: 0;
      }
      #quotation-pdf-content h1 { font-size: 1.25rem; font-weight: 700; text-align: center; text-decoration: underline; margin-bottom: 1rem; }
      #quotation-pdf-content p, #quotation-pdf-content div { font-size: 0.875rem; margin-bottom: 0.5rem; }
      #quotation-pdf-content .font-semibold { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 1.5rem; }
      th, td { border: 1px solid #d1d5db; padding: 0.5rem; text-align: left; }
      thead tr { background: #f3f4f6; }
      ul { padding-left: 1.25rem; margin: 0.5rem 0; }
      li { margin-bottom: 0.25rem; }
      img { max-width: 100%; height: auto; }
      @media print {
        @page { margin-top: 1.5in; margin-bottom: 1.5in; margin-left: 0.75in; margin-right: 0.75in; }
        .quotation-print-area { padding: 0 0.75in; }
      }
    `
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${stylesheets}<style>${printStyles}</style></head><body class="quotation-print-area">${content}</body></html>`
    const win = window.open('', '_blank')
    if (!win) {
      el.classList.add('hidden')
      return
    }
    win.document.write(html)
    win.document.close()
    el.classList.add('hidden')
    const doPrint = () => {
      try {
        win.focus()
        win.print()
        win.onafterprint = () => win.close()
      } catch {
        win.close()
      }
    }
    if (win.document.readyState === 'complete') {
      setTimeout(doPrint, 100)
    } else {
      win.onload = doPrint
    }
  }

  const handleDownloadPdf = async () => {
    if (!form) return
    const name = `Quotation_${form.clientName || 'Export'}_${form.date.replace(/\//g, '-')}.pdf`
    const elId = 'quotation-pdf-print'
    const el = document.getElementById(elId)
    if (el) {
      el.classList.remove('hidden')
      el.style.setProperty('position', 'fixed')
      el.style.setProperty('left', '-9999px')
    }
    try {
      await exportQuotationToPdf(elId, name, { letterheadUrl: profile?.letterheadUrl })
    } finally {
      if (el) {
        el.classList.add('hidden')
        el.style.removeProperty('position')
        el.style.removeProperty('left')
      }
    }
  }

  const handleShareEmail = () => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    if (serviceId && templateId && publicKey) {
      import('@emailjs/browser').then((emailjs) => {
        emailjs.send(serviceId, templateId, { to_email: '', quotation_link: window.location.href }, publicKey).then(
          () => setToast({ message: 'Email sent.' }),
          () => setToast({ message: 'Email failed.' })
        )
      })
    } else {
      setToast({ message: 'Email not configured. Set EmailJS env variables.' })
    }
  }

  const onFileUpload = async (field: 'signatureUrl' | 'stampUrl', file: File) => {
    if (!user || !form) return
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview((p) => ({ ...p, [field]: objectUrl }))
    setUploadingField(field)
    try {
      const url = await uploadFile(user.uid, field, file)
      setLocalPreview((p) => {
        if (p[field]) URL.revokeObjectURL(p[field]!)
        return { ...p, [field]: undefined }
      })
      update({ [field]: url })
    } catch {
      setToast({ message: 'Upload failed.' })
      setLocalPreview((p) => ({ ...p, [field]: undefined }))
    } finally {
      setUploadingField(null)
    }
  }

  if (loading || !form) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  const quotationForPdf: Quotation = { ...form, id: id ?? '', createdAt: new Date() }

  return (
    <div className="max-w-4xl mx-auto no-print">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/dashboard"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          aria-label="Back"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">QUOTATION FOR SUPPLY OF SKILLED WORKFORCE</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DATE</label>
          <div className="relative">
            <input
              type="text"
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
              placeholder="DD/MM/YYYY"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            FROM (SUPPLIER INFORMATION)
          </h3>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">SUPPLY NAME</label>
              <input
                type="text"
                value={form.supplyName}
                onChange={(e) => update({ supplyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">SUPPLY C.R NO</label>
              <input
                type="text"
                value={form.supplyCrNo}
                onChange={(e) => update({ supplyCrNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">ADDRESS</label>
              <input
                type="text"
                value={form.supplyAddress}
                onChange={(e) => update({ supplyAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            TO (CLIENT INFORMATION)
          </h3>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1">KIND ATTENTION</label>
              <input
                type="text"
                value={form.kindAttention}
                onChange={(e) => update({ kindAttention: e.target.value })}
                placeholder="e.g. Procurement Manager"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">CLIENT NAME</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => update({ clientName: e.target.value })}
                placeholder="Enter client company name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">CLIENT C.R NO</label>
              <input
                type="text"
                value={form.clientCrNo}
                onChange={(e) => update({ clientCrNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">ADDRESS</label>
              <input
                type="text"
                value={form.clientAddress}
                onChange={(e) => update({ clientAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Greeting / Introduction</label>
          <textarea
            value={form.greetingText}
            onChange={(e) => update({ greetingText: e.target.value })}
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg"
          />
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900">Quotation Table</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-2 text-left w-16">S.L.</th>
                  <th className="p-2 text-left">CATEGORY</th>
                  <th className="p-2 text-left w-32">RATE PER HOUR (SAR)</th>
                  <th className="p-2 text-left">REMARKS</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {form.rows?.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-2">
                      <input
                        type="text"
                        value={String(row.sl).padStart(2, '0')}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-100"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.category}
                        onChange={(e) => updateRow(index, 'category', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.ratePerHour}
                        onChange={(e) => updateRow(index, 'ratePerHour', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => updateRow(index, 'remarks', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        aria-label="Remove row"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-primary-300 hover:text-primary-600 m-2 rounded-lg"
          >
            ADD CATEGORY
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Terms & Conditions
          </h3>
          {!termsEditOpen ? (
            <>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-2">
                {form.termsAndConditions?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setTermsEditOpen(true)}
                className="text-primary-600 text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Terms
              </button>
            </>
          ) : (
            <div className="space-y-2">
              {form.termsAndConditions?.map((t, i) => (
                <input
                  key={i}
                  value={t}
                  onChange={(e) => {
                    const next = [...(form.termsAndConditions ?? [])]
                    next[i] = e.target.value
                    update({ termsAndConditions: next })
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                />
              ))}
              <button
                type="button"
                onClick={() => setTermsEditOpen(false)}
                className="text-primary-600 text-sm font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Thanks, and best wishes,</p>
          <p className="font-semibold text-primary-600">{form.senderName}</p>
          <p className="text-sm text-gray-500">{form.senderTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Mobile</label>
              <input
                type="text"
                value={form.senderMobile}
                onChange={(e) => update({ senderMobile: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.senderEmail}
                onChange={(e) => update({ senderEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Signature &amp; Stamp</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="signature-upload"
                onChange={(e) => e.target.files?.[0] && onFileUpload('signatureUrl', e.target.files[0])}
              />
              <label htmlFor="signature-upload" className={`cursor-pointer block ${uploadingField === 'signatureUrl' ? 'pointer-events-none opacity-70' : ''}`}>
                <div className="min-h-[120px] flex items-center justify-center mb-2">
                  {uploadingField === 'signatureUrl' ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
                      <span className="text-xs text-gray-500">Uploading…</span>
                    </div>
                  ) : (form.signatureUrl || localPreview.signatureUrl) ? (
                    <img
                      src={form.signatureUrl || localPreview.signatureUrl}
                      alt="Signature preview"
                      className="max-h-24 w-full mx-auto object-contain rounded border border-gray-200 bg-white"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">SIGNATURE</span>
                <p className="text-xs text-gray-400 mt-1">Click to upload · Preview above</p>
              </label>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="stamp-upload"
                onChange={(e) => e.target.files?.[0] && onFileUpload('stampUrl', e.target.files[0])}
              />
              <label htmlFor="stamp-upload" className={`cursor-pointer block ${uploadingField === 'stampUrl' ? 'pointer-events-none opacity-70' : ''}`}>
                <div className="min-h-[120px] flex items-center justify-center mb-2">
                  {uploadingField === 'stampUrl' ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
                      <span className="text-xs text-gray-500">Uploading…</span>
                    </div>
                  ) : (form.stampUrl || localPreview.stampUrl) ? (
                    <img
                      src={form.stampUrl || localPreview.stampUrl}
                      alt="Stamp preview"
                      className="max-h-24 w-full mx-auto object-contain rounded border border-gray-200 bg-white"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">OFFICIAL STAMP</span>
                <p className="text-xs text-gray-400 mt-1">Click to upload · Preview above</p>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            QUOTATION MANAGEMENT
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/quotation/new"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              CREATE NEW
            </Link>
            <Link
              to="/history"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              VIEW SAVED
            </Link>
            <Link
              to={isEdit ? `/quotation/${id}` : '/quotation/new'}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              UPDATE/EDIT
            </Link>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                DELETE
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg border-2 border-primary-600 text-primary-600 font-medium hover:bg-primary-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download as PDF
          </button>
          <button
            type="button"
            onClick={handleShareEmail}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Share via Email
          </button>
          <button
            type="button"
            onClick={handleGenerateQuotation}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            Generate Quotation
          </button>
        </div>
      </div>

      <div
        id="quotation-pdf-print"
        className="hidden print:block quotation-print-area mt-8"
        style={
          profile?.letterheadUrl
            ? {
                backgroundImage: `url(${profile.letterheadUrl})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'top center',
              }
            : undefined
        }
      >
        <QuotationPdfTemplate data={quotationForPdf} />
      </div>

      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.onUndo}
          onClose={() => setToast(null)}
          durationMs={5000}
        />
      )}
    </div>
  )
}
