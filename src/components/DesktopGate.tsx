import { useState, useEffect } from 'react'

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const [tooSmall, setTooSmall] = useState(false)

  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (tooSmall) {
    return (
      <div className="desktop-gate">
        <h1>MarkdownDocs</h1>
        <p>
          MarkdownDocs needs a window at least 1024px wide. Widen this window,
          or open it on a desktop browser.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
