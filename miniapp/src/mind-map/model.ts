// Copy of the website's app/mind-map/model.ts. Change it there first.
// Mind map data shapes, shared by the page, the API route and the mini app.

export type Child = {
  id: string;
  title: string;
  /** Note body as HTML from the editor: left column… */
  note: string;
  /** …and right column (absent in notes saved before columns existed). */
  note2?: string;
  updatedAt: number;
};

/** Sub-branches keyed by big-branch id. */
export type MapData = Record<string, Child[]>;

/** Where the copy on screen stands against the server copy. */
export type SyncState =
  | "local" // not connected: this device only
  | "syncing"
  | "synced"
  | "offline" // server unreachable; showing the last copy
  | "denied"; // wrong password / key

const child = (id: string, title: string): Child => ({ id, title, note: "", updatedAt: 0 });

export const SEED: MapData = {
  ielts: [
    child("ielts-writing", "Writing"),
    child("ielts-speaking", "Speaking"),
    child("ielts-reading", "Reading"),
    child("ielts-listening", "Listening"),
  ],
};

const isChild = (c: unknown): c is Child => {
  const v = c as Child;
  return (
    !!v &&
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.note === "string" &&
    (v.note2 === undefined || typeof v.note2 === "string") &&
    typeof v.updatedAt === "number"
  );
};

export const isMapData = (v: unknown): v is MapData =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.values(v).every((list) => Array.isArray(list) && list.every(isChild));

export const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
