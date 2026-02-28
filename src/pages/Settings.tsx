import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { uploadFile } from '../lib/quotationService'

export function Settings() {
  const { user, profile, updateProfile } = useAuth()
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const letterheadInputRef = useRef<HTMLInputElement>(null)

  const letterheadUrl = profile?.letterheadUrl

  const onLetterheadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    setUploadingLetterhead(true)
    setMessage(null)
    try {
      const url = await uploadFile(user.uid, 'letterhead', file)
      await updateProfile({ letterheadUrl: url })
      setMessage('Letterhead saved. It will be used as PDF background.')
    } catch {
      setMessage('Upload failed. Try again.')
    } finally {
      setUploadingLetterhead(false)
    }
  }

  const removeLetterhead = async () => {
    setMessage(null)
    try {
      await updateProfile({ letterheadUrl: undefined })
      setMessage('Letterhead removed.')
    } catch {
      setMessage('Failed to remove.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-500">Name</label>
          <p className="text-gray-900 font-medium">{profile?.displayName ?? '—'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Email</label>
          <p className="text-gray-900 font-medium">{profile?.email ?? '—'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Role</label>
          <p className="text-gray-900 font-medium capitalize">{profile?.role ?? '—'}</p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">PDF Letterhead (Background)</label>
          <p className="text-gray-500 text-sm mb-3">
            This image will be used as the full-page background when you download or print a quotation as PDF. You can change it anytime.
          </p>
          {letterheadUrl ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 max-h-48">
                <img src={letterheadUrl} alt="Letterhead" className="w-full h-auto object-contain max-h-48" />
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={letterheadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLetterheadUpload}
                />
                <button
                  type="button"
                  disabled={uploadingLetterhead}
                  onClick={() => letterheadInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-70"
                >
                  {uploadingLetterhead ? 'Uploading…' : 'Change letterhead'}
                </button>
                <button
                  type="button"
                  onClick={removeLetterhead}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Remove letterhead
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={letterheadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLetterheadUpload}
              />
              <button
                type="button"
                disabled={uploadingLetterhead}
                onClick={() => letterheadInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-70"
              >
                {uploadingLetterhead ? 'Uploading…' : 'Upload letterhead'}
              </button>
            </div>
          )}
          {message && <p className="text-sm mt-2 text-gray-600">{message}</p>}
        </div>
      </div>
    </div>
  )
}
