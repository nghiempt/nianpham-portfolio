// Website copy of the mind map store. The server (/api/mind-map, Upstash
// Redis) is the source of truth once you connect with the password; this
// browser keeps a localStorage copy so the page opens instantly and works
// offline. Every edit is saved locally, then pushed to the server.
// The mini app has its own storage.ts with the same exports (read-only).
import { isMapData, SEED, type MapData, type SyncState } from "./model";

export * from "./model";

/** The website can edit; the mini app only views. */
export const READ_ONLY = false;

const KEY = "nianpham:mind-map:v1";
const PASS_KEY = "nianpham:mind-map:password";
const API = "/api/mind-map";

let cache: MapData | null = null;
let sync: SyncState = "local";
let syncedAt = 0;
let pushTimer: number | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const local = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

function setSync(next: SyncState) {
  sync = next;
  if (next === "synced") syncedAt = Date.now();
  notify();
}

export function getMap(): MapData {
  if (cache === null) {
    cache = SEED;
    try {
      const parsed: unknown = JSON.parse(local.get(KEY) ?? "null");
      if (isMapData(parsed)) cache = parsed;
    } catch {}
  }
  return cache;
}

export const getServerMap = () => SEED;
export const getSync = () => sync;
export const getServerSync = (): SyncState => "local";
export const getSyncedAt = () => syncedAt;

export function subscribeMap(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function saveLocal(next: MapData) {
  cache = next;
  local.set(KEY, JSON.stringify(next));
  notify();
}

export function setMap(next: MapData) {
  saveLocal(next);
  if (!local.get(PASS_KEY)) return;
  // Batch quick edits (typing) into one upload.
  window.clearTimeout(pushTimer);
  setSync("syncing");
  pushTimer = window.setTimeout(push, 800);
}

async function push() {
  const pass = local.get(PASS_KEY);
  if (!pass) return setSync("local");
  try {
    const res = await fetch(API, {
      method: "PUT",
      headers: { Authorization: `Bearer ${pass}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: getMap() }),
    });
    setSync(res.ok ? "synced" : res.status === 401 ? "denied" : "offline");
  } catch {
    setSync("offline");
  }
}

/** Pulls the server copy (server wins). An empty server gets this device's copy. */
async function pull() {
  const pass = local.get(PASS_KEY);
  if (!pass) return setSync("local");
  setSync("syncing");
  try {
    const res = await fetch(API, { headers: { Authorization: `Bearer ${pass}` }, cache: "no-store" });
    if (res.status === 401) return setSync("denied");
    if (!res.ok) return setSync("offline");
    const body: { data: unknown } = await res.json();
    if (isMapData(body.data)) {
      saveLocal(body.data);
      setSync("synced");
    } else {
      await push();
    }
  } catch {
    setSync("offline");
  }
}

/** Called once the page is on screen. */
export function startSync() {
  void pull();
}

/** Saves the password on this browser and syncs with it. */
export function connect(password: string) {
  local.set(PASS_KEY, password.trim() || null);
  void pull();
}

export function disconnect() {
  local.set(PASS_KEY, null);
  setSync("local");
}
