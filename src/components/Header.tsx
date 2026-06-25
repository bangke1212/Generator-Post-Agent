interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs = [
    { key: 'ideas', label: 'Kolom Ide', icon: '💡' },
    { key: 'generate', label: 'Generate', icon: '🤖' },
    { key: 'settings', label: 'API Keys', icon: '🔑' },
  ];

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl border-b border-[#1e1e4a]/50" style={{ background: 'rgba(10,10,26,0.85)' }}>
      <div className="h-[2px] bg-gradient-to-r from-[#6366f1] via-[#06b6d4] to-[#f59e0b]"></div>
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center h-16 gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center text-lg shadow-lg shadow-[#6366f1]/20">🤖</div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center text-[10px] shadow-md">🐦</div>
          </div>
          <h1 className="text-base font-bold"><span className="gradient-text">Twitter AI Agent</span></h1>
        </div>
        <nav className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => onTabChange(tab.key)}
              className={`relative px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.key ? 'text-white' : 'text-[#666680] hover:text-[#9494b8]'
              }`}>
              <span className="flex items-center gap-1.5">
                <span className={activeTab === tab.key ? 'text-base' : 'text-sm'}>{tab.icon}</span>
                {tab.label}
              </span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]"></span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
