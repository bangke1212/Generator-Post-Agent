interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenu?: () => void;
}

const labels: Record<string, { eyebrow: string; title: string }> = {
  ideas: { eyebrow: 'IDEA STUDIO', title: 'Turn a thought into a conversation' },
  generate: { eyebrow: 'QUICK GENERATE', title: 'Shape one post with intent' },
  images: { eyebrow: 'TEXT TO IMAGE', title: 'Turn a prompt into an image' },
  settings: { eyebrow: 'AI PROVIDERS', title: 'Connect the models you trust' },
};

export default function Header({ activeTab, onTabChange, onMenu }: HeaderProps) {
  const current = labels[activeTab] || labels.ideas;
  return <header className="topbar">
    <div className="topbar-left">
      <button className="mobile-menu-button" onClick={onMenu} aria-label="Buka menu">☰</button>
      <div><span className="topbar-eyebrow">{current.eyebrow} <i> / </i> POSTPILOT</span><h1>{current.title}</h1></div>
    </div>
    <div className="topbar-actions">
      <div className="ai-ready"><span className="live-dot" /> <span>AI ready</span></div>
      <button className="header-generate" onClick={() => onTabChange('generate')}><span>✦</span> New post</button>
      <div className="avatar">PP</div>
    </div>
  </header>;
}
