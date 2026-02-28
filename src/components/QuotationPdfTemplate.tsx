import type { Quotation } from '../types'

interface Props {
  data: Quotation
  className?: string
}

export function QuotationPdfTemplate({ data, className = '' }: Props) {
  return (
    <div className={`bg-white text-black p-8 max-w-[210mm] w-full print:w-full print:max-w-none print:p-0 ${className}`} id="quotation-pdf-content">
      <h1 className="text-xl font-bold text-center underline mb-4">
        QUOTATION FOR SUPPLY OF SKILLED WORKFORCE
      </h1>
      <p className="text-sm mb-6">Date: {data.date}</p>

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="font-semibold mb-1">FROM (SUPPLIER)</p>
          <p>SUPPLY NAME: {data.supplyName}</p>
          <p>SUPPLY C.R NO.: {data.supplyCrNo}</p>
          <p>{data.supplyAddress}</p>
        </div>
        <div>
          <p className="font-semibold mb-1">KIND ATTENTION (CLIENT)</p>
          <p>CLIENT NAME: {data.clientName}</p>
          <p>CLIENT C.R NO.: {data.clientCrNo}</p>
          <p>ADDRESS: {data.clientAddress}</p>
        </div>
      </div>

      <p className="text-sm mb-2">Dear Sir,</p>
      <div className="text-sm whitespace-pre-wrap mb-6">{data.greetingText}</div>

      <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">S.L.</th>
            <th className="border border-gray-300 p-2 text-left">CATEGORY</th>
            <th className="border border-gray-300 p-2 text-left">RATE PER HOUR (SAR)</th>
            <th className="border border-gray-300 p-2 text-left">REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {data.rows?.map((row) => (
            <tr key={row.sl}>
              <td className="border border-gray-300 p-2">{String(row.sl).padStart(2, '0')}</td>
              <td className="border border-gray-300 p-2">{row.category}</td>
              <td className="border border-gray-300 p-2">{row.ratePerHour}</td>
              <td className="border border-gray-300 p-2">{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.termsAndConditions?.length > 0 && (
        <div className="text-sm mb-6">
          <p className="font-semibold mb-2">Terms & Conditions:</p>
          <ul className="list-disc pl-5 space-y-1">
            {data.termsAndConditions.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm mb-2">Thanks, and best wishes,</p>
      <div className="flex items-start gap-6 flex-wrap">
        <div>
          <p className="font-semibold text-primary-600">{data.senderName}</p>
          <p className="text-sm">{data.senderTitle}</p>
          <p className="text-sm">{data.senderMobile} · {data.senderEmail}</p>
        </div>
        <div className="flex gap-4 items-end">
          {data.stampUrl && (
            <div className="w-24 h-24 border border-gray-300 flex items-center justify-center bg-gray-50">
              <img src={data.stampUrl} alt="Stamp" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          {data.signatureUrl && (
            <div className="w-32 border-b-2 border-black">
              <img src={data.signatureUrl} alt="Signature" className="max-h-12 object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
