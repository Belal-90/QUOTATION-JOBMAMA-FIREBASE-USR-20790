import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { subscribeQuotationsForUser } from '../lib/quotationService'
import type { Quotation } from '../types'

export function Dashboard() {
  const { user, profile } = useAuth()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !profile) return
    const isAdmin = profile.role === 'admin'
    setLoading(true)
    const unsubscribe = subscribeQuotationsForUser(user.uid, isAdmin, (list) => {
      setQuotations(list)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user, profile])

  const completed = quotations.filter((q) => q.status === 'completed').length
  const pending = quotations.filter((q) => q.status === 'draft' || !q.status).length
  const totalValue = quotations
    .filter((q) => q.status === 'completed')
    .reduce((sum, q) => {
      const rowTotal = q.rows?.reduce((s, r) => s + (parseFloat(String(r.ratePerHour)) || 0), 0) ?? 0
      return sum + rowTotal
    }, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-10">
        <div className="w-full max-w-[200px] rounded-xl overflow-hidden shadow-lg bg-black border-2 border-gray-200 mb-4">
          <div className="aspect-[9/16] bg-gray-900 flex items-center justify-center overflow-hidden">
            <img
              src="/welcome-photo.png"
              alt="Welcome"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.displayName || 'User'}
        </h1>
        <p className="text-gray-500 text-center mt-2 max-w-md">
          Streamline your business process. Create professional, branded quotations for your clients in just a few clicks.
        </p>
        <Link
          to="/quotation/new"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow-lg shadow-primary-200 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Quotation
        </Link>
        <p className="text-gray-400 text-sm mt-2">
          {quotations.filter((q) => q.status === 'draft').length === 0
            ? 'No previous drafts found'
            : `${quotations.filter((q) => q.status === 'draft').length} draft(s) found`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">COMPLETED</p>
              <p className="text-xl font-bold text-gray-900">{completed} Quotations</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">PENDING</p>
              <p className="text-xl font-bold text-gray-900">{pending} Quotations</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">TOTAL VALUE (SAR)</p>
              <p className="text-xl font-bold text-gray-900">
                {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
