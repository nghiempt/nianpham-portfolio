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
import { OWNER, PROFILES, type Profile } from "./profiles";

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

const ICONS = {
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: (
    <>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
};

function Icon({ name, size = 18 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function AppIcon({ profile, size }: { profile: Profile; size: number }) {
  const isPhoto = profile.id === "about";
  return (
    <span
      className={`app-icon${isPhoto ? " is-photo" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={profile.icon}
        alt=""
        width={size}
        height={size}
        sizes={`${size * 2}px`}
        style={isPhoto ? { objectPosition: "center 20%" } : undefined}
      />
    </span>
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
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
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
  profile: Profile;
  index: number;
  leaving?: boolean;
  windowRef?: Ref<HTMLElement>;
  onSelect: (id: string) => void;
  onCopy: (text: string, label: string) => void;
};

function StageWindow({ profile, index, leaving, windowRef, onSelect, onCopy }: WindowProps) {
  const isAbout = profile.id === "about";
  const isMail = profile.href.startsWith("mailto:");
  const copyValue = profile.copyValue ?? profile.href;
  const copyLabel = profile.copyLabel ?? "Link";
  const linkProps = isMail ? {} : { target: "_blank", rel: "noopener noreferrer" };

  return (
    <article
      ref={windowRef}
      className={`window${leaving ? " is-leaving" : ""}${isAbout ? " is-about" : ""}`}
      style={{ "--p-accent": profile.accent } as CSSProperties}
      {...(leaving
        ? { "aria-hidden": true, inert: true }
        : { id: "stage-window", role: "tabpanel", "aria-labelledby": `tab-${profile.id}` })}
    >
      <header className="titlebar">
        <div className="traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="address">
          <Icon name="lock" size={12} />
          <span>{profile.display}</span>
        </div>
        <div className="tb-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onCopy(copyValue, copyLabel)}
            aria-label={`Copy ${copyLabel.toLowerCase()}`}
            title={`Copy ${copyLabel.toLowerCase()}`}
          >
            <Icon name="copy" size={16} />
          </button>
          <a
            className="icon-btn"
            href={profile.href}
            {...linkProps}
            aria-label={`Open ${profile.name}${isMail ? "" : " in a new tab"}`}
            title={`Open ${profile.name}`}
          >
            <Icon name="external" size={16} />
          </a>
        </div>
      </header>

      <div className="window-body">
        <figure className="media">
          <Image
            src={profile.cover}
            alt={isAbout ? `Portrait of ${OWNER.name}` : ""}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            style={{ objectPosition: profile.coverPosition ?? "center" }}
          />
          <figcaption className="media-caption">
            <AppIcon profile={profile} size={36} />
            <span className="mc-text">
              <strong>{isAbout ? OWNER.nickname : profile.name}</strong>
              <span>{isAbout ? OWNER.role : profile.display}</span>
            </span>
            {isAbout && (
              <span className="status-pill">
                <i aria-hidden="true" /> Available
              </span>
            )}
          </figcaption>
        </figure>

        <div className="content">
          <p className="eyebrow">
            <i aria-hidden="true" />
            {profile.eyebrow}
          </p>
          <div className="heading">
            <h2>{profile.title}</h2>
            {isAbout && <p className="role">{OWNER.role}</p>}
          </div>

          {isAbout && <blockquote className="tagline">{OWNER.tagline}</blockquote>}
          <p className="desc">{profile.description}</p>

          {isAbout ? (
            <div className="find-me">
              <h3>Find me on</h3>
              <ul>
                {PROFILES.slice(1).map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => onSelect(p.id)}>
                      <AppIcon profile={p} size={32} />
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.eyebrow}</small>
                      </span>
                      <Icon name="chevron" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="highlights" aria-label="What you'll find">
              {profile.highlights.map((h) => (
                <li key={h}>
                  <span className="check">
                    <Icon name="check" size={13} />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}

          {profile.meta.length > 0 && (
            <dl className="meta">
              {profile.meta.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd title={m.value}>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="actions">
            <a className="btn btn-primary" href={profile.href} {...linkProps}>
              {profile.cta}
              <Icon name="arrow" size={16} />
            </a>
            <button type="button" className="btn btn-secondary" onClick={() => onCopy(copyValue, copyLabel)}>
              <Icon name="copy" size={16} />
              Copy {copyLabel.toLowerCase()}
            </button>
          </div>
        </div>
      </div>

      <footer className="statusbar">
        <span>
          {index + 1} of {PROFILES.length} · {profile.name}
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
  const [activeId, setActiveId] = useState(PROFILES[0].id);
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

  const activeIndex = PROFILES.findIndex((p) => p.id === activeId);
  const active = PROFILES[activeIndex];
  const leaving = PROFILES.find((p) => p.id === leavingId);

  const select = useCallback((id: string) => {
    const current = activeIdRef.current;
    if (current === id) return;
    // Under reduced motion the old window just disappears — no exit flight.
    const outgoing = prefersReducedMotion() ? null : current;
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
      if (PROFILES.some((p) => p.id === id)) select(id);
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
      setToast({ text: `Couldn't copy — ${text}`, key: Date.now() });
    }
  }, []);

  const onStripKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = PROFILES.length - 1;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? activeIndex === last ? 0 : activeIndex + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? activeIndex === 0 ? last : activeIndex - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    const id = PROFILES[next].id;
    select(id);
    thumbRefs.current[id]?.focus();
  };

  return (
    <div className="desktop" ref={desktopRef} data-wallpaper={wallpaper}>
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

      <main className="stage">
        <div
          className="strip"
          role="tablist"
          aria-label="My profiles"
          aria-orientation="vertical"
          onKeyDown={onStripKey}
        >
          {PROFILES.map((p, i) => {
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
                style={{ "--i": i } as CSSProperties}
                onClick={() => select(p.id)}
              >
                <span className="thumb-window" aria-hidden="true">
                  <span className="thumb-bar">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="thumb-media">
                    <Image
                      src={p.cover}
                      alt=""
                      fill
                      sizes="200px"
                      style={{ objectPosition: p.coverPosition ?? "center" }}
                    />
                  </span>
                </span>
                <span className="thumb-label">
                  <AppIcon profile={p} size={22} />
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
              profile={leaving}
              index={PROFILES.indexOf(leaving)}
              leaving
              windowRef={leavingRef}
              onSelect={select}
              onCopy={copy}
            />
          )}
          <StageWindow
            key={active.id}
            profile={active}
            index={activeIndex}
            windowRef={windowRef}
            onSelect={select}
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
