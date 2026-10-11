"use client";

import { useEffect, useRef, useState } from "react";
import { OWNER } from "./profiles";

// Splash shown before the desktop, server-rendered so it covers the first
// paint. A frosted sheet over the real wallpaper (the same glass the windows
// use); the name and role rise in, hold briefly, then the sheet clears.
// The entrance is pure CSS so it starts before hydration; JS only times the exit.
const HOLD_MS = 1700; // from mount, so the name has had its moment
const LEAVE_MS = 650;

export default function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const timers: number[] = [];

    const finish = () => {
      root.classList.remove("intro-on");
      setDone(true);
    };
    const leave = () => {
      ref.current?.setAttribute("data-phase", "leaving");
      // Let the page scroll and take clicks while the sheet fades.
      root.classList.remove("intro-on");
      timers.push(window.setTimeout(finish, reduced ? 0 : LEAVE_MS));
    };
    const schedule = () => {
      const left = Math.max(0, (reduced ? 400 : HOLD_MS) - (performance.now() - start));
      timers.push(window.setTimeout(leave, left));
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      timers.forEach((t) => window.clearTimeout(t));
      root.classList.remove("intro-on");
    };
  }, []);

  if (done) return null;

  return (
    <div ref={ref} className="intro" role="status" aria-label="Loading">
      <div className="intro-card">
        <p className="intro-name">
          {OWNER.name.split(" ").map((word, i) => (
            <span key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
              {word}
            </span>
          ))}
        </p>
        <p className="intro-role">Scientist - Engineer - Founder - Dreamer</p>
        <i className="intro-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
