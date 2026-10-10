import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { checkFood, slugify, type Food } from "../../data/foods";

// Appends a place to app/data/foods.json. The file is part of the source, so
// this only works while running `npm run dev`; commit the change to publish it.
// In production there is no writable source tree (and no auth), so it refuses.
const FILE = path.join(process.cwd(), "app/data/foods.json");

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Chỉ thêm được khi chạy local (npm run dev), sau đó commit foods.json để deploy." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không phải JSON" }, { status: 400 });
  }
  const checked = checkFood((body ?? {}) as Record<string, unknown>);
  if (typeof checked === "string") return NextResponse.json({ error: checked }, { status: 400 });

  const foods: Food[] = JSON.parse(await readFile(FILE, "utf8"));
  const base = slugify(checked.name);
  let id = base;
  for (let n = 2; foods.some((f) => f.id === id); n++) id = `${base}-${n}`;

  const food: Food = { id, ...checked };
  foods.unshift(food);
  await writeFile(FILE, `${JSON.stringify(foods, null, 2)}\n`, "utf8");
  return NextResponse.json({ food }, { status: 201 });
}
