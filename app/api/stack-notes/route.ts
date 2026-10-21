import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Daily notes for /update-stack, stored as one JSON value in the same Upstash
// Redis as the mind map and protected by the same MIND_MAP_PASSWORD.
//   GET → { notes, updatedAt }   PUT ← { notes }
export const dynamic = "force-dynamic";

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "update-stack:notes:v1";
const MAX_BYTES = 900_000;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function authorized(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const pass = process.env.MIND_MAP_PASSWORD;
  if (!token || !pass) return false;
  const x = Buffer.from(token);
  const y = Buffer.from(pass);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function redis(command: string[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

function notConfigured() {
  if (!REDIS_URL || !REDIS_TOKEN) return json({ error: "Chưa kết nối Upstash Redis (Vercel → Storage)" }, 503);
  if (!process.env.MIND_MAP_PASSWORD) return json({ error: "Chưa đặt MIND_MAP_PASSWORD" }, 503);
  return null;
}

const isNotes = (v: unknown) =>
  Array.isArray(v) &&
  v.every(
    (n) =>
      n &&
      typeof n === "object" &&
      typeof (n as Record<string, unknown>).id === "string" &&
      typeof (n as Record<string, unknown>).text === "string" &&
      typeof (n as Record<string, unknown>).createdAt === "number",
  );

export async function GET(req: Request) {
  const missing = notConfigured();
  if (missing) return missing;
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);
  try {
    const raw = await redis(["GET", KEY]);
    return json(typeof raw === "string" ? JSON.parse(raw) : { notes: null, updatedAt: 0 });
  } catch {
    return json({ error: "Không đọc được dữ liệu" }, 502);
  }
}

export async function PUT(req: Request) {
  const missing = notConfigured();
  if (missing) return missing;
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: "Dữ liệu quá lớn" }, 413);
  let body: { notes?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Không phải JSON" }, 400);
  }
  if (!isNotes(body.notes)) return json({ error: "Sai định dạng notes" }, 400);

  const value = { notes: body.notes, updatedAt: Date.now() };
  try {
    await redis(["SET", KEY, JSON.stringify(value)]);
  } catch {
    return json({ error: "Không lưu được dữ liệu" }, 502);
  }
  return json({ updatedAt: value.updatedAt });
}
