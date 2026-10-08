"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import LogoMark from "./logo-mark";

// Splash shown before the desktop, server-rendered so it covers the first
// paint. Like a title card: the N logo appears still, its orbits start spinning
// as it shrinks and moves left, the rest of the name assembles beside it, then
// the backdrop fades and the whole line is laid onto the About title.
const SPIN_AT_MS = 700;
const NAME_AT_MS = 1400;
const MIN_MS = 2900;
const FLY_MS = 1000;
const REST = "ghiem Thanh Pham";
const TITLE_SELECTOR = ".window.is-about .heading h2";

type Phase = "logo" | "spin" | "name" | "leaving" | "done";

export default function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const [phase, setPhase] = useState<Phase>("logo");

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
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

    later(() => setPhase("spin"), reduced ? 0 : SPIN_AT_MS);
    later(() => setPhase("name"), reduced ? 0 : NAME_AT_MS);

    // Leave once the name has had its moment and the page has finished loading.
    const onLoad = () => later(leave, Math.max(0, (reduced ? 600 : MIN_MS) - (performance.now() - start)));
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      animations.forEach((a) => a.cancel());
      window.removeEventListener("load", onLoad);
      root.classList.remove("intro-on");
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div ref={ref} className="intro" data-phase={phase} role="status" aria-label="Loading">
      <div className="intro-backdrop" aria-hidden="true">
        <div className="intro-glow intro-glow-a" />
        <div className="intro-glow intro-glow-b" />
      </div>

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
