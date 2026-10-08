"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from "react";
import { AchievementsView, ProjectsView, PublicationsView, StackView } from "./collections";
import { CHANNELS, EDUCATION, OWNER, SITE_URL, WINDOWS, type StageItem, type WindowKind } from "./profiles";
import LogoMark from "./logo-mark";
import { AppIcon, Icon, type IconName } from "./ui";

// Motion tokens: arrive with deceleration, leave with acceleration,
// and keep the exit at roughly 65% of the entrance so switching feels snappy.
const ENTER_MS = 520;
const EXIT_MS = 340;
const EASE_ENTER = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_EXIT = "cubic-bezier(0.55, 0, 0.75, 0.2)";

const WALLPAPERS = [
  { id: "ventura", name: "Ventura", swatch: "linear-gradient(140deg, #1e40af, #f97316 60%, #fbbf24)" },
  { id: "sonoma", name: "Sonoma", swatch: "linear-gradient(140deg, #064e3b, #22c55e 55%, #fde68a)" },
  { id: "dusk", name: "Dusk", swatch: "linear-gradient(140deg, #312e81, #a855f7 55%, #f9a8d4)" },
  { id: "aurora", name: "Aurora", swatch: "linear-gradient(140deg, #020617, #0891b2 55%, #7c3aed)" },
];
const WALLPAPER_KEY = "nianpham:wallpaper";
const DEFAULT_WALLPAPER = "aurora";

// Tiny external store for the viewer's wallpaper. localStorage can throw
// (private mode, blocked storage), so it is only a best-effort backing for
// the in-memory value and the picker keeps working without it.
let wallpaperCache: string | null = null;
const wallpaperListeners = new Set<() => void>();

function readWallpaper() {
  if (wallpaperCache === null) {
    wallpaperCache = DEFAULT_WALLPAPER;
    try {
      const saved = localStorage.getItem(WALLPAPER_KEY);
      if (saved && WALLPAPERS.some((w) => w.id === saved)) wallpaperCache = saved;
    } catch {}
  }
  return wallpaperCache;
}

function writeWallpaper(id: string) {
  wallpaperCache = id;
  try {
    localStorage.setItem(WALLPAPER_KEY, id);
  } catch {}
  wallpaperListeners.forEach((notify) => notify());
}

function subscribeWallpaper(notify: () => void) {
  wallpaperListeners.add(notify);
  return () => {
    wallpaperListeners.delete(notify);
  };
}

const GLYPHS: Partial<Record<WindowKind, IconName>> = {
  projects: "layers",
  publications: "book",
  stack: "cpu",
  achievements: "award",
};

const COLLECTIONS: WindowKind[] = ["projects", "publications", "stack", "achievements"];

function ItemIcon({ item, size }: { item: StageItem; size: number }) {
  const glyph = GLYPHS[item.kind];
  return glyph ? (
    <AppIcon glyph={glyph} accent={item.accent} size={size} />
  ) : (
    <AppIcon src={item.icon} photo={item.kind === "about"} size={size} />
  );
}

/** Uniform scale + translate that lands `to` on top of `from`, vertically centred. */
function flipTransform(from: DOMRect, to: DOMRect) {
  const s = from.width / to.width;
  const dx = from.left - to.left;
  const dy = from.top + from.height / 2 - (to.top + (to.height * s) / 2);
  return `translate(${dx}px, ${dy}px) scale(${s})`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Below the desktop layout the strip is a horizontal shelf; windows swap instantly there. */
function isCompact() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  // Rendered only on the client so server and client markup always match.
  if (!now) return <span className="mb-clock" />;
  return (
    <time className="mb-clock" dateTime={now.toISOString()}>
      <span className="mb-date">
        {now.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </span>
      <span>{now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
    </time>
  );
}

function WallpaperPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = WALLPAPERS.findIndex((w) => w.id === value);
    const next = (i + step + WALLPAPERS.length) % WALLPAPERS.length;
    onChange(WALLPAPERS[next].id);
    refs.current[next]?.focus();
  };
  const current = WALLPAPERS.find((w) => w.id === value) ?? WALLPAPERS[0];
  return (
    <div className="wp-picker" role="radiogroup" aria-label="Wallpaper" onKeyDown={onKey}>
      <span className="wp-picker-label" aria-hidden="true">
        {current.name}
      </span>
      {WALLPAPERS.map((w, i) => (
        <button
          key={w.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={w.id === value}
          aria-label={`${w.name} wallpaper`}
          title={w.name}
          tabIndex={w.id === value ? 0 : -1}
          className="wp-swatch"
          onClick={() => onChange(w.id)}
        >
          <span style={{ background: w.swatch }} />
        </button>
      ))}
    </div>
  );
}

type WindowProps = {
  item: StageItem;
  index: number;
  leaving?: boolean;
  windowRef?: Ref<HTMLElement>;
  onCopy: (text: string, label: string) => void;
};

function StageWindow({ item, index, leaving, windowRef, onCopy }: WindowProps) {
  const isAbout = item.kind === "about";
  const isCollection = COLLECTIONS.includes(item.kind);
  // Title-bar actions always point at the page shown in the address bar; on
  // About that is the site itself, not the email the body's buttons use.
  const chromeCopy = isAbout ? SITE_URL : item.copyValue;
  const chromeCopyLabel = isAbout ? "Link" : item.copyLabel;
  const chromeHref = isAbout ? SITE_URL : item.href;
  const chromeIsMail = chromeHref?.startsWith("mailto:") ?? false;

  return (
    <article
      ref={windowRef}
      className={`window is-${item.kind}${leaving ? " is-leaving" : ""}`}
      style={{ "--p-accent": item.accent } as CSSProperties}
      {...(leaving
        ? { "aria-hidden": true, inert: true }
        : { id: "stage-window", role: "tabpanel", "aria-labelledby": `tab-${item.id}` })}
    >
      <header className="titlebar">
        <div className="traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="address">
          <Icon name="lock" size={12} />
          <span>{item.display}</span>
        </div>
        <div className="tb-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onCopy(chromeCopy, chromeCopyLabel)}
            aria-label={`Copy ${chromeCopyLabel.toLowerCase()}`}
            title={`Copy ${chromeCopyLabel.toLowerCase()}`}
          >
            <Icon name="copy" size={16} />
          </button>
          {chromeHref && (
            <a
              className="icon-btn"
              href={chromeHref}
              {...(chromeIsMail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={`Open ${isAbout ? OWNER.website : item.name}${chromeIsMail ? "" : " in a new tab"}`}
              title={`Open ${item.name}`}
            >
              <Icon name="external" size={16} />
            </a>
          )}
        </div>
      </header>

      {isCollection ? (
        <div className="window-body is-collection">
          {item.kind === "projects" && <ProjectsView item={item} />}
          {item.kind === "publications" && <PublicationsView item={item} />}
          {item.kind === "stack" && <StackView item={item} />}
          {item.kind === "achievements" && <AchievementsView item={item} />}
        </div>
      ) : (
        <div className="window-body">
          <figure className="media">
            {item.cover && (
              <Image
                src={item.cover}
                alt={isAbout ? `Portrait of ${OWNER.name}` : ""}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                style={{ objectPosition: item.coverPosition ?? "center" }}
              />
            )}
          </figure>

          <div className="content">
            <p className="eyebrow">
              <i aria-hidden="true" />
              {item.eyebrow}
            </p>
            <div className="heading">
              {isAbout ? (
                // The logo mark stands in for the N; the intro lands on it.
                <h2 aria-label={item.title}>
                  <LogoMark />
                  <span aria-hidden="true">{item.title.slice(1)}</span>
                </h2>
              ) : (
                <h2>{item.title}</h2>
              )}
              {isAbout && <p className="role">{OWNER.role}</p>}
            </div>

            {!isAbout && <p className="desc">{item.description}</p>}

            {isAbout ? (
              <>
                <section className="info-card connect">
                  <h3>
                    <Icon name="mail" size={15} />
                    Contact
                  </h3>
                  <div className="connect-mail">
                    <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
                    <button
                      type="button"
                      className="icon-btn is-small"
                      onClick={() => onCopy(OWNER.email, "Email address")}
                      aria-label="Copy email address"
                      title="Copy email address"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                  <p className="connect-meta">
                    <span>
                      <Icon name="pin" size={14} />
                      {OWNER.location}
                    </span>
                    <span>
                      <Icon name="globe" size={14} />
                      {OWNER.website}
                    </span>
                  </p>
                  <ul className="connect-channels" aria-label="Find me on">
                    {CHANNELS.map((c) => (
                      <li key={c.id}>
                        <a
                          href={c.href}
                          {...(c.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                          aria-label={`${c.name} — ${c.label}`}
                          title={c.label}
                        >
                          <AppIcon src={c.icon} size={26} />
                          <span>{c.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="info-card">
                  <h3>
                    <Icon name="cap" size={15} />
                    Education
                  </h3>
                  <p className="edu-degree">{EDUCATION.degree}</p>
                  <p className="edu-school">
                    {EDUCATION.school} · Graduated {EDUCATION.graduated}
                  </p>
                  <dl className="edu-facts">
                    {EDUCATION.facts.map((f) => (
                      <div key={f.label}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <ul className="edu-subjects" aria-label="Coursework">
                    {EDUCATION.coursework.map((c, i) => (
                      // Hues step around the wheel so every subject gets its own colour
                      <li key={c} style={{ "--h": (i * 360) / EDUCATION.coursework.length } as CSSProperties}>
                        {c}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : null}
          </div>
        </div>
      )}

      <footer className="statusbar">
        <span>
          {index + 1} of {WINDOWS.length} · {item.name}
        </span>
        <span className="kbd-hint" aria-hidden="true">
          <kbd>↑</kbd>
          <kbd>↓</kbd> switch window
        </span>
      </footer>
    </article>
  );
}

export default function StageManager() {
  const [activeId, setActiveId] = useState(WINDOWS[0].id);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const wallpaper = useSyncExternalStore(subscribeWallpaper, readWallpaper, () => DEFAULT_WALLPAPER);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLElement>(null);
  const leavingRef = useRef<HTMLElement>(null);
  const thumbRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIdRef = useRef(activeId);
  const leavingIdRef = useRef<string | null>(null);
  const animations = useRef<Animation[]>([]);
  const mounted = useRef(false);

  const activeIndex = WINDOWS.findIndex((p) => p.id === activeId);
  const active = WINDOWS[activeIndex];
  const leaving = WINDOWS.find((p) => p.id === leavingId);

  const select = useCallback((id: string) => {
    const current = activeIdRef.current;
    if (current === id) return;
    // On phones and under reduced motion the old window just disappears — no exit flight.
    const outgoing = prefersReducedMotion() || isCompact() ? null : current;
    activeIdRef.current = id;
    leavingIdRef.current = outgoing;
    setLeavingId(outgoing);
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  }, []);

  const changeWallpaper = useCallback((id: string) => {
    // The view transition needs the new wallpaper painted synchronously inside
    // its callback, so set the attribute directly and let React catch up.
    const apply = () => {
      if (desktopRef.current) desktopRef.current.dataset.wallpaper = id;
      writeWallpaper(id);
    };
    // Cross-fade between wallpapers where the browser supports it.
    if (document.startViewTransition && !prefersReducedMotion()) document.startViewTransition(apply);
    else apply();
  }, []);

  // Deep links: open the window named in the URL hash.
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (WINDOWS.some((p) => p.id === id)) select(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [select]);

  // Stage Manager motion: the new window flies out of its thumbnail while the
  // previous one shrinks back into its own. In-flight animations are cancelled
  // first so rapid switching never leaves a window stuck mid-transition.
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    animations.current.forEach((a) => a.cancel());
    animations.current = [];

    const win = windowRef.current;
    const thumb = thumbRefs.current[activeId];
    thumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    if (!win || !thumb) return;

    // Phones: the flight across a stacked layout reads as noise, so swap instantly.
    if (isCompact()) return;

    if (prefersReducedMotion()) {
      animations.current.push(win.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" }));
      return;
    }

    const to = win.getBoundingClientRect();
    animations.current.push(
      win.animate(
        [
          { transform: flipTransform(thumb.getBoundingClientRect(), to), opacity: 0.35 },
          { transform: "none", opacity: 1 },
        ],
        { duration: ENTER_MS, easing: EASE_ENTER },
      ),
    );

    const out = leavingRef.current;
    const outThumb = leavingIdRef.current ? thumbRefs.current[leavingIdRef.current] : null;
    if (out && outThumb) {
      const exit = out.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: flipTransform(outThumb.getBoundingClientRect(), out.getBoundingClientRect()), opacity: 0 },
        ],
        { duration: EXIT_MS, easing: EASE_EXIT, fill: "forwards" },
      );
      exit.onfinish = () => {
        leavingIdRef.current = null;
        setLeavingId(null);
      };
      animations.current.push(exit);
    }
  }, [activeId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const copy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ text: `${label} copied to clipboard`, key: Date.now() });
    } catch {
      setToast({ text: `Couldn't copy ${label.toLowerCase()} — clipboard unavailable`, key: Date.now() });
    }
  }, []);

  const onStripKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = WINDOWS.length - 1;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? activeIndex === last
          ? 0
          : activeIndex + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? activeIndex === 0
            ? last
            : activeIndex - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    const id = WINDOWS[next].id;
    select(id);
    thumbRefs.current[id]?.focus();
  };

  return (
    <div className="desktop" ref={desktopRef} data-wallpaper={wallpaper}>
      {/* Living wallpaper: colour blobs on independent orbits plus an iridescent sheen */}
      <div className="wp-motion" aria-hidden="true">
        <i className="wp-blob b-a" />
        <i className="wp-blob b-b" />
        <i className="wp-blob b-c" />
        <i className="wp-blob b-d" />
        <i className="wp-sheen" />
      </div>
      <h1 className="sr-only">
        {OWNER.name} ({OWNER.nickname}) — {OWNER.role}
      </h1>

      <header className="menubar">
        <div className="mb-left">
          <span className="mb-logo" aria-hidden="true">
            N
          </span>
          <strong>{OWNER.nickname}</strong>
          <span className="mb-role">{OWNER.role}</span>
        </div>
        <div className="mb-right">
          <span className="mb-status">
            <i aria-hidden="true" />
            Open to collaboration
          </span>
          <WallpaperPicker value={wallpaper} onChange={changeWallpaper} />
          <Clock />
        </div>
      </header>

      <main className="stage" style={{ "--count": WINDOWS.length } as CSSProperties}>
        <div className="strip" role="tablist" aria-label="Windows" aria-orientation="vertical" onKeyDown={onStripKey}>
          {WINDOWS.map((p, i) => {
            const selected = p.id === activeId;
            return (
              <button
                key={p.id}
                ref={(el) => {
                  thumbRefs.current[p.id] = el;
                }}
                id={`tab-${p.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="stage-window"
                tabIndex={selected ? 0 : -1}
                className={`thumb${selected ? " is-active" : ""}`}
                style={{ "--i": i, "--p-accent": p.accent } as CSSProperties}
                onClick={() => select(p.id)}
              >
                {/* A real miniature of the window, as Stage Manager shows it */}
                <span className="thumb-window" aria-hidden="true">
                  <Image src={`/assets/thumbs/${p.id}-v4.webp`} alt="" fill sizes="240px" priority={i < 4} />
                </span>
                <span className="thumb-label">
                  <ItemIcon item={p} size={22} />
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="viewport">
          {leaving && (
            <StageWindow
              key={`leaving-${leaving.id}`}
              item={leaving}
              index={WINDOWS.indexOf(leaving)}
              leaving
              windowRef={leavingRef}
              onCopy={copy}
            />
          )}
          <StageWindow
            key={active.id}
            item={active}
            index={activeIndex}
            windowRef={windowRef}
            onCopy={copy}
          />
        </div>
      </main>

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.key}>
            <Icon name="check" size={15} />
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}
