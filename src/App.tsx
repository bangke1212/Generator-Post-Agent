import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Ideas from './pages/Ideas';
import Generate from './pages/Generate';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('ideas');
  const navigate = useNavigate();

  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/${tab === 'ideas' ? '' : tab}`);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed pointer-events-none inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#6366f1]/8 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#06b6d4]/6 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Header activeTab={activeTab} onTabChange={onTabChange} />

      <main className="max-w-5xl mx-auto px-5 py-8 space-y-8 relative z-10">
        <Routes>
          <Route path="/" element={<Ideas onTabChange={onTabChange} />} />
          <Route path="/ideas" element={<Ideas onTabChange={onTabChange} />} />
          <Route path="/generate" element={<Generate onTabChange={onTabChange} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <footer className="relative z-10 border-t border-[#1e1e4a]/50 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <p className="text-xs text-[#666680]">
            🤖 <span className="gradient-text font-semibold">Twitter AI Agent</span>
            <span className="mx-2">·</span>
            Vite + React SPA
            <span className="mx-2">·</span>
            Built with ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}
