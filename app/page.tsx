"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";

const socials = [
  { iconSrc: "/assets/github.svg", label: "GitHub", url: "https://github.com/nghiempt" },
  { iconSrc: "/assets/scholar.svg", label: "Scholar", url: "https://scholar.google.com/citations?user=23NArXYAAAAJ" },
  { iconSrc: "/assets/linkedin.svg", label: "LinkedIn", url: "https://www.linkedin.com/in/nianpham" },
  { iconSrc: "/assets/facebook.svg", label: "Facebook", url: "https://www.facebook.com/nianpham.me" },
];

export default function HomePage() {
  const [dark, setDark] = useState(true);
  const sceneRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = sceneRef.current;
    if (!el) return;
    el.style.setProperty("--mx", `${e.clientX}px`);
    el.style.setProperty("--my", `${e.clientY}px`);
  };

  return (
    <div
      ref={sceneRef}
      onMouseMove={handleMouseMove}
      className={`scene ${dark ? "theme-dark" : "theme-light"}`}
    >
      <div className="aurora" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>
      <div className="grid-overlay" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <div className="spotlight" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="flex justify-center px-4 pt-6">
          <div className="glass-pill rise flex w-full max-w-2xl items-center justify-between py-2.5 pl-6 pr-2.5">
            <Link href="/" className="logo-text">
              Nianverse Space
            </Link>
            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle dark mode"
              className="theme-btn"
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>
          </div>
        </nav>

        <main className="flex flex-1 items-center justify-center px-4 py-14">
          <section className="glass-card rise flex w-full max-w-2xl flex-col items-center px-6 py-14 text-center md:px-12 md:py-16" style={{ animationDelay: "0.12s" }}>
            <div className="rise mb-9" style={{ animationDelay: "0.22s" }}>
              <div className="avatar-wrap">
                <div className="avatar-ring">
                  <div className="aspect-square w-[150px] overflow-hidden rounded-full md:w-[190px]">
                    <img
                      src="/assets/profile.jpg"
                      alt="Nghiem Thanh Pham"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <h1 className="shimmer-text rise mb-4 text-3xl font-extrabold md:text-4xl" style={{ animationDelay: "0.32s" }}>
              Nghiem Thanh Pham
            </h1>

            <p className="sub-text rise mb-6 text-base font-medium md:text-lg" style={{ animationDelay: "0.42s" }}>
              Senior AI Engineer &amp; Scientific Researcher
            </p>

            <div className="badge rise mb-10" style={{ animationDelay: "0.5s" }}>
              <span className="badge-dot" />
              Open to collaboration
            </div>

            <div className="rise flex items-center gap-5" style={{ animationDelay: "0.58s" }}>
              {socials.map((social) => (
                <a
                  key={social.url}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="social-btn"
                >
                  <img
                    src={social.iconSrc}
                    alt={social.label}
                    className="h-6 w-6 object-contain"
                  />
                  <span className="social-tip">{social.label}</span>
                </a>
              ))}
            </div>
          </section>
        </main>

        <footer className="rise pb-7" style={{ animationDelay: "0.7s" }}>
          <div className="footer-line mx-auto mb-5 w-full max-w-2xl" />
          <p className="sub-text text-center text-sm">© 2026 Nghiem Thanh Pham</p>
        </footer>
      </div>
    </div>
  );
}
