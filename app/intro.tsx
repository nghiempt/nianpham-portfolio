"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import LogoMark from "./logo-mark";

// Splash shown before the desktop, server-rendered so it covers the first
// paint. Like a title card: the N logo materialises out of square pixels, then
// shrinks and moves left, the rest of the name assembles beside it, and finally
// the backdrop fades and the whole line is laid onto the About title.
const REVEAL_MS = 1200;
// The following steps are timed from the end of the reveal.
const SPIN_AFTER_MS = 250;
const NAME_AFTER_MS = 950;
const LEAVE_AFTER_MS = 2450;
const FLY_MS = 1000;
const REST = "ghiem Thanh Pham";
const TITLE_SELECTOR = ".window.is-about .heading h2";

type Phase = "logo" | "spin" | "name" | "leaving" | "done";

const wait = (img: HTMLImageElement) =>
  img.complete && img.naturalWidth
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });

/**
 * Pixel reveal: the logo builds up as a matrix of small square dots that pop
 * in at random, then the dots melt into the sharp logo. Drawn on a canvas laid
 * over the logo; resolves when the logo is fully formed.
 */
function pixelReveal(img: HTMLImageElement, canvas: HTMLCanvasElement, ms: number, signal: { stop: boolean }) {
  const rect = img.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  const sampler = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx || !sampler || !w || !h) return Promise.resolve();

  Object.assign(canvas.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  canvas.width = w;
  canvas.height = h;

  // One dot per cell, coloured from the logo; empty cells are skipped.
  const GRID = 19;
  sampler.canvas.width = GRID;
  sampler.canvas.height = GRID;
  sampler.drawImage(img, 0, 0, GRID, GRID);
  const px = sampler.getImageData(0, 0, GRID, GRID).data;
  const dots: { x: number; y: number; color: string; at: number }[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const a = px[i * 4 + 3] / 255;
    if (a < 0.2) continue;
    dots.push({
      x: i % GRID,
      y: Math.floor(i / GRID),
      color: `rgba(${px[i * 4]}, ${px[i * 4 + 1]}, ${px[i * 4 + 2]}, ${Math.min(1, a * 1.3)})`,
      at: Math.random(),
    });
  }

  const cw = w / GRID;
  const ch = h / GRID;
  const POP = 0.68; // share of the time spent popping dots in
  const start = performance.now();

  return new Promise<void>((resolve) => {
    const frame = (now: number) => {
      if (signal.stop) return resolve();
      const t = Math.min(1, (now - start) / ms);
      const melt = Math.max(0, (t - POP) / (1 - POP));

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1 - melt;
      for (const d of dots) {
        // Each dot pops from nothing to full size just after its turn comes.
        const grow = Math.min(1, Math.max(0, (t / POP - d.at * 0.85) / 0.15));
        if (!grow) continue;
        const size = 0.78 * grow;
        ctx.fillStyle = d.color;
        ctx.fillRect((d.x + (1 - size) / 2) * cw, (d.y + (1 - size) / 2) * ch, size * cw, size * ch);
      }
      if (melt) {
        ctx.globalAlpha = melt;
        ctx.drawImage(img, 0, 0, w, h);
      }
      ctx.globalAlpha = 1;

      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

export default function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("logo");

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const signal = { stop: false };
    const timers: number[] = [];
    const animations: Animation[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    const finish = () => {
      root.classList.remove("intro-on");
      setPhase("done");
    };

    const leave = () => {
      setPhase("leaving");
      const el = ref.current;
      const line = lineRef.current;
      const backdrop = el?.querySelector(".intro-backdrop");
      const title = document.querySelector<HTMLElement>(TITLE_SELECTOR);
      const from = line?.querySelector(".logo-mark")?.getBoundingClientRect();
      const to = title?.querySelector(".logo-mark")?.getBoundingClientRect();
      if (!el || !line || !backdrop || !title || !from || !to || reduced) {
        const fade = el?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
        if (!fade) return finish();
        fade.onfinish = finish;
        animations.push(fade);
        return;
      }

      // FLIP the line onto the title: both lay out the same markup in em, so
      // matching the logo's box lines up every letter after it too.
      const lineBox = line.getBoundingClientRect();
      line.style.transformOrigin = `${from.left - lineBox.left}px ${from.top - lineBox.top}px`;
      const fly = line.animate(
        [
          { transform: "none", color: getComputedStyle(line).color },
          {
            transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.height / from.height})`,
            color: getComputedStyle(title).color,
          },
        ],
        { duration: FLY_MS, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
      );
      fly.onfinish = finish;
      // Recolor the mark to match the title (dark on the light theme).
      const fromMark = line.querySelector(".logo-mark")!;
      const toMark = title.querySelector(".logo-mark")!;
      animations.push(
        fromMark.animate([{ filter: getComputedStyle(fromMark).filter }, { filter: getComputedStyle(toMark).filter }], {
          duration: FLY_MS,
          easing: "ease-in-out",
          fill: "forwards",
        }),
      );
      animations.push(
        fly,
        backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLY_MS * 0.8, easing: "ease-out", fill: "forwards" }),
      );
    };

    // Pixel reveal first, then the rest of the sequence; leave once the
    // name has had its moment and the page has finished loading.
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    const el = ref.current;
    const img = lineRef.current?.querySelector<HTMLImageElement>(".logo-mark");
    const canvas = canvasRef.current;
    (async () => {
      if (img && canvas && !reduced) {
        await wait(img);
        await pixelReveal(img, canvas, REVEAL_MS, signal);
        if (signal.stop) return;
        canvas.classList.add("is-done");
      }
      el?.classList.remove("is-revealing");
      later(() => setPhase("spin"), reduced ? 0 : SPIN_AFTER_MS);
      later(() => setPhase("name"), reduced ? 0 : NAME_AFTER_MS);
      const ready = performance.now();
      await loaded;
      if (signal.stop) return;
      later(leave, Math.max(0, (reduced ? 600 : LEAVE_AFTER_MS) - (performance.now() - ready)));
    })();

    return () => {
      signal.stop = true;
      timers.forEach((t) => window.clearTimeout(t));
      animations.forEach((a) => a.cancel());
      root.classList.remove("intro-on");
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div ref={ref} className="intro is-revealing" data-phase={phase} role="status" aria-label="Loading">
      <div className="intro-backdrop" aria-hidden="true">
        <div className="intro-glow intro-glow-a" />
        <div className="intro-glow intro-glow-b" />
      </div>
      <canvas ref={canvasRef} className="intro-pixels" aria-hidden="true" />

      <p ref={lineRef} className="intro-line" aria-hidden="true">
        <LogoMark priority />
        <span className="intro-rest">
          {/* Real spaces between words: a no-break space is narrower in this
              font and would leave the line shorter than the title it lands on. */}
          {REST.split(" ").map((word, w, words) => {
            const offset = words.slice(0, w).join(" ").length + (w ? 1 : 0);
            return (
              <Fragment key={w}>
                {w > 0 && " "}
                {word.split("").map((ch, i) => (
                  <span key={i} style={{ animationDelay: `${(offset + i) * 35}ms` }}>
                    {ch}
                  </span>
                ))}
              </Fragment>
            );
          })}
        </span>
      </p>
    </div>
  );
}
