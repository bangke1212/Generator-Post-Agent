import { useState } from 'react';
import { generateIdeas, GeneratedIdea } from '../gemini';
import { insertPost } from '../store';

interface Props { onTabChange: (tab: string) => void; }

const TONES = [
  { key: 'supportif', icon: '🤝', label: 'Supportif', desc: 'Positif & membangun' },
  { key: 'debate', icon: '⚡', label: 'Debate', desc: 'Provokatif intelektual' },
  { key: 'kritik-pedas', icon: '🔥', label: 'Kritik Pedas', desc: 'Tajam & blak-blakan' },
];
const LANGS = [
  { key: 'id', icon: '🇮🇩', label: 'ID' },
  { key: 'en', icon: '🇬🇧', label: 'EN' },
];

export default function Ideas({ onTabChange }: Props) {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState('supportif');
  const [lang, setLang] = useState('id');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [posting, setPosting] = useState<number | null>(null);
  const [postedIds, setPostedIds] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setError('');
    setIdeas([]);
    setSelected(new Set());
    setPostedIds(new Set());
    try {
      const result = await generateIdeas({ idea: idea.trim(), language: lang, tone, count });
      if (result.ideas.length === 0) setError('Gagal generate ide. Cek API key.');
      setIdeas(result.ideas);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handlePost = async (item: GeneratedIdea) => {
    setPosting(item.id);
    try {
      const post = insertPost({ content: item.content, topic: idea.trim(), emoji_count: item.emoji_count });
      // Mark as posted (simulation)
      const { insertPost } = await import('../store');
      postedIds.add(item.id);
      setPostedIds(new Set(postedIds));
    } catch (e: any) {
      alert('Gagal: ' + e.message);
    } finally { setPosting(null); }
  };

  const handlePostSelected = async () => {
    const sel = ideas.filter(i => selected.has(i.id) && !postedIds.has(i.id));
    for (const item of sel) {
      setPosting(item.id);
      insertPost({ content: item.content, topic: idea.trim(), emoji_count: item.emoji_count });
      postedIds.add(item.id);
      setPostedIds(new Set(postedIds));
      await new Promise(r => setTimeout(r, 500));
      setPosting(null);
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">💡</span> Kolom Ide</h2>
          <p className="text-sm text-[#666680] mt-1">Generate hingga 10 ide posting dari satu topik</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onTabChange('generate')} className="btn-ghost text-sm">🤖 Single</button>
          <button onClick={() => onTabChange('dashboard')} className="btn-ghost text-sm">← Dashboard</button>
        </div>
      </div>

      <div className="card-glow space-y-5">
        {/* Idea Input */}
        <div>
          <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">💭 Ide / Topik</label>
          <div className="relative">
            <input type="text" value={idea} onChange={e => setIdea(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Contoh: quantum computing, AI ethics, remote work..."
              className="input text-base py-4 pl-4 pr-12" />
            <button onClick={handleGenerate} disabled={loading || !idea.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center text-lg text-white transition-all hover:scale-105 disabled:opacity-30 shadow-lg shadow-[#6366f1]/20">
              {loading ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : '→'}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">🎭 Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <button key={t.key} onClick={() => setTone(t.key)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${tone === t.key ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-[#1e1e4a] hover:border-[#2e2e5e]'}`}>
                  <span className="text-lg block mb-0.5">{t.icon}</span>
                  <span className="text-[10px] font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 flex-1">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">🌐 Bahasa</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGS.map(l => (
                  <button key={l.key} onClick={() => setLang(l.key)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${lang === l.key ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-[#1e1e4a]'}`}>
                    <span className="text-base block mb-0.5">{l.icon}</span>
                    <span className="text-[10px] font-medium">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="w-24">
              <label className="text-[11px] font-semibold text-[#9494b8] uppercase tracking-wider mb-2.5 block">🔢 Jumlah</label>
              <select value={count} onChange={e => setCount(+e.target.value)} className="input text-center">
                {[3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="card-glow space-y-4 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="space-y-2"><div className="h-4 rounded-lg bg-[#ffffff05] w-full"></div><div className="h-4 rounded-lg bg-[#ffffff05] w-5/6"></div></div>)}</div>}

      {error && <div className="card border-[#ef4444]/30 bg-[#ef4444]/5 animate-scale-in"><div className="flex items-start gap-3"><span className="text-2xl">⚠️</span><div><p className="text-sm font-semibold text-[#f87171]">Error</p><p className="text-sm text-[#f87171]/70 mt-1">{error}</p></div></div></div>}

      {ideas.length > 0 && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">💡 {ideas.length} ide untuk "{idea}"</h3>
              <span className="badge badge-info text-[10px]">{TONES.find(t => t.key === tone)?.icon} {tone}</span>
              <span className="badge badge-accent text-[10px]">{lang === 'id' ? '🇮🇩' : '🇬🇧'} {lang === 'id' ? 'ID' : 'EN'}</span>
            </div>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <span className="text-xs text-[#666680] self-center">{selected.size} dipilih</span>
                <button onClick={handlePostSelected} className="btn-accent text-xs py-1.5 px-3">🐦 Post {selected.size} tweet</button>
              </div>
            )}
          </div>

          {ideas.map((item, i) => (
            <div key={item.id} className={`card transition-all animate-fade-in-up ${selected.has(item.id) ? 'border-[#6366f1]/40 bg-[#6366f1]/5' : ''} ${postedIds.has(item.id) ? 'border-[#10b981]/30 bg-[#10b981]/3' : ''}`} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-xs font-bold text-[#818cf8]">{item.id}</span>
                  <span className="text-xs text-[#666680]">🎨 {item.emoji_count} emoji</span>
                  {postedIds.has(item.id) && <span className="badge badge-success text-[10px]">✅ Posted</span>}
                </div>
                <div className="flex items-center gap-1">
                  {!postedIds.has(item.id) && (
                    <button onClick={() => toggleSelect(item.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${selected.has(item.id) ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-[#ffffff05] text-[#666680]'}`}>
                      {selected.has(item.id) ? '✓' : '○'}
                    </button>
                  )}
                  <button onClick={() => handleCopy(item.content, item.id)} className="w-8 h-8 rounded-lg bg-[#ffffff05] flex items-center justify-center text-sm text-[#666680] hover:text-white" title="Copy">
                    {copiedId === item.id ? '✅' : '📋'}
                  </button>
                  {!postedIds.has(item.id) && (
                    <button onClick={() => handlePost(item)} disabled={posting === item.id} className="w-8 h-8 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center text-sm text-[#06b6d4] hover:bg-[#06b6d4]/20">
                      {posting === item.id ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : '🐦'}
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-[#0d0d25] rounded-xl p-4 border border-[#1e1e4a]">
                <p className="text-sm leading-[1.8] whitespace-pre-wrap text-[#d4d4e8]">{item.content.length > 250 ? item.content.slice(0, 250) + '...' : item.content}</p>
              </div>
              <div className="mt-2 text-[10px] text-[#666680]">~{item.content.split(/\s+/).length} kata</div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && ideas.length === 0 && (
        <div className="card-glow text-center py-12 space-y-4 animate-fade-in">
          <div className="text-5xl animate-float">💡</div>
          <div><p className="text-[#9494b8] font-semibold text-base">Tulis ide kamu di atas</p><p className="text-xs text-[#666680] mt-2 max-w-sm mx-auto">AI akan generate hingga 10 variasi postingan natural</p></div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['quantum computing', 'AI etika', 'remote work', 'crypto regulation', 'mental health'].map(s => (
              <button key={s} onClick={() => setIdea(s)} className="chip text-xs">{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
