export default function BottomNav({ activeTab = 'today', onTabChange }) {
  const tabs = [
    { id: 'today', label: 'Today', enabled: true },
    { id: 'photos', label: 'Photos', enabled: true },
    { id: 'trip', label: 'Trip', enabled: false },
    { id: 'wrapped', label: 'Wrapped', enabled: false },
  ]

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav-item${activeTab === tab.id ? ' active' : ''}`}
          disabled={!tab.enabled}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onClick={() => tab.enabled && onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
