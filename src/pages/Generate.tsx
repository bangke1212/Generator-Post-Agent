import { useState } from 'react';
import { generateContent } from '../gemini';
import { insertPost } from '../store';

interface Props { onTabChange: (tab: string) => void; }

const topics = ['general', 'teknologi', 'bisnis', 'motivasi', 'crypto', 'AI', 'produktivitas', 'startup', 'lifehack'];

export default function Generate({ onTabChange }: Props) {
  const [topic, setTopic] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ content: string; emoji_count: number; topic: string; provider?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await generateContent({ topic });
      if (data.content.startsWith('⚠️') || data.content.startsWith('❌')) setError(data.content);
      else setResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSave = () => {
    if (!result) return;
    insertPost({ content: result.content, topic: result.topic, emoji_count: result.emoji_count });
    setResult(null);
    onTabChange('dashboard');
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">🤖</span> Generate Single</h2></div>
        <div className="flex gap-2">
          <button onClick={() => onTabChange('ideas')} className="btn-ghost text-sm">💡 Ideas Mode</button>
          <button onClick={() => onTabChange('dashboard')} className="btn-ghost text-sm">← Dashboard</button>
        </div>
      </div>

      <div className="card-glow space-y-4">
        <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider block">🎯 Topik</label>
        <div className="flex flex-wrap gap-2">
          {topics.map(t => (
            <button key={t} onClick={() => setTopic(t)}
              className={`chip ${topic === t ? 'active' : ''}`}>{t}</button>
          ))}
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full text-base py-4">
        {loading ? <span className="flex items-center gap-3"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generating...</span> : <span className="flex items-center gap-3"><span className="text-xl">✨</span> Generate Konten AI</span>}
      </button>

      {error && <div className="card border-[#ef4444]/30 bg-[#ef4444]/5 animate-scale-in"><div className="flex items-start gap-3"><span className="text-2xl">⚠️</span><p className="text-sm text-[#f87171]">{error}</p></div></div>}

      {result && (
        <div className="card-glow space-y-4 animate-scale-in">
          <div className="flex items-center gap-2">
            <span className="badge badge-info text-[10px]">{result.topic}</span>
            {result.provider && <span className="text-[10px] text-[#666680]">via {result.provider}</span>}
            <span className="ml-auto text-xs text-[#666680]">~{result.content.split(/\s+/).length} kata</span>
          </div>
          <div className="bg-[#0d0d25] rounded-2xl p-5 border border-[#1e1e4a] relative group">
            <p className="text-sm leading-[1.8] whitespace-pre-wrap text-[#d4d4e8]">{result.content}</p>
            <button onClick={handleCopy} className="absolute top-3 right-3 btn-ghost text-xs opacity-0 group-hover:opacity-100">{copied ? '✅' : '📋'}</button>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-accent flex-1"><span className="text-lg mr-1">💾</span> Simpan ke History</button>
            <button onClick={handleGenerate} className="btn-outline flex-1">🔄 Generate Ulang</button>
          </div>
        </div>
      )}

      {!loading && !result && !error && (
        <div className="card text-center py-10 space-y-3 animate-fade-in">
          <div className="text-5xl animate-float">✨</div>
          <p className="text-[#9494b8] font-medium">Pilih topik dan klik Generate</p>
        </div>
      )}
    </div>
  );
}
