"use client";

import { useEffect, useRef } from "react";
import { PROJECTS } from "./data/projects";
import { STACK, type StackGroup } from "./data/stack";
import { TOOL_ICONS } from "./data/tool-icons";

/*
 * Knowledge graph of the tech stack, shown before an area is picked.
 * Area hubs link to their most-used tools; tools link to each other when they
 * shipped together in the same project (from projects.json). The layout is a
 * small deterministic force simulation computed once. It is drawn on a canvas
 * (an SVG with this many moving parts re-lays out every frame and drops to ~30 fps).
 */

type Node = {
  id: string;
  kind: "hub" | "tool";
  label: string;
  group: StackGroup;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Edge = { a: number; b: number; kind: "hub" | "co"; w: number };

const TOOLS_PER_AREA = 4;
const MAX_CO_EDGES = 90;

function buildGraph() {
  // How often each tool appears across projects, and which pairs appear together.
  const freq = new Map<string, number>();
  const pairs = new Map<string, number>();
  for (const p of PROJECTS) {
    const names = [...new Set(p.stack)];
    names.forEach((n) => freq.set(n, (freq.get(n) ?? 0) + 1));
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++) {
        const k = [names[i], names[j]].sort().join("\u0000");
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const index = new Map<string, number>();
  const seed = (() => {
    let s = 7;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();

  STACK.forEach((g, gi) => {
    const angle = (gi / STACK.length) * Math.PI * 2;
    const hub = nodes.push({
      id: `hub:${g.id}`, kind: "hub", label: g.label, group: g, r: 34,
      x: Math.cos(angle) * 460, y: Math.sin(angle) * 160, vx: 0, vy: 0,
    }) - 1;
    // The area's most-shipped tools first, then the list order as a tiebreak.
    const picks = [...g.tools]
      .map((t, i) => ({ t, score: (freq.get(t.name) ?? 0) * 100 - i }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOOLS_PER_AREA);
    for (const { t } of picks) {
      const i = nodes.push({
        id: t.name, kind: "tool", label: t.name, group: g, r: 21,
        x: nodes[hub].x + (seed() - 0.5) * 120, y: nodes[hub].y + (seed() - 0.5) * 120, vx: 0, vy: 0,
      }) - 1;
      index.set(t.name, i);
      edges.push({ a: hub, b: i, kind: "hub", w: 1 });
    }
  });

  // Only the strongest cross-area links: enough to show the web, light enough to animate.
  const co: Edge[] = [];
  for (const [k, n] of pairs) {
    const [x, y] = k.split("\u0000");
    const a = index.get(x), b = index.get(y);
    if (a !== undefined && b !== undefined && nodes[a].group !== nodes[b].group) co.push({ a, b, kind: "co", w: n });
  }
  co.sort((p, q) => q.w - p.w);
  edges.push(...co.slice(0, MAX_CO_EDGES));

  // --- force simulation ---
  for (let step = 0; step < 420; step++) {
    const alpha = 1 - step / 420;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        let dx = n.x - m.x, dy = n.y - m.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = seed() - 0.5; dy = seed() - 0.5; d2 = 1; }
        const d = Math.sqrt(d2);
        const minD = n.r + m.r + 12;
        let f = 700 / d2;
        if (d < minD) f += (minD - d) * 0.5;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        n.vx += fx; n.vy += fy; m.vx -= fx; m.vy -= fy;
      }
    }
    for (const e of edges) {
      const n = nodes[e.a], m = nodes[e.b];
      const dx = m.x - n.x, dy = m.y - n.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const len = e.kind === "hub" ? 56 : 110;
      const k = e.kind === "hub" ? 0.06 : 0.006 * Math.min(e.w, 3);
      const f = (d - len) * k;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      n.vx += fx; n.vy += fy; m.vx -= fx; m.vy -= fy;
    }
    for (const n of nodes) {
      n.vx -= n.x * 0.0018; n.vy -= n.y * 0.02; // gravity, flattened to fit a wide panel
      n.x += n.vx * alpha * 0.5; n.y += n.vy * alpha * 0.5;
      n.vx *= 0.6; n.vy *= 0.6;
    }
  }

  // Final pass: push apart anything still touching (tools keep room for their labels).
  for (let it = 0; it < 80; it++)
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const n = nodes[i], m = nodes[j];
        const dx = n.x - m.x, dy = n.y - m.y;
        const d = Math.hypot(dx, dy) || 1;
        const minD = n.r + m.r + 6 + (n.kind === "tool" && m.kind === "tool" ? 4 : 0);
        if (d < minD) {
          const push = (minD - d) / 2;
          n.x += (dx / d) * push; n.y += (dy / d) * push;
          m.x -= (dx / d) * push; m.y -= (dy / d) * push;
        }
      }

  const pad = 34;
  const minX = Math.min(...nodes.map((n) => n.x - n.r)) - pad;
  const maxX = Math.max(...nodes.map((n) => n.x + n.r)) + pad;
  const minY = Math.min(...nodes.map((n) => n.y - n.r)) - pad;
  const maxY = Math.max(...nodes.map((n) => n.y + n.r + 18)) + pad;
  return { nodes, edges, box: [minX, minY, maxX - minX, maxY - minY] as const };
}

const GRAPH = buildGraph();

type Palette = { fg: string; muted: string; tile: string; halo: number; dark: boolean; font: string };

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return {
    fg: cs.getPropertyValue("--fg").trim() || "#0f172a",
    muted: cs.getPropertyValue("--fg-subtle").trim() || "#64748b",
    tile: dark ? "#1e2130" : "#ffffff",
    halo: dark ? 0.22 : 0.14,
    dark,
    font: cs.fontFamily,
  };
}

/** Rasterisable images for every tool icon: logo files as-is, sprite symbols as tinted standalone SVGs. */
function useIconImages() {
  const cache = useRef(new Map<string, HTMLImageElement>());
  const sprite = useRef<Document | null>(null);
  const ready = useRef<Promise<void> | null>(null);

  const load = () => {
    if (!ready.current) {
      ready.current = fetch("/assets/tool-icons.svg")
        .then((r) => r.text())
        .then((t) => {
          sprite.current = new DOMParser().parseFromString(t, "image/svg+xml");
        })
        .catch(() => {});
    }
    return ready.current;
  };

  const get = (name: string, color: string, dark: boolean): HTMLImageElement | null => {
    const icon = TOOL_ICONS[name];
    if (!icon) return null;
    const key = `${name}|${dark}|${color}`;
    const hit = cache.current.get(key);
    if (hit) return hit;
    let src = "";
    if ("img" in icon) src = icon.img;
    else {
      const id = "line" in icon ? icon.line : icon.id;
      const sym = sprite.current?.getElementById(id);
      if (!sym) return null;
      const tint = "line" in icon ? color : dark ? icon.dark : icon.light;
      const fill = "line" in icon ? "none" : tint;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sym.getAttribute("viewBox")}" width="48" height="48" fill="${fill}" style="color:${tint}">${sym.innerHTML}</svg>`;
      src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
    const img = new Image();
    img.src = src;
    cache.current.set(key, img);
    return img;
  };

  return { load, get };
}

function hubLines(label: string) {
  // Greedy wrap at ~11 characters; a third line is dropped and dangling "&" removed.
  const lines: string[] = [];
  for (const w of label.replace(/,/g, "").split(" ")) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + w).length <= 11) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  return lines.slice(0, 2).map((l) => l.replace(/\s*&$/, "").replace(/^&\s*/, "")).filter(Boolean);
}

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function StackGraph({ onPick }: { onPick: (areaId: string) => void }) {
  const { nodes, edges, box } = GRAPH;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pickRef = useRef(onPick);
  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);
  const icons = useIconImages();
  const iconsRef = useRef(icons);
  useEffect(() => {
    iconsRef.current = icons;
  });

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)");

    const neighbours = nodes.map(() => new Set<number>());
    edges.forEach((e) => {
      neighbours[e.a].add(e.b);
      neighbours[e.b].add(e.a);
    });
    const motion = nodes.map((n, i) => ({
      amp: n.kind === "hub" ? 4 : 7,
      fx: 0.00045 + ((i * 37) % 23) / 60000,
      fy: 0.00038 + ((i * 53) % 19) / 60000,
      px: (i * 1.7) % (Math.PI * 2),
      py: (i * 2.3) % (Math.PI * 2),
    }));
    const pos = nodes.map((n) => ({ x: n.x, y: n.y }));

    let pal = readPalette(wrap);
    let w = 0, h = 0, scale = 1, ox = 0, oy = 0;
    let hover: number | null = null;
    let raf = 0, visible = true, t0 = 0;

    const resize = () => {
      // Layout size, not getBoundingClientRect: the window may be mid-flight
      // in a scale transform when this first runs.
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(w / box[2], h / box[3]);
      ox = (w - box[2] * scale) / 2 - box[0] * scale;
      oy = (h - box[3] * scale) / 2 - box[1] * scale;
      if (reduce) draw(performance.now());
    };

    const draw = (t: number) => {
      if (!t0) t0 = t;
      const age = reduce ? 1e9 : t - t0;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], m = motion[i];
        pos[i].x = reduce ? n.x : n.x + Math.sin(t * m.fx + m.px) * m.amp;
        pos[i].y = reduce ? n.y : n.y + Math.cos(t * m.fy + m.py) * m.amp;
      }
      const lit = (i: number) => hover === null || i === hover || neighbours[hover].has(i);
      const fadeIn = (i: number) => Math.min(1, Math.max(0, (age - (i % 40) * 18) / 520));

      ctx.save();
      ctx.clearRect(0, 0, w, h);
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      // edges
      for (const e of edges) {
        const a = pos[e.a], b = pos[e.b];
        const on = hover !== null && (e.a === hover || e.b === hover);
        const alpha = Math.min(fadeIn(e.a), fadeIn(e.b));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        if (e.kind === "hub") {
          ctx.strokeStyle = nodes[e.a].group.color;
          ctx.lineWidth = on ? 2.2 : 1.6;
          ctx.setLineDash([6, 5]);
          ctx.lineDashOffset = reduce ? 0 : -((t / 1400) * 22) % 22;
          ctx.globalAlpha = alpha * (hover === null ? 0.55 : on ? 0.95 : 0.06);
        } else {
          ctx.strokeStyle = on ? nodes[hover === e.b ? e.b : e.a].group.color : pal.muted;
          ctx.lineWidth = on ? 1.8 : 0.8;
          ctx.setLineDash([]);
          ctx.globalAlpha = alpha * (hover === null ? 0.24 : on ? 0.9 : 0.05);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // nodes
      const labels: { x: number; y: number; text: string }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], p = pos[i];
        const a = fadeIn(i) * (lit(i) ? 1 : 0.18);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        if (n.kind === "hub") {
          const beat = reduce ? 0.5 : (Math.sin(t / 573 + i) + 1) / 2;
          ctx.globalAlpha = a * (pal.halo + beat * 0.14);
          ctx.fillStyle = n.group.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, n.r + 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.font = `700 11px ${pal.font}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const ls = hubLines(n.label);
          ls.forEach((l, k) => ctx.fillText(l, p.x, p.y + (k - (ls.length - 1) / 2) * 13));
        } else {
          ctx.fillStyle = pal.tile;
          ctx.beginPath();
          ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = i === hover ? 3 : 2;
          ctx.strokeStyle = n.group.color;
          ctx.globalAlpha = a * (i === hover ? 1 : 0.55);
          ctx.stroke();
          ctx.globalAlpha = a;
          const img = iconsRef.current.get(n.label, n.group.color, pal.dark);
          if (img && img.complete && img.naturalWidth) ctx.drawImage(img, p.x - 11, p.y - 11, 22, 22);
          else {
            ctx.fillStyle = n.group.color;
            ctx.font = `800 13px ${pal.font}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(n.label.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase(), p.x, p.y);
          }
          if (hover !== null && lit(i)) labels.push({ x: p.x, y: p.y + n.r + 14, text: short(n.label, 18) });
        }
      }
      // labels last so they sit above every node
      ctx.globalAlpha = 1;
      ctx.font = `650 12px ${pal.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      for (const l of labels) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = pal.dark ? "#14161f" : "#f4f5f8";
        ctx.strokeText(l.text, l.x, l.y);
        ctx.fillStyle = pal.fg;
        ctx.fillText(l.text, l.x, l.y);
      }
      ctx.restore();
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce) return draw(performance.now());
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const hit = (ev: PointerEvent) => {
      const x = (ev.offsetX - ox) / scale, y = (ev.offsetY - oy) / scale;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const d = Math.hypot(pos[i].x - x, pos[i].y - y);
        if (d <= nodes[i].r + 3) return i;
      }
      return null;
    };
    const onMove = (ev: PointerEvent) => {
      const i = hit(ev);
      if (i !== hover) {
        hover = i;
        canvas.style.cursor = i === null ? "default" : "pointer";
        canvas.title = i === null ? "" : nodes[i].kind === "hub" ? `${nodes[i].label} — open this area` : `${nodes[i].label} · ${nodes[i].group.label}`;
        if (reduce) draw(performance.now());
      }
    };
    const onLeave = () => {
      hover = null;
      canvas.style.cursor = "default";
      if (reduce) draw(performance.now());
    };
    const onClick = (ev: PointerEvent) => {
      // Nodes drift, so trust the node the user sees highlighted over a fresh hit test.
      const i = hover ?? hit(ev);
      if (i !== null) pickRef.current(nodes[i].group.id);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(wrap);
    const onVis = () => (document.hidden ? stop() : start());
    const onScheme = () => {
      pal = readPalette(wrap);
      if (reduce) draw(performance.now());
    };
    document.addEventListener("visibilitychange", onVis);
    darkMq.addEventListener("change", onScheme);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    // Fonts and sprite icons arrive asynchronously; redraw once they are in.
    iconsRef.current.load().then(() => reduce && draw(performance.now()));
    document.fonts?.ready.then(() => {
      pal = readPalette(wrap);
      if (reduce) draw(performance.now());
    });
    resize();
    start();
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      darkMq.removeEventListener("change", onScheme);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [nodes, edges, box]);

  return (
    <div className="kg">
      <header className="kg-head">
        <h3>How it all connects</h3>
        <small>
          Each area links to its most-used tools; tools link when they shipped together in a project. Hover a
          node to trace its connections, click to open the area.
        </small>
      </header>
      <div className="kg-canvas" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Knowledge graph of ${STACK.length} tech areas and their most-used tools. Use the list of areas to browse.`}
        />
      </div>
    </div>
  );
}
