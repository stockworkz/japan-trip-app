export default function BottomNav({ activeTab = 'today' }) {
  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'trip', label: 'Trip' },
    { id: 'memories', label: 'Memories' },
    { id: 'wrapped', label: 'Wrapped' },
  ]

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav-item${activeTab === tab.id ? ' active' : ''}`}
          disabled={tab.id !== 'today'}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
