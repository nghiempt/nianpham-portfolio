import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isMapData } from "../../mind-map/model";

// The mind map, stored as one JSON value in Upstash Redis (connected through
// Vercel → Storage, which adds the KV_REST_API_* variables).
//   GET  → { data, updatedAt }   needs MIND_MAP_READ_KEY or MIND_MAP_PASSWORD
//   PUT  ← { data }              needs MIND_MAP_PASSWORD
// Tokens go in "Authorization: Bearer …". CORS is open so the Zalo mini app
// can read it; nothing is readable without a key.
export const dynamic = "force-dynamic";

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "mind-map:v1";
const MAX_BYTES = 900_000; // well under Upstash's 1 MB request limit

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

const same = (a: string, b: string | undefined) => {
  if (!b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

function access(req: Request): "write" | "read" | null {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return null;
  if (same(token, process.env.MIND_MAP_PASSWORD)) return "write";
  if (same(token, process.env.MIND_MAP_READ_KEY)) return "read";
  return null;
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

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const missing = notConfigured();
  if (missing) return missing;
  if (!access(req)) return json({ error: "Unauthorized" }, 401);
  try {
    const raw = await redis(["GET", KEY]);
    return json(typeof raw === "string" ? JSON.parse(raw) : { data: null, updatedAt: 0 });
  } catch {
    return json({ error: "Không đọc được dữ liệu" }, 502);
  }
}

export async function PUT(req: Request) {
  const missing = notConfigured();
  if (missing) return missing;
  if (access(req) !== "write") return json({ error: "Unauthorized" }, 401);

  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: "Dữ liệu quá lớn" }, 413);
  let body: { data?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Không phải JSON" }, 400);
  }
  if (!isMapData(body.data)) return json({ error: "Sai định dạng mind map" }, 400);

  const value = { data: body.data, updatedAt: Date.now() };
  try {
    await redis(["SET", KEY, JSON.stringify(value)]);
  } catch {
    return json({ error: "Không lưu được dữ liệu" }, 502);
  }
  return json({ updatedAt: value.updatedAt });
}
