// Projects are edited in projects.json and their categories in
// categories.json. This file only types and checks that data, so a typo there
// fails the build with a clear message instead of rendering a broken card.
import { ICON_NAMES, isIconName, type IconName } from "../ui";
import rawCategories from "./categories.json";
import raw from "./projects.json";

export type ProjectCategory = string;

export type Category = {
  id: string;
  /** Shown on filter segments and card tags. */
  label: string;
  /** Hex colour for covers, tags and the detail sheet; white text sits on it. */
  color: string;
  /** One of the icon names exported by app/ui.tsx (e.g. "database", "bot"). */
  icon: IconName;
};

/** WCAG contrast of a #rrggbb colour against white. */
function contrastWithWhite(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

/** Validates one entry of a category-style file (categories.json, topics.json). */
export function checkCategory(
  c: { id: string; label: string; color: string; icon: string },
  i: number,
  file = "categories.json",
): Category {
  const where = `${file}[${i}] (${c.id ?? "no id"})`;
  if (!c.id || !c.label) throw new Error(`${where}: "id" and "label" are required`);
  if (!/^#[0-9a-fA-F]{6}$/.test(c.color)) throw new Error(`${where}: "color" must be a hex like #0e7490`);
  // Card covers put white text on this colour; keep it readable (WCAG AA).
  const ratio = contrastWithWhite(c.color);
  if (ratio < 4.5) {
    throw new Error(`${where}: "color" ${c.color} is too light for white text (${ratio.toFixed(2)}:1, needs 4.5:1) — pick a darker shade`);
  }
  if (!isIconName(c.icon)) throw new Error(`${where}: "icon" must be one of ${ICON_NAMES.join(", ")}`);
  return c as Category;
}

export const CATEGORIES: Category[] = rawCategories.map((c, i) => checkCategory(c, i));
export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export type Project = {
  id: string;
  name: string;
  tagline: string;
  company: string;
  role: string;
  /** Free text, e.g. "Oct 2024 – Present"; empty to hide. */
  period: string;
  /** Drives the per-year count in the header. */
  year: number;
  category: ProjectCategory;
  metrics: { value: string; label: string }[];
  /** Heading over the highlights, e.g. "What I built" or "What it does". */
  highlightsLabel: string;
  highlights: string[];
  stack: string[];
  /** Live product link; empty for none. */
  url: string;
  /** Any image URL — absolute (https://…) or a path under /public. Empty shows a generated cover. */
  thumbnail: string;
};

function check(p: Project, i: number): Project {
  const where = `projects.json[${i}] (${p.id ?? "no id"})`;
  for (const key of ["id", "name", "tagline", "company", "category"] as const) {
    if (!p[key]) throw new Error(`${where}: "${key}" is required`);
  }
  if (!CATEGORY_BY_ID[p.category]) {
    throw new Error(`${where}: category "${p.category}" must be an id from categories.json: ${CATEGORIES.map((c) => c.id).join(", ")}`);
  }
  if (!Number.isInteger(p.year)) throw new Error(`${where}: "year" must be a number like 2025`);
  return p;
}

export const PROJECTS: Project[] = (raw as Project[]).map(check);

// Cards open their detail by id, so two projects sharing one would open the same sheet.
const seen = new Set<string>();
for (const p of PROJECTS) {
  if (seen.has(p.id)) throw new Error(`projects.json: id "${p.id}" is used more than once — every project needs a unique id`);
  seen.add(p.id);
}
