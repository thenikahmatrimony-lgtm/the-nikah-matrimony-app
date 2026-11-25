import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yexmnedkkkfdtatyolhz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vagZGzP3RKbbo7Mbm8owmQ_-n_WV2Xk';
const BUCKET = 'profile-photos';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
const LOGIN_EMAIL = 'thenikahmatrimony@gmail.com';
let realtimeChannel = null;
let syncing = false;

const localRecords = () => JSON.parse(localStorage.getItem('tnm_records') || '[]');
const deletedIds = () => JSON.parse(localStorage.getItem('tnm_deleted_ids') || '[]');
const saveDeletedIds = ids => localStorage.setItem('tnm_deleted_ids', JSON.stringify([...new Set(ids)]));
const profileKey = r => String(r.shortId || r.id);
const dataUrlParts = value => {
  const match = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(value || '');
  if (!match) throw new Error('A saved profile photo has an unsupported format.');
  const ext = match[1].includes('png') ? 'png' : match[1].includes('webp') ? 'webp' : 'jpg';
  return { contentType: match[1], base64: match[2], ext };
};

async function uploadPhoto(profileId, photo, index) {
  if (!String(photo).startsWith('data:image/')) return photo;
  const { contentType, base64, ext } = dataUrlParts(photo);
  const path = profileId + '/' + index + '.' + ext;
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType, upsert: true, cacheControl: '3600'
  });
  if (error) throw error;
  const { data, error: urlError } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
  if (urlError) throw urlError;
  return { __tnmStoragePath: path, signedUrl: data.signedUrl };
}

async function hydratePhoto(photo) {
  if (!photo || typeof photo !== 'object' || !photo.__tnmStoragePath) return photo;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(photo.__tnmStoragePath, 60 * 60 * 24 * 30);
  if (error) throw error;
  return photo.__tnmStoragePath;
}
async function dataForCloud(record) {
  const photos = [];
  for (let i = 0; i < (record.photos || []).length; i++) photos.push(await uploadPhoto(profileKey(record), record.photos[i], i));
  return { ...record, photos };
}
async function dataForDevice(record) {
  const photos = [];
  for (const photo of record.photos || []) {
    if (photo && typeof photo === 'object' && photo.__tnmStoragePath) {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(photo.__tnmStoragePath, 60 * 60 * 24 * 30);
      if (error) throw error;
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error('Could not download a saved profile photo.');
      const blob = await response.blob();
      photos.push(await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
      }));
    } else photos.push(photo);
  }
  return { ...record, photos };
}

export async function ready() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
export async function login(loginId, password) {
  if (String(loginId).trim().toLowerCase() !== 'thenikahmatrimony') throw new Error('Login ID is incorrect.');
  if (!password) throw new Error('Please enter your password.');
  const { data, error } = await supabase.auth.signInWithPassword({ email: LOGIN_EMAIL, password });
  if (error) throw new Error(error.message);
  return data;
}
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
export async function syncNow() {
  if (syncing) return;
  syncing = true;
  try {
    const session = await getSession();
    if (!session) throw new Error('Please login first.');
    const local = localRecords();
    const deleted = deletedIds();
    const [{ data: remoteRows, error: fetchError }, { data: tombstoneRows, error: tombstoneError }] = await Promise.all([
      supabase.from('tnm_profiles').select('profile_id,data,updated_at'),
      supabase.from('tnm_deleted_profiles').select('profile_id,deleted_at')
    ]);
    if (fetchError) throw fetchError;
    if (tombstoneError) throw tombstoneError;
    const remoteMap = new Map((remoteRows || []).map(row => [row.profile_id, row]));
    const tombstoneMap = new Map((tombstoneRows || []).map(row => [row.profile_id, row]));
    const localMap = new Map(local.map(record => [profileKey(record), record]));
    const merged = new Map();

    for (const [id, record] of localMap) {
      if (tombstoneMap.has(id)) continue;
      const remote = remoteMap.get(id);
      const localTime = Number(record.updatedAt || 0);
      const remoteTime = remote ? Number(remote.data?.updatedAt || new Date(remote.updated_at).getTime() || 0) : 0;
      if (!remote || localTime >= remoteTime) {
        const prepared = await dataForCloud(record);
        const { error } = await supabase.from('tnm_profiles').upsert({
          profile_id: id, data: prepared, updated_at: new Date(Math.max(Date.now(), localTime)).toISOString()
        }, { onConflict: 'profile_id' });
        if (error) throw error;
        merged.set(id, record);
      } else {
        merged.set(id, await dataForDevice(remote.data));
      }
    }
    for (const [id, remote] of remoteMap) {
      if (!localMap.has(id)) merged.set(id, await dataForDevice(remote.data));
    }
    for (const id of deleted) {
      const { error: tombstoneWriteError } = await supabase.from('tnm_deleted_profiles').upsert({ profile_id: id }, { onConflict: 'profile_id' });
      if (tombstoneWriteError) throw tombstoneWriteError;
      const { error } = await supabase.from('tnm_profiles').delete().eq('profile_id', id);
      if (error) throw error;
      tombstoneMap.set(id, { profile_id: id });
      merged.delete(id);
    }
    for (const id of tombstoneMap.keys()) merged.delete(id);
    saveDeletedIds([]);
    const output = [...merged.values()];
    if (window.TNMApplyCloudRecords) window.TNMApplyCloudRecords(output);
    else localStorage.setItem('tnm_records', JSON.stringify(output));
    return output.length;
  } finally {
    syncing = false;
  }
}
export function startRealtime() {
  if (realtimeChannel) return;
  realtimeChannel = supabase.channel('tnm-profile-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tnm_profiles' }, async () => {
      if (document.visibilityState === 'visible' && (await getSession()) && !syncing) {
        try { await syncNow(); } catch (error) { console.warn('TNM background sync:', error.message); }
      }
    }).subscribe();
}
window.TNMSupabase = { ready, getSession, login, logout, syncNow, startRealtime };
