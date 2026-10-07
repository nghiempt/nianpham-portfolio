// The tech stack is edited in stack.json: groups in display order, each with
// tools as { "name": ..., "detail"?: ... }. This file only types and checks
// that data, so a typo there fails the build with a clear message.
import raw from "./stack.json";

export type Tool = {
  name: string;
  /** Optional second line under the name, e.g. versions or sub-tools. */
  detail?: string;
};

export type StackGroup = {
  id: string;
  label: string;
  blurb: string;
  /** Hex colour for the group's monogram tiles; white text sits on it. */
  color: string;
  tools: Tool[];
};

function check(g: StackGroup, i: number): StackGroup {
  const where = `stack.json[${i}] (${g.id ?? "no id"})`;
  if (!g.id || !g.label) throw new Error(`${where}: "id" and "label" are required`);
  if (!/^#[0-9a-fA-F]{6}$/.test(g.color)) throw new Error(`${where}: "color" must be a hex like #1d4ed8`);
  if (!Array.isArray(g.tools) || g.tools.length === 0) throw new Error(`${where}: "tools" must be a non-empty list`);
  return g;
}

export const STACK: StackGroup[] = (raw as StackGroup[]).map(check);

// One tile per tool across the whole page.
const seen = new Map<string, string>();
for (const g of STACK) {
  for (const t of g.tools) {
    const key = t.name.toLowerCase();
    if (seen.has(key)) throw new Error(`stack.json: "${t.name}" appears in both "${seen.get(key)}" and "${g.id}"`);
    seen.set(key, g.id);
  }
}
