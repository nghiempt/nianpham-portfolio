// Milestones are edited in achievements.json and their kinds (with colour and
// icon) in achievement-kinds.json. This file only types and checks that data,
// so a typo there fails the build with a clear message.
import rawKinds from "./achievement-kinds.json";
import raw from "./achievements.json";
import { checkCategory, type Category } from "./projects";

export type Achievement = {
  id: string;
  name: string;
  /** Places the item on the timeline. */
  year: number;
  /** An id from achievement-kinds.json. */
  kind: string;
  /** Issuer, place or any short note shown under the name; empty to hide. */
  detail: string;
  /** Organisation logo: a path under /public or any image URL. Empty uses the kind's icon. */
  logo: string;
};

export const ACHIEVEMENT_KINDS: Category[] = rawKinds.map((k, i) => checkCategory(k, i, "achievement-kinds.json"));
export const KIND_BY_ID: Record<string, Category> = Object.fromEntries(ACHIEVEMENT_KINDS.map((k) => [k.id, k]));

function check(a: Achievement, i: number): Achievement {
  const where = `achievements.json[${i}] (${a.id ?? "no id"})`;
  for (const key of ["id", "name", "kind"] as const) {
    if (!a[key]) throw new Error(`${where}: "${key}" is required`);
  }
  if (!KIND_BY_ID[a.kind]) {
    throw new Error(`${where}: kind "${a.kind}" must be an id from achievement-kinds.json: ${ACHIEVEMENT_KINDS.map((k) => k.id).join(", ")}`);
  }
  if (!Number.isInteger(a.year)) throw new Error(`${where}: "year" must be a number like 2025`);
  return a;
}

export const ACHIEVEMENTS: Achievement[] = (raw as Achievement[]).map(check);

const seen = new Set<string>();
for (const a of ACHIEVEMENTS) {
  if (seen.has(a.id)) throw new Error(`achievements.json: id "${a.id}" is used more than once — every item needs a unique id`);
  seen.add(a.id);
}
