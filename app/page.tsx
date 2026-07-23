"use client";

import { useLayoutEffect, useRef } from "react";

const LINKS = {
  github: "https://github.com/nghiempt",
  scholar: "https://scholar.google.com/citations?user=23NArXYAAAAJ",
  linkedin: "https://www.linkedin.com/in/nianpham",
  facebook: "https://www.facebook.com/nianpham.me",
  email: "mailto:nianpham.reed@gmail.com",
};

function BrokenIcon({ className = "broken-icon" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="9" cy="9" r="1.6" />
      <path d="M21 15.5l-4.5-4.5L9.5 18" />
      <path d="M3.5 20.5l17-17" />
    </svg>
  );
}

export default function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // Scale the whole layout down so the full page always fits the
  // viewport height on desktop — no vertical scrolling.
  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const fit = () => {
      if (window.innerWidth < 1024) {
        el.style.removeProperty("zoom");
        el.style.removeProperty("height");
        el.style.removeProperty("min-height");
        return;
      }
      // Measure the natural content height, without the 100vh stretch.
      el.style.zoom = "1";
      el.style.minHeight = "0";
      el.style.height = "auto";
      const full = el.scrollHeight;
      // Scale up or down so the content exactly fills the viewport height.
      const scale = window.innerHeight / full;
      el.style.zoom = scale.toFixed(4);
      el.style.height = `${Math.round(window.innerHeight / scale)}px`;
    };
    fit();
    // Re-measure once webfonts finish loading — text metrics change the page height.
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="page" ref={pageRef}>
      {/* <section className="hero">
        <h1 className="headline">
          Stop Searching for Me on
          <br />
          <span className="accent">
            &ldquo;Every&rdquo;
            <svg className="swoosh" viewBox="0 0 130 14" aria-hidden="true">
              <path d="M4 10 C 40 3, 85 2, 126 7" />
              <path d="M14 13 C 48 7, 82 6, 110 9" />
            </svg>
          </span>{" "}
          Social Network
        </h1>
        <p className="lede">
          I&rsquo;m <strong>Nghiem Thanh Pham (Nian Pham)</strong>{" "}&mdash; Senior AI Engineer &amp;
          Scientific Researcher. No boring link lists here: every preview card below is a{" "}
          <strong>&ldquo;real profile&rdquo;</strong> of mine — click one and say hello.
        </p>
      </section> */}

      <section className="collage" aria-label="My social profiles">
        {/* ---- Ghost cards (decor) ---- */}
        <div className="ghost g1" aria-hidden="true">
          <span className="g-label">Read latest article</span>
          <div className="g-line w80" />
          <div className="g-line w60" />
        </div>
        <div className="ghost g2" aria-hidden="true">
          <span className="g-title">Untitled</span>
          <div className="g-line w80" />
          <div className="g-thumb">
            <BrokenIcon />
          </div>
        </div>
        <div className="ghost g3" aria-hidden="true">
          <div className="g-thumb">
            <BrokenIcon />
          </div>
        </div>
        <div className="ghost g4" aria-hidden="true">
          <span className="g-title">Welcome to our newsletter</span>
          <div className="g-line w60" />
          <div className="g-thumb">
            <BrokenIcon />
          </div>
        </div>
        <div className="ghost g5" aria-hidden="true">
          <div className="g-thumb" style={{ height: 110 }}>
            <BrokenIcon />
          </div>
          <div className="g-bar">John Smith · ghost.org</div>
        </div>
        <div className="ghost g6" aria-hidden="true">
          <span className="g-title">Senior AI Researcher — Remote, Full-Time</span>
          <div className="g-line w40" />
          <div className="g-line w80" />
        </div>

        {/* ---- Annotation pills + dashed arrows ---- */}
        <span className="pill p1">
          My code <span className="plus">+</span>
        </span>
        <svg className="a1 arrow" viewBox="0 0 110 74" aria-hidden="true">
          <path d="M100 8 C 72 20, 34 36, 14 60" />
          <path className="head" d="M14 60 l 10 -6 l -3.5 8.5 z" />
        </svg>

        <span className="pill p2">
          Let&rsquo;s connect <span className="plus">+</span>
        </span>
        <svg className="a2 arrow" viewBox="0 0 96 94" aria-hidden="true">
          <path d="M22 88 C 30 54, 52 28, 80 10" />
          <path className="head" d="M80 10 l -11 2 l 6 -8.5 z" />
        </svg>

        <span className="pill p3">
          Say hello <span className="plus">+</span>
        </span>
        <svg className="a3 arrow" viewBox="0 0 84 62" aria-hidden="true">
          <path d="M74 54 C 60 32, 38 16, 12 10" />
          <path className="head" d="M12 10 l 10.5 -3 l -5.5 9 z" />
        </svg>

        {/* ---- Social cards (clickable) ---- */}
        <a
          className="card c-github"
          href={LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub — nghiempt"
        >
          <div className="thumb">
            <img src="/assets/github.svg" alt="" />
          </div>
          <div className="card-body">
            <span className="card-domain">GITHUB.COM</span>
            <span className="card-title">nghiempt — code, projects &amp; open source</span>
          </div>
        </a>

        <a
          className="card c-linkedin"
          href={LINKS.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn — Nghiem Thanh Pham"
        >
          <div className="thumb">
            <img src="/assets/linkedin.svg" alt="" />
          </div>
          <div className="card-body">
            <span className="card-domain">LINKEDIN.COM</span>
            <span className="card-title">Nghiem Thanh Pham — Senior AI Engineer</span>
          </div>
        </a>

        <a
          className="card c-scholar"
          href={LINKS.scholar}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Google Scholar — Nian Pham"
        >
          <div className="card-body">
            <span className="link-title">Nian Pham | Google Scholar ⭐</span>
            <span className="desc">
              Peer-reviewed publications, citations &amp; ongoing AI research.
            </span>
          </div>
          <div className="thumb">
            <img src="/assets/scholar.svg" alt="" />
          </div>
        </a>

        <a
          className="card c-facebook"
          href={LINKS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook — Nian Pham"
        >
          <img className="side-photo" src="/assets/profile.jpg" alt="" />
          <div className="card-body">
            <span className="card-domain lower">facebook.com</span>
            <span className="card-title">Nian Pham — daily life &amp; updates</span>
          </div>
        </a>

        <a className="card c-gmail" href={LINKS.email} aria-label="Email Nian Pham">
          <div className="thumb">
            <img src="/assets/gmail.svg" alt="" />
          </div>
          <div className="card-body">
            <span className="card-title">Say Hello</span>
            <span className="desc">
              Open to collaboration &amp; interesting problems — I reply fast.
            </span>
            <span className="card-domain lower">nianpham.reed@gmail.com</span>
          </div>
        </a>
      </section>

      <footer className="foot">© 2026 Nghiem Thanh Pham</footer>
    </div>
  );
}
