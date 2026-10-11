"use client";

// Smart Insight Space hub: the app logo in the middle, AI clients on one side
// and data sources on the other, joined by flowing dashed lines.
// Plain React + hub.css with no Next.js imports, so this file can be copied
// as-is into the Zalo Mini App (miniapp/); only asset() changes there.
import type { CSSProperties } from "react";
import "./hub.css";

/** URL of a file in public/assets/miniapp, e.g. asset("logo.jpg"). */
const asset = (path: string) => `/assets/miniapp/${path}`;

type Tile = { name: string; icon?: string };

const CLIENTS: Tile[] = [
  { name: "Claude", icon: "claude-icon.svg" },
  { name: "Cursor", icon: "cursor.svg" },
  { name: "VS Code", icon: "visual-studio-code.svg" },
  { name: "ChatGPT", icon: "openai-icon.svg" },
  { name: "Gemini", icon: "gemini.svg" },
  { name: "Và nhiều nữa" },
];

const SOURCES: Tile[] = [
  { name: "Gmail", icon: "gmail.svg" },
  { name: "Slack", icon: "slack-icon.svg" },
  { name: "GitHub", icon: "github-icon.svg" },
  { name: "Linear", icon: "linear-icon.svg" },
  { name: "Notion", icon: "notion-icon.svg" },
  { name: "Jira", icon: "jira.svg" },
  { name: "HubSpot", icon: "hubspot.svg" },
  { name: "Google Calendar", icon: "google-calendar.svg" },
  { name: "Và nhiều nữa" },
];

type Point = { x: number; y: number };
type Scene = {
  w: number;
  h: number;
  tile: number;
  logo: number;
  center: Point;
  clients: Point[];
  sources: Point[];
  /** SVG path data; every line is drawn from the outside towards the logo. */
  lines: string[];
};

const grid = (cols: number[], rows: number[]) => rows.flatMap((y) => cols.map((x) => ({ x, y })));
const curve = (a: Point, b: Point, vertical = false) =>
  vertical
    ? `M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}`
    : `M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`;

// Wide screens: clients | logo | sources, as in the reference.
const WIDE: Scene = (() => {
  const tile = 78;
  const logo = 172;
  const center = { x: 560, y: 220 };
  const clients = grid([80, 182, 284], [168, 272]);
  const sources = grid([836, 938, 1040], [116, 220, 324]);
  const inL = { x: center.x - logo / 2 - 14, y: center.y };
  const inR = { x: center.x + logo / 2 + 14, y: center.y };
  return {
    w: 1120,
    h: 440,
    tile,
    logo,
    center,
    clients,
    sources,
    lines: [
      curve({ x: 284 + tile / 2 + 22, y: 168 }, inL),
      curve({ x: 284 + tile / 2 + 22, y: 272 }, inL),
      ...[116, 220, 324].map((y) => curve({ x: 836 - tile / 2 - 22, y }, inR)),
    ],
  };
})();

// Phones (the Zalo Mini App): clients on top, logo, sources below.
const TALL: Scene = (() => {
  const tile = 78;
  const logo = 160;
  const center = { x: 200, y: 360 };
  const clients = grid([96, 200, 304], [64, 164]);
  const sources = grid([96, 200, 304], [568, 668, 768]);
  const inT = { x: center.x, y: center.y - logo / 2 - 14 };
  const inB = { x: center.x, y: center.y + logo / 2 + 14 };
  return {
    w: 400,
    h: 830,
    tile,
    logo,
    center,
    clients,
    sources,
    lines: [
      curve({ x: 96, y: 164 + tile / 2 + 18 }, inT, true),
      curve({ x: 304, y: 164 + tile / 2 + 18 }, inT, true),
      ...[96, 200, 304].map((x) => curve({ x, y: 568 - tile / 2 - 18 }, inB, true)),
    ],
  };
})();

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function TileView({ tile, at, scene, index }: { tile: Tile; at: Point; scene: Scene; index: number }) {
  const style = {
    left: pct(at.x, scene.w),
    top: pct(at.y, scene.h),
    width: pct(scene.tile, scene.w),
    "--i": index,
  } as CSSProperties;
  return (
    <li className="sis-tile" style={style} title={tile.name}>
      {tile.icon ? (
        <img src={asset(`icons/${tile.icon}`)} alt={tile.name} draggable={false} />
      ) : (
        <span className="sis-more" aria-label={tile.name}>
          <i />
          <i />
          <i />
        </span>
      )}
    </li>
  );
}

function SceneView({ scene, className }: { scene: Scene; className: string }) {
  const rays = Array.from({ length: 13 }, (_, k) => k);
  return (
    <div className={`sis-scene ${className}`} style={{ aspectRatio: `${scene.w} / ${scene.h}` }}>
      <svg className="sis-lines" viewBox={`0 0 ${scene.w} ${scene.h}`} aria-hidden="true">
        {/* Faint rays fanning out from below the logo */}
        <g className="sis-rays">
          {rays.map((k) => {
            // Skip 0 and π: flat rays read as a stray horizon line.
            const a = Math.PI * ((k + 1) / (rays.length + 1));
            const r = Math.max(scene.w, scene.h) * 1.4;
            const ox = scene.w / 2;
            const oy = scene.h;
            return <line key={k} x1={ox} y1={oy} x2={ox - Math.cos(a) * r} y2={oy - Math.sin(a) * r} />;
          })}
        </g>
        {scene.lines.map((d, k) => (
          <path key={k} className="sis-flow" d={d} style={{ animationDelay: `${k * -0.35}s` }} />
        ))}
      </svg>

      <ul className="sis-group">
        {scene.clients.map((at, k) => (
          <TileView key={CLIENTS[k].name} tile={CLIENTS[k]} at={at} scene={scene} index={k} />
        ))}
        {scene.sources.map((at, k) => (
          <TileView key={SOURCES[k].name} tile={SOURCES[k]} at={at} scene={scene} index={k + CLIENTS.length} />
        ))}
      </ul>

      <div
        className="sis-logo"
        style={{
          left: pct(scene.center.x, scene.w),
          top: pct(scene.center.y, scene.h),
          width: pct(scene.logo, scene.w),
        }}
      >
        <span>
          <img src={asset("logo.jpg")} alt="Smart Insight Space" draggable={false} />
        </span>
      </div>
    </div>
  );
}

export default function Hub() {
  return (
    <main className="sis">
      <SceneView scene={WIDE} className="is-wide" />
      <SceneView scene={TALL} className="is-tall" />
    </main>
  );
}
