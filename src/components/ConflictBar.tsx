interface ConflictBarProps {
  onReload: () => void
  onKeep: () => void
}

export function ConflictBar({ onReload, onKeep }: ConflictBarProps) {
  return (
    <div style={{
      background: 'rgba(160, 122, 255, 0.12)',
      border: '1px solid var(--accent-dim)',
      borderRadius: 6,
      padding: '8px 16px',
      margin: '0 auto 12px',
      maxWidth: 816,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontFamily: 'var(--font-ui)',
      fontSize: 13,
      color: 'var(--text-primary)',
    }}>
      <span>This file was changed outside MarkdownDocs.</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onReload} style={{
          padding: '4px 12px', borderRadius: 4, border: 'none',
          background: 'var(--accent)', color: '#fff', fontSize: 12,
          cursor: 'pointer', fontFamily: 'var(--font-ui)',
        }}>Reload</button>
        <button onClick={onKeep} style={{
          padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border-primary)',
          background: 'none', color: 'var(--text-secondary)', fontSize: 12,
          cursor: 'pointer', fontFamily: 'var(--font-ui)',
        }}>Keep mine</button>
      </div>
    </div>
  )
}
