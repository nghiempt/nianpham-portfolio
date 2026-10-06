// Papers are edited in publications.json and their topics in topics.json.
// This file only types and checks that data, so a typo there fails the build
// with a clear message instead of rendering a broken card.
import { checkCategory, type Category } from "./projects";
import raw from "./publications.json";
import rawTopics from "./topics.json";

export type Rank = "A*" | "A" | "B" | "C" | "Q1";
export type Topic = string;
export type Kind = "Conference" | "Journal" | "Under review" | "In preparation";

const RANKS: string[] = ["A*", "A", "B", "C", "Q1"];
const KINDS: string[] = ["Conference", "Journal", "Under review", "In preparation"];

export type Publication = {
  id: string;
  title: string;
  /** Short venue label, e.g. "EMNLP 2025"; empty for drafts. */
  venue: string;
  /** Full proceedings / journal name; empty to hide. */
  venueFull: string;
  year: number;
  /** One of A*, A, B, C, Q1 — or empty for none. */
  rank: Rank | "";
  /** An id from topics.json. */
  topic: Topic;
  kind: Kind;
  firstAuthor: boolean;
  authors: string[];
  /** DOI without the https://doi.org/ prefix; the card links there. Empty = not clickable. */
  doi: string;
};

export const TOPICS: Category[] = rawTopics.map((t, i) => checkCategory(t, i, "topics.json"));
export const TOPIC_BY_ID: Record<string, Category> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

/** Counted in the stats; drafts and submissions are listed but not counted. */
export const isPublished = (p: Publication) => p.kind === "Conference" || p.kind === "Journal";

function check(p: Publication, i: number): Publication {
  const where = `publications.json[${i}] (${p.id ?? "no id"})`;
  for (const key of ["id", "title", "topic", "kind"] as const) {
    if (!p[key]) throw new Error(`${where}: "${key}" is required`);
  }
  if (!TOPIC_BY_ID[p.topic]) {
    throw new Error(`${where}: topic "${p.topic}" must be an id from topics.json: ${TOPICS.map((t) => t.id).join(", ")}`);
  }
  if (!KINDS.includes(p.kind)) throw new Error(`${where}: "kind" must be one of ${KINDS.join(", ")}`);
  if (p.rank && !RANKS.includes(p.rank)) throw new Error(`${where}: "rank" must be one of ${RANKS.join(", ")} or ""`);
  if (!Number.isInteger(p.year)) throw new Error(`${where}: "year" must be a number like 2025`);
  if (p.doi && /^https?:/i.test(p.doi)) {
    throw new Error(`${where}: "doi" should be the bare DOI (e.g. 10.1007/…), without https://doi.org/`);
  }
  return p;
}

export const PUBLICATIONS: Publication[] = (raw as Publication[]).map(check);

const seen = new Set<string>();
for (const p of PUBLICATIONS) {
  if (seen.has(p.id)) throw new Error(`publications.json: id "${p.id}" is used more than once — every paper needs a unique id`);
  seen.add(p.id);
}
