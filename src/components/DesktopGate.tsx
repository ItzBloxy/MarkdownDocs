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
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-canvas)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-ui)',
        fontSize: 16,
        textAlign: 'center',
        padding: 32,
      }}>
        MarkdownDocs is designed for desktop browsers.
      </div>
    )
  }

  return <>{children}</>
}
