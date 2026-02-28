import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getQuotationsForUser, deleteQuotation } from '../lib/quotationService'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import type { Quotation } from '../types'

export function History() {
  const { user, profile } = useAuth()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    if (!user || !profile) return
    const isAdmin = profile.role === 'admin'
    setLoading(true)
    getQuotationsForUser(user.uid, isAdmin)
      .then(setQuotations)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [user, profile])

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return
    setDeleting(true)
    try {
      await deleteQuotation(deleteTarget.id)
      setQuotations((prev) => prev.filter((q) => q.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <Link
          to="/quotation/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
        >
          <span>+</span> New Quotation
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-8 text-center text-gray-500">
          No quotations yet.{" "}
          <Link to="/quotation/new" className="text-primary-600 font-medium hover:underline">
            Create one
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {quotations.map((q) => (
            <li key={q.id} className="bg-white rounded-xl shadow border border-gray-100 p-4 hover:border-primary-200 transition">
              <div className="flex justify-between items-start gap-3">
                <Link to={`/quotation/${q.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 uppercase">
                    {q.clientName || 'Untitled'} — {q.date}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {q.rows?.length ?? 0} categories · {q.status === 'completed' ? 'Completed' : 'Draft'}
                  </p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/quotation/${q.id}`}
                    className="text-primary-600 text-sm font-medium hover:underline"
                  >
                    Edit →
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setDeleteTarget(q)
                    }}
                    className="text-red-600 text-sm font-medium hover:underline"
                    aria-label="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        message={`Delete "${deleteTarget?.clientName || 'this quotation'}"? This cannot be undone.`}
      />
    </div>
  )
}
