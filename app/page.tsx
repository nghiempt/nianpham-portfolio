"use client";

import Link from "next/link";
import { useState } from "react";

const socials = [
  { iconSrc: "/assets/github.svg", label: "GitHub", url: "https://github.com/nghiempt" },
  { iconSrc: "/assets/scholar.svg", label: "Scholar", url: "https://scholar.google.com/citations?user=23NArXYAAAAJ" },
  { iconSrc: "/assets/linkedin.svg", label: "LinkedIn", url: "https://www.linkedin.com/in/nianpham" },
];

export default function HomePage() {
  const [dark, setDark] = useState(false);

  const bg = dark ? "#1a1a1a" : "#fafbfb";
  const fg = dark ? "#fafbfb" : "#1a1a1a";
  const sub = dark ? "#aaa" : "#555";
  const footerColor = dark ? "#666" : "#333";
  const iconFilter = dark ? "brightness(0) invert(1)" : "brightness(0)";

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: bg, color: fg, transition: "background 0.3s, color 0.3s" }}>
      <nav
        className="flex items-center justify-between px-8 py-5"
      >
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="text-base font-bold uppercase tracking-widest"
            style={{ color: fg, letterSpacing: "0.15em" }}
          >
            Nianverse Space
          </Link>
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:opacity-70"
            style={{ background: dark ? "#333" : "#eee", color: fg }}
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
          </button>
        </div>
      </nav>
      <main className="flex flex-1 flex-col items-center justify-center py-20">
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div
            className="mb-8 overflow-hidden rounded-full w-[160px] md:w-[200px] lg:w-[200px]"
            style={{
              background: "#edeae6",
              border: "none",
            }}
          >
            <img
              src="/assets/profile.jpg"
              alt="Nghiem Thanh Pham"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mb-4 text-2xl md:text-3xl font-bold" style={{ color: fg }}>
            Nghiem Thanh Pham
          </h1>
          <p className="mb-10 text-center text-md md:text-lg font-semibold" style={{ color: sub }}>
            Senior AI Engineer &amp; Scientific Researcher
          </p>
          <div className="flex items-center gap-6">
            {socials.map((social) => (
              <a
                key={social.url}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="transition-opacity hover:opacity-60"
              >
                <img
                  src={social.iconSrc}
                  alt={social.label}
                  className="h-7 w-7 object-contain"
                  style={{ filter: iconFilter }}
                />
              </a>
            ))}
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm" style={{ color: footerColor }}>
        © 2026 Nghiem Thanh Pham
      </footer>
    </div>
  );
}
