// LocalStorage-based store — Vite SPA, no backend needed

const STORAGE_KEY = 'twitter-ai-agent';

export interface Post {
  id: number;
  content: string;
  topic: string;
  status: 'draft' | 'posted' | 'failed';
  emoji_count: number;
  posted_at: string | null;
  tweet_id: string | null;
  created_at: string;
}

export interface Schedule {
  id: number;
  time_slot: string;
  topic: string;
  active: boolean;
  created_at: string;
}

export interface ApiKey {
  provider: string;
  api_key: string;
  model: string;
  is_active: boolean;
}

interface StoreData {
  posts: Post[];
  schedules: Schedule[];
  apiKeys: ApiKey[];
  settings: Record<string, string>;
  nextId: number;
  nextScheduleId: number;
}

function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    posts: [],
    schedules: [
      { id: 1, time_slot: '08:00', topic: 'general', active: true, created_at: new Date().toISOString() },
      { id: 2, time_slot: '17:00', topic: 'general', active: true, created_at: new Date().toISOString() },
    ],
    apiKeys: [],
    settings: {
      content_style: 'kasual & informatif',
      content_language: 'id',
      emoji_enabled: 'true',
      max_words: '200',
    },
    nextId: 0,
    nextScheduleId: 2,
  };
}

function saveStore(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPosts(): Post[] {
  const store = loadStore();
  return [...store.posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function insertPost(post: Omit<Post, 'id' | 'status' | 'posted_at' | 'tweet_id' | 'created_at'>): Post {
  const store = loadStore();
  const newPost: Post = {
    ...post,
    id: ++store.nextId,
    status: 'draft',
    posted_at: null,
    tweet_id: null,
    created_at: new Date().toISOString(),
  };
  store.posts.push(newPost);
  saveStore(store);
  return newPost;
}

export function updatePost(id: number, update: Partial<Pick<Post, 'status' | 'tweet_id' | 'posted_at'>>) {
  const store = loadStore();
  const post = store.posts.find(p => p.id === id);
  if (post) Object.assign(post, update, { posted_at: new Date().toISOString() });
  saveStore(store);
}

export function getSchedules(): Schedule[] {
  return [...loadStore().schedules].sort((a, b) => a.time_slot.localeCompare(b.time_slot));
}

export function addSchedule(time_slot: string, topic: string): Schedule {
  const store = loadStore();
  const s: Schedule = { id: ++store.nextScheduleId, time_slot, topic, active: true, created_at: new Date().toISOString() };
  store.schedules.push(s);
  saveStore(store);
  return s;
}

export function toggleSchedule(id: number, active: boolean) {
  const store = loadStore();
  const s = store.schedules.find(s => s.id === id);
  if (s) s.active = active;
  saveStore(store);
}

export function deleteSchedule(id: number) {
  const store = loadStore();
  store.schedules = store.schedules.filter(s => s.id !== id);
  saveStore(store);
}

export function getSetting(key: string): string | undefined {
  return loadStore().settings[key];
}

export function updateSetting(key: string, value: string) {
  const store = loadStore();
  store.settings[key] = value;
  saveStore(store);
}

export function getAllApiKeys(): ApiKey[] {
  return loadStore().apiKeys;
}

export function saveApiKey(key: ApiKey) {
  const store = loadStore();
  if (key.is_active) store.apiKeys.forEach(k => k.is_active = false);
  const idx = store.apiKeys.findIndex(k => k.provider === key.provider);
  if (idx >= 0) store.apiKeys[idx] = key;
  else store.apiKeys.push(key);
  saveStore(store);
}

export function deleteApiKey(provider: string) {
  const store = loadStore();
  store.apiKeys = store.apiKeys.filter(k => k.provider !== provider);
  saveStore(store);
}

export function getActiveApiKey(): ApiKey | null {
  return loadStore().apiKeys.find(k => k.is_active) || null;
}
