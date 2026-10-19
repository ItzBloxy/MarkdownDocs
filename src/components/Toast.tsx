import { useState, useEffect, useCallback, useRef } from 'react'

let showToastFn: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  showToastFn?.(msg)
}

export function ToastContainer() {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMessage(null), 2200)
  }, [])

  useEffect(() => {
    showToastFn = show
    return () => {
      showToastFn = null
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [show])

  if (!message) return null

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <span className="toast-glyph" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M12 10v9" />
          <path d="M12 5v1.5" />
        </svg>
      </span>
      {message}
    </div>
  )
}
