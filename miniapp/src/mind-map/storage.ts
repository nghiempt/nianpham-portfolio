// Mini app copy of the mind map store: read-only. It pulls the mind map from
// the website's API (edited on the web) and keeps the last copy in Zalo's
// nativeStorage, so it opens instantly and still shows notes offline.
// Same exports as the website's app/mind-map/storage.ts.
import { nativeStorage } from "zmp-sdk/apis";
import { isMapData, SEED, type MapData, type SyncState } from "./model";

export * from "./model";

export const READ_ONLY = true;

const KEY = "nianpham:mind-map:v1";
const API = "https://www.nghiemthanhpham.com/api/mind-map";
// Set in miniapp/.env.local; must match MIND_MAP_READ_KEY on Vercel.
const READ_KEY: string = import.meta.env.VITE_MIND_MAP_READ_KEY ?? "";

let cache: MapData | null = null;
let sync: SyncState = "local";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

function read(key: string): string | null {
  try {
    return nativeStorage.getItem(key) || null;
  } catch {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

function write(key: string, value: string) {
  try {
    nativeStorage.setItem(key, value);
  } catch {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }
}

function setSync(next: SyncState) {
  sync = next;
  notify();
}

export function getMap(): MapData {
  if (cache === null) {
    cache = SEED;
    try {
      const parsed: unknown = JSON.parse(read(KEY) ?? "null");
      if (isMapData(parsed)) cache = parsed;
    } catch {}
  }
  return cache;
}

export const getServerMap = () => SEED;
export const getSync = () => sync;
export const getServerSync = (): SyncState => "local";

export function subscribeMap(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Read-only: never called by the UI, kept for the shared interface. */
export function setMap(next: MapData) {
  cache = next;
  notify();
}

export function startSync() {
  if (!READ_KEY) return setSync("denied");
  setSync("syncing");
  fetch(API, { headers: { Authorization: `Bearer ${READ_KEY}` }, cache: "no-store" })
    .then(async (res) => {
      if (res.status === 401) return setSync("denied");
      if (!res.ok) return setSync("offline");
      const body: { data: unknown } = await res.json();
      if (isMapData(body.data)) {
        cache = body.data;
        write(KEY, JSON.stringify(body.data));
      }
      setSync("synced");
    })
    .catch(() => setSync("offline"));
}

export function connect(_password: string) {}
export function disconnect() {}
