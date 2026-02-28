import { useEffect } from 'react'

interface Props {
  message: string
  undoLabel?: string
  onUndo?: () => void
  onClose: () => void
  durationMs?: number
}

export function Toast({ message, undoLabel = 'Undo', onUndo, onClose, durationMs = 5000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs)
    return () => clearTimeout(t)
  }, [onClose, durationMs])

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-gray-900 text-white rounded-xl shadow-lg p-4 flex items-center justify-between gap-3">
      <span className="text-sm">{message}</span>
      {onUndo && (
        <button
          type="button"
          onClick={() => { onUndo(); onClose(); }}
          className="text-primary-300 font-semibold text-sm whitespace-nowrap hover:text-white"
        >
          {undoLabel}
        </button>
      )}
    </div>
  )
}
