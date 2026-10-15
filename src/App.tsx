import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Ideas from './pages/Ideas';
import Generate from './pages/Generate';
import Settings from './pages/Settings';

const navItems = [
  { key: 'ideas', label: 'Idea Studio', caption: 'Multi-variant posts', icon: '✦' },
  { key: 'generate', label: 'Quick Generate', caption: 'One polished post', icon: '↗' },
  { key: 'settings', label: 'AI Providers', caption: 'Keys & models', icon: '⌘' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeTab = location.pathname.includes('settings') ? 'settings' : location.pathname.includes('generate') ? 'generate' : 'ideas';

  const onTabChange = (tab: string) => {
    navigate(tab === 'ideas' ? '/' : `/${tab}`);
    setMobileOpen(false);
  };

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="app-frame">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <aside className={`workspace-rail ${mobileOpen ? 'is-open' : ''}`}>
        <div className="rail-brand">
          <div className="brand-orbit"><span>✦</span></div>
          <div><strong>PostPilot</strong><small>AI CONTENT STUDIO</small></div>
          <button className="rail-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu">×</button>
        </div>

        <div className="rail-status"><span className="live-dot" /><div><strong>AI workspace ready</strong><small>Local session · v4.0</small></div></div>
        <p className="rail-label">WORKSPACE</p>
        <nav className="rail-nav">
          {navItems.map(item => <button key={item.key} onClick={() => onTabChange(item.key)} className={activeTab === item.key ? 'active' : ''}>
            <span className="nav-icon">{item.icon}</span><span><b>{item.label}</b><small>{item.caption}</small></span>{activeTab === item.key && <i>•</i>}
          </button>)}
        </nav>

        <div className="rail-tip"><span>✧</span><div><strong>Write with intent</strong><small>Start with a clear idea. Let the model find the hook.</small></div></div>
        <div className="rail-footer"><span>© 2026 PostPilot</span><span className="secure-mark">● encrypted local store</span></div>
      </aside>
      {mobileOpen && <button className="drawer-scrim" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />}

      <div className="app-main">
        <Header activeTab={activeTab} onTabChange={onTabChange} onMenu={() => setMobileOpen(true)} />
        <main className="content-shell">
          <Routes>
            <Route path="/" element={<Ideas onTabChange={onTabChange} />} />
            <Route path="/ideas" element={<Ideas onTabChange={onTabChange} />} />
            <Route path="/generate" element={<Generate onTabChange={onTabChange} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Ideas onTabChange={onTabChange} />} />
          </Routes>
        </main>
        <footer className="workspace-footer"><span><b>PostPilot</b> · AI content workspace</span><span>Optimized for thoughtful posts, not noise.</span></footer>
      </div>
    </div>
  );
}
