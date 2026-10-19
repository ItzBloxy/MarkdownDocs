interface ConflictBarProps {
  onReload: () => void
  onKeep: () => void
}

export function ConflictBar({ onReload, onKeep }: ConflictBarProps) {
  return (
    <div className="conflict-bar" role="alert">
      <span className="conflict-hatch" aria-hidden="true" />
      <div className="conflict-text">
        <span className="meta">Changed on disk</span>
        <span className="conflict-message">This file was changed outside MarkdownDocs.</span>
      </div>
      <div className="conflict-actions">
        <button type="button" className="btn btn-secondary" onClick={onReload}>
          Reload from disk
        </button>
        <button type="button" className="btn btn-ghost" onClick={onKeep}>
          <span className="btn-label">Keep my changes</span>
        </button>
      </div>
    </div>
  )
}
