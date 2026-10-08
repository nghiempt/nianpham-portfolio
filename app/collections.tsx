"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { CATEGORIES, CATEGORY_BY_ID, PROJECTS, type Project, type ProjectCategory } from "./data/projects";
import { isPublished, PUBLICATIONS, type Publication } from "./data/publications";
import { ACHIEVEMENT_KINDS, ACHIEVEMENTS, KIND_BY_ID } from "./data/achievements";
import { STACK } from "./data/stack";
import { StackGraph } from "./stack-graph";
import { TOOL_ICONS } from "./data/tool-icons";
import type { StageItem } from "./profiles";
import { Icon, type IconName } from "./ui";

const tint = (color: string) => ({ "--c": color }) as CSSProperties;
const hostOf = (url: string) => new URL(url).host.replace(/^www\./, "");
// Thumbnails can be any URL from projects.json; remote ones skip the Next.js
// optimizer so no domain allow-list has to be maintained.
const isRemote = (src: string) => /^https?:\/\//.test(src);

/* ------------------------------------------------------------------ Shell */

function CollectionShell({
  item,
  stats,
  filters,
  children,
}: {
  item: StageItem;
  stats: { value: string | number; label: string }[] | ReactNode;
  filters: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="collection">
      <header className="col-head">
        <div className="col-intro">
          {item.eyebrow && (
            <p className="eyebrow">
              <i aria-hidden="true" />
              {item.eyebrow}
            </p>
          )}
          <h2>{item.title}</h2>
          {item.description && <p className="col-desc">{item.description}</p>}
        </div>
        {Array.isArray(stats) ? (
          <dl className="col-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          stats
        )}
      </header>
      {filters}
      <div className="gallery">{children}</div>
    </div>
  );
}

function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  counts,
  icons,
  extra,
  hideEmpty,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | "all";
  onChange: (v: T | "all") => void;
  counts: Record<string, number>;
  icons?: Partial<Record<T | "all", IconName>>;
  extra?: ReactNode;
  /** Hide options with nothing in them anywhere (counts of 0 are noise). */
  hideEmpty?: boolean;
}) {
  const all = [{ id: "all" as const, label: "All" }, ...options].filter(
    (o) => !hideEmpty || o.id === "all" || (counts[o.id] ?? 0) > 0,
  );
  return (
    <div className="chips">
      {/* One row of tabs; scrolls sideways (with edge fades) when it can't fit */}
      <div className="seg" role="toolbar" aria-label={label} ref={useEdgeFade<HTMLDivElement>()}>
        {all.map((o) => {
          const icon = icons?.[o.id as T | "all"];
          return (
            <button
              key={o.id}
              type="button"
              className="seg-btn"
              aria-pressed={value === o.id}
              onClick={() => onChange(o.id)}
            >
              {icon && <Icon name={icon} size={14} />}
              {o.label}
              <span className="seg-count">{counts[o.id] ?? 0}</span>
            </button>
          );
        })}
      </div>
      {extra}
    </div>
  );
}

function GalleryGroup({ title, meta, children }: { title: string | number; meta?: string; children: ReactNode }) {
  return (
    <section className="g-group">
      <h3 className="g-group-title">
        {title}
        {meta && <span>{meta}</span>}
      </h3>
      <ul className="g-grid">{children}</ul>
    </section>
  );
}

/* ---------------------------------------------------------------- Projects */

/** Bolds the leading figure of a metric sentence, e.g. "**588** REST endpoints". */
function MetricText({ text }: { text: string }) {
  const m = text.match(/^([<~>≈]?\s?[\d.,]+(?:[–-][\d.,]+)?\s?(?:[%+×x]|[kKMB]\+?|s)?\+?)(\s.*)$/);
  return m ? (
    <span>
      <strong>{m[1]}</strong>
      {m[2]}
    </span>
  ) : (
    <span>{text}</span>
  );
}

/**
 * Marks a horizontally scrollable row with data-fade-left / data-fade-right
 * while content is hidden past that edge, so CSS can fade only real overflow.
 */
function useEdgeFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.dataset.fadeLeft = String(el.scrollLeft > 1);
      el.dataset.fadeRight = String(el.scrollLeft < max - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  return ref;
}

/** Flags a clamped description so its full-text tooltip only appears when text was cut. */
function markClamped(e: MouseEvent<HTMLElement>) {
  const text = e.currentTarget.firstElementChild as HTMLElement | null;
  if (text) e.currentTarget.dataset.clamped = String(text.scrollHeight > text.clientHeight + 1);
}

// Thumbnails that have already loaded once, so re-mounted cards (e.g. after
// switching filters) skip the skeleton.
const loadedThumbs = new Set<string>();

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const style = CATEGORY_BY_ID[project.category];
  const thumb = project.thumbnail;
  // The card shows as a skeleton until its cover image is ready, then reveals.
  const [ready, setReady] = useState(() => !thumb || loadedThumbs.has(thumb));
  const [revealed, setRevealed] = useState(false);
  const onThumbDone = () => {
    if (thumb) loadedThumbs.add(thumb);
    if (!ready) {
      setReady(true);
      setRevealed(true);
    }
  };
  const extra = project.stack.length - 2;
  // The whole card links to the live project; without a URL it is plain content.
  const Card = project.url ? "a" : "div";
  const linkProps = project.url ? { href: project.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <li
      className={ready ? (revealed ? "is-revealed" : undefined) : "is-loading"}
      aria-busy={!ready || undefined}
      style={{ ...tint(style.color), "--i": Math.min(index, 8) } as CSSProperties}
    >
      <Card className={`p-card${project.url ? " is-link" : ""}`} {...linkProps}>
        <span className={`p-cover${project.thumbnail ? " has-image" : ""}`}>
          {project.thumbnail ? (
            <Image
              className="p-shot"
              src={project.thumbnail}
              alt=""
              fill
              sizes="(min-width: 1024px) 320px, 100vw"
              unoptimized={isRemote(project.thumbnail)}
              onLoad={onThumbDone}
              onError={onThumbDone}
            />
          ) : (
            <span className="p-cover-art" aria-hidden="true">
              <Icon name={style.icon} size={96} />
            </span>
          )}
          <span className="p-cover-tag">
            <Icon name={style.icon} size={14} />
            <span className="p-cover-tag-text">{CATEGORY_BY_ID[project.category].label}</span>
          </span>
          {project.metric && (
            // Key numbers live behind an icon; hovering (or focusing the card) reveals them.
            <span className="p-metric-pin">
              <span className="p-metric-ic" aria-hidden="true">
                <Icon name="chart" size={15} />
              </span>
              <span className="p-metric-tip" role="tooltip">
                <MetricText text={project.metric} />
              </span>
            </span>
          )}
        </span>
        <span className="p-body">
          {project.company && (
            <span className="p-company">
              <Icon name="briefcase" size={13} />
              {project.company}
            </span>
          )}
          <strong className="p-name">{project.name}</strong>
          <span className="p-desc" onMouseEnter={markClamped}>
            <span className="p-tagline">{project.description}</span>
            <span className="p-desc-tip" aria-hidden="true">
              {project.description}
            </span>
          </span>
          <span className="p-stack">
            {project.stack.slice(0, 2).map((s, i) => (
              <span key={i}>{s}</span>
            ))}
            {extra > 0 && (
              // Hover lists the rest of the stack that the chips leave out.
              <span className="is-more">
                +{extra}
                <span className="more-tip" role="tooltip">
                  {project.stack.slice(2).join(", ")}
                </span>
              </span>
            )}
            {project.url && (
              <span className="is-link">
                <Icon name="globe" size={12} />
                {hostOf(project.url)}
              </span>
            )}
          </span>
        </span>
      </Card>
    </li>
  );
}

export function ProjectsView({ item }: { item: StageItem }) {
  const [category, setCategory] = useState<ProjectCategory | "all">("all");

  const visible = category === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === category);
  const counts: Record<string, number> = { all: PROJECTS.length };
  for (const p of PROJECTS) counts[p.category] = (counts[p.category] ?? 0) + 1;
  // Only categories that have projects get a tab.
  const used = new Set(PROJECTS.map((p) => p.category));

  return (
    <CollectionShell
      item={item}
      stats={null}
      filters={
        <FilterChips
          label="Filter projects by area"
          options={CATEGORIES.filter((c) => used.has(c.id))}
          value={category}
          onChange={setCategory}
          counts={counts}
        />
      }
    >
      <ul className="g-grid p-grid">
        {visible.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </ul>
    </CollectionShell>
  );
}

/* ------------------------------------------------------------ Publications */

const rankClass = (rank: string) => `rank rank-${rank === "A*" ? "astar" : rank.toLowerCase()}`;

// Within a year, papers run from the strongest venue down; unranked ones go last.
const RANK_ORDER = ["A*", "A", "Q1", "B", "C"];
const rankWeight = (rank: string) => (rank ? RANK_ORDER.indexOf(rank) : RANK_ORDER.length);

function PublicationCard({ pub, index }: { pub: Publication; index: number }) {
  // The whole card links to the paper's DOI; without one it is plain content.
  const Card = pub.doi ? "a" : "div";
  const linkProps = pub.doi ? { href: `https://doi.org/${pub.doi}`, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <li style={{ ...tint("var(--p-accent)"), "--i": Math.min(index, 8) } as CSSProperties}>
      <Card className={`pub-card${pub.doi ? " is-link" : ""}`} {...linkProps}>
        <span className="pub-card-top">
          {pub.rank && <span className={rankClass(pub.rank)}>{pub.rank}</span>}
          <span className="pub-venue">{pub.venue || pub.kind}</span>
        </span>
        <strong className="pub-title">{pub.title}</strong>
        <span className="pub-card-foot">
          {pub.firstAuthor ? (
            <span className="pub-flag is-first">1st author</span>
          ) : (
            <span className="pub-flag">Co-author</span>
          )}
          {/* Drafts already say so in the venue slot; submissions need the flag. */}
          {pub.venue && !isPublished(pub) && <span className="pub-flag is-status">{pub.kind}</span>}
        </span>
      </Card>
    </li>
  );
}

export function PublicationsView({ item }: { item: StageItem }) {
  const published = PUBLICATIONS.filter(isPublished);
  const years = [...new Set(PUBLICATIONS.map((p) => p.year))].sort((a, b) => b - a);

  let i = 0;
  return (
    <CollectionShell
      item={item}
      stats={[
        { value: published.length, label: "Papers" },
        { value: published.filter((p) => p.firstAuthor).length, label: "First-author" },
        { value: published.filter((p) => p.rank === "A*" || p.rank === "A").length, label: "CORE A*/A" },
        { value: published.filter((p) => p.rank === "Q1").length, label: "Q1 journals" },
      ]}
      filters={null}
    >
      {years.map((year) => (
        <GalleryGroup key={year} title={year}>
          {PUBLICATIONS.filter((p) => p.year === year)
            .sort((a, b) => rankWeight(a.rank) - rankWeight(b.rank))
            .map((p) => (
            <PublicationCard key={p.id} pub={p} index={i++} />
          ))}
        </GalleryGroup>
      ))}
    </CollectionShell>
  );
}

/* --------------------------------------------------------------- Tech stack */

/** Brand mark from the shared SVG sprite, or a monogram when there is none. */
function ToolIcon({ name }: { name: string }) {
  const icon = TOOL_ICONS[name];
  if (!icon) {
    return (
      <span className="tool-ic is-mono" aria-hidden="true">
        {name
          .replace(/[^A-Za-z0-9]/g, "")
          .charAt(0)
          .toUpperCase()}
      </span>
    );
  }
  if ("img" in icon) {
    return (
      <span className="tool-ic is-img" aria-hidden="true">
        <img src={icon.img} alt="" width={18} height={18} loading="lazy" decoding="async" />
      </span>
    );
  }
  if ("line" in icon) {
    return (
      <span className="tool-ic is-line" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <use href={`/assets/tool-icons.svg#${icon.line}`} />
        </svg>
      </span>
    );
  }
  return (
    <span className="tool-ic" aria-hidden="true" style={{ "--ic-l": icon.light, "--ic-d": icon.dark } as CSSProperties}>
      <svg viewBox="0 0 24 24" width="15" height="15">
        <use href={`/assets/tool-icons.svg#${icon.id}`} />
      </svg>
    </span>
  );
}

export function StackView({ item }: { item: StageItem }) {
  // Nothing is picked at first: the panel shows the knowledge graph.
  const [activeId, setActiveId] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = STACK.find((g) => g.id === activeId) ?? null;
  const all = STACK.flatMap((g) => g.tools);

  // Vertical tablist keyboard model: arrows move and select, Home/End jump.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = active ? STACK.indexOf(active) : -1;
    const last = STACK.length - 1;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? i === last
          ? 0
          : i + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? i <= 0
            ? last
            : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setActiveId(STACK[next].id);
    tabRefs.current[STACK[next].id]?.focus();
  };

  // Keep the chosen area visible in the sidebar (and in the phone's swipe row).
  useEffect(() => {
    if (activeId) tabRefs.current[activeId]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <CollectionShell
      item={item}
      stats={[
        { value: all.length, label: "Tools & Services" },
        { value: STACK.length, label: "Areas" },
        { value: STACK.find((g) => g.id === "llms")?.tools.length ?? 0, label: "LLMs & model APIs" },
      ]}
      filters={null}
    >
      <div className="stack-split">
        <div
          className="stack-nav"
          role="tablist"
          aria-label="Tech Stack areas"
          aria-orientation="vertical"
          onKeyDown={onKey}
        >
          {STACK.map((g, gi) => {
            const selected = g.id === active?.id;
            return (
              <button
                key={g.id}
                ref={(el) => {
                  tabRefs.current[g.id] = el;
                }}
                id={`stack-tab-${g.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="stack-panel"
                tabIndex={selected || (!active && gi === 0) ? 0 : -1}
                className="stack-nav-item"
                style={tint(g.color)}
                onClick={() => setActiveId(g.id)}
              >
                <i aria-hidden="true" />
                {g.label}
              </button>
            );
          })}
        </div>

        {active ? (
          <section
            key={active.id}
            id="stack-panel"
            className="stack-panel"
            role="tabpanel"
            aria-labelledby={`stack-tab-${active.id}`}
            style={tint(active.color)}
          >
            <header className="stack-head">
              <button type="button" className="stack-back" onClick={() => setActiveId(null)}>
                <Icon name="back" size={14} />
                Overview
              </button>
              <h3>{active.label}</h3>
              <small>{active.blurb}</small>
            </header>
            <ul className="stack-tools">
              {active.tools.map((t) => (
                <li key={t.name} title={t.detail ? `${t.name} — ${t.detail}` : t.name}>
                  <ToolIcon name={t.name} />
                  <span className="tool-name">{t.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section id="stack-panel" className="stack-panel is-graph">
            <StackGraph onPick={setActiveId} />
          </section>
        )}
      </div>
    </CollectionShell>
  );
}

/* ------------------------------------------------------------- Achievements */

export function AchievementsView({ item }: { item: StageItem }) {
  const [kind, setKind] = useState<string>("all");

  const visible = kind === "all" ? ACHIEVEMENTS : ACHIEVEMENTS.filter((a) => a.kind === kind);
  const years = [...new Set(visible.map((a) => a.year))].sort((a, b) => b - a);

  const counts: Record<string, number> = { all: ACHIEVEMENTS.length };
  for (const a of ACHIEVEMENTS) counts[a.kind] = (counts[a.kind] ?? 0) + 1;
  // Stats count only what is done; goals still show in the filters and timeline.
  const done = ACHIEVEMENTS.filter((a) => !a.goal);
  const count = (id: string) => done.filter((a) => a.kind === id).length;

  return (
    <CollectionShell
      item={item}
      stats={[
        { value: count("certificate"), label: "Certificates" },
        { value: count("award"), label: "Awards" },
        { value: count("contest"), label: "Contests" },
        { value: count("conference") + count("community"), label: "Events" },
      ]}
      filters={
        <FilterChips
          label="Filter milestones by type"
          options={ACHIEVEMENT_KINDS}
          value={kind}
          onChange={setKind}
          counts={counts}
          hideEmpty
        />
      }
    >
      <ol className="timeline">
        {years.map((year) => (
          <li key={year} className="tl-year">
            <span className="tl-label">{year}</span>
            <ul>
              {visible
                .filter((a) => a.year === year)
                .sort((a, b) => Number(!!a.goal) - Number(!!b.goal))
                .map((a) => {
                  const k = KIND_BY_ID[a.kind];
                  return (
                    <li key={a.id} className={`tl-event${a.goal ? " is-goal" : ""}`} style={tint(k.color)}>
                      {a.logo ? (
                        <span className="tl-glyph is-logo" aria-hidden="true">
                          <Image
                            src={a.logo}
                            alt=""
                            width={22}
                            height={22}
                            unoptimized={isRemote(a.logo) || a.logo.endsWith(".svg")}
                          />
                        </span>
                      ) : (
                        <span className="tl-glyph" aria-hidden="true">
                          <Icon name={k.icon} size={16} />
                        </span>
                      )}
                      <span className="tl-text">
                        <strong>{a.name}</strong>
                        {a.goal && <span className="tl-goal">Goal</span>}
                        <small>{[k.label, a.detail].filter(Boolean).join(" · ")}</small>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </li>
        ))}
      </ol>
    </CollectionShell>
  );
}
