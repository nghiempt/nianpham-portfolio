"use client";

import Image from "next/image";
import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { CATEGORIES, CATEGORY_BY_ID, PROJECTS, type Project, type ProjectCategory } from "./data/projects";
import { isPublished, PUBLICATIONS, TOPIC_BY_ID, TOPICS, type Publication, type Topic } from "./data/publications";
import { ACHIEVEMENT_KINDS, ACHIEVEMENTS, KIND_BY_ID } from "./data/achievements";
import { STACK } from "./data/stack";
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
      {/* macOS-style segmented control: one track, the selected segment lifts */}
      <div className="seg" role="toolbar" aria-label={label}>
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

/** Flags a clamped description so its full-text tooltip only appears when text was cut. */
function markClamped(e: MouseEvent<HTMLElement>) {
  const text = e.currentTarget.firstElementChild as HTMLElement | null;
  if (text) e.currentTarget.dataset.clamped = String(text.scrollHeight > text.clientHeight + 1);
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const style = CATEGORY_BY_ID[project.category];
  const extra = project.stack.length - 2;
  // The whole card links to the live project; without a URL it is plain content.
  const Card = project.url ? "a" : "div";
  const linkProps = project.url ? { href: project.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <li style={{ ...tint(style.color), "--i": Math.min(index, 8) } as CSSProperties}>
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

const YEARS = [2022, 2023, 2024, 2025, 2026];
const CATEGORY_ICONS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon])) as Record<
  ProjectCategory,
  IconName
>;

/** Year facet: every year 2022–2026 with its count; empty years stay visible but disabled. */
function YearFilter({
  value,
  onChange,
  counts,
}: {
  value: number | "all";
  onChange: (v: number | "all") => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="seg seg-years" role="toolbar" aria-label="Filter projects by year">
      {(["all", ...[...YEARS].reverse()] as const).map((y) => {
        const n = y === "all" ? counts.all : (counts[y] ?? 0);
        return (
          <button
            key={y}
            type="button"
            className="seg-btn"
            aria-pressed={value === y}
            disabled={y !== "all" && n === 0}
            onClick={() => onChange(y)}
          >
            {y === "all" ? "All years" : y}
            <span className="seg-count">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ProjectsView({ item }: { item: StageItem }) {
  const [category, setCategory] = useState<ProjectCategory | "all">("all");
  const [year, setYear] = useState<number | "all">("all");

  const inYear = year === "all" ? PROJECTS : PROJECTS.filter((p) => p.year === year);
  const inCategory = category === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === category);
  const visible = inYear.filter((p) => category === "all" || p.category === category);

  // Faceted counts: each filter counts within the other's current selection.
  const catCounts: Record<string, number> = { all: inYear.length };
  for (const p of inYear) catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  const yearCounts: Record<string, number> = { all: inCategory.length };
  for (const p of inCategory) if (p.year !== null) yearCounts[p.year] = (yearCounts[p.year] ?? 0) + 1;
  // Which categories exist at all, so tabs don't appear and vanish as the year changes.
  const used = new Set(PROJECTS.map((p) => p.category));

  return (
    <CollectionShell
      item={item}
      stats={null}
      filters={
        <div className="toolbar">
          <FilterChips
            label="Filter projects by area"
            options={CATEGORIES.filter((c) => used.has(c.id))}
            value={category}
            onChange={setCategory}
            counts={catCounts}
            icons={{ all: "grid", ...CATEGORY_ICONS }}
          />
          <YearFilter value={year} onChange={setYear} counts={yearCounts} />
        </div>
      }
    >
      {visible.length === 0 ? (
        <p className="g-empty">No projects match these filters.</p>
      ) : (
        <ul className="g-grid p-grid">
          {visible.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </ul>
      )}
    </CollectionShell>
  );
}

/* ------------------------------------------------------------ Publications */

const rankClass = (rank: string) => `rank rank-${rank === "A*" ? "astar" : rank.toLowerCase()}`;
const isSelf = (author: string) => /nghiem/i.test(author);

function authorLine(p: Publication) {
  const n = p.authors.length;
  if (!n) return p.firstAuthor ? "Lead author" : "Co-author";
  const pos = p.authors.findIndex(isSelf) + 1;
  return pos === 1 ? `Lead author · ${n} authors` : `Co-author · ${n} authors`;
}

function PublicationCard({ pub, index }: { pub: Publication; index: number }) {
  const style = TOPIC_BY_ID[pub.topic];
  // The whole card links to the paper's DOI; without one it is plain content.
  const Card = pub.doi ? "a" : "div";
  const linkProps = pub.doi
    ? { href: `https://doi.org/${pub.doi}`, target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <li style={{ ...tint(style.color), "--i": Math.min(index, 8) } as CSSProperties}>
      <Card className={`pub-card${pub.doi ? " is-link" : ""}`} {...linkProps}>
        <span className="pub-card-top">
          {pub.rank && <span className={rankClass(pub.rank)}>{pub.rank}</span>}
          <span className="pub-venue">{pub.venue || pub.kind}</span>
        </span>
        <strong className="pub-title">{pub.title}</strong>
        <span className="pub-card-foot">
          <span className="pub-topic">
            <Icon name={style.icon} size={13} />
            {style.label}
          </span>
          {pub.firstAuthor ? (
            <span className="pub-flag is-first">1st author</span>
          ) : (
            <span className="pub-flag">{authorLine(pub).split(" · ")[1] ?? "Co-author"}</span>
          )}
          {/* Drafts already say so in the venue slot; submissions need the flag. */}
          {pub.venue && !isPublished(pub) && <span className="pub-flag is-status">{pub.kind}</span>}
        </span>
      </Card>
    </li>
  );
}

export function PublicationsView({ item }: { item: StageItem }) {
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [firstOnly, setFirstOnly] = useState(false);

  const published = PUBLICATIONS.filter(isPublished);
  const visible = PUBLICATIONS.filter((p) => (topic === "all" || p.topic === topic) && (!firstOnly || p.firstAuthor));

  const counts: Record<string, number> = { all: PUBLICATIONS.length };
  for (const p of PUBLICATIONS) counts[p.topic] = (counts[p.topic] ?? 0) + 1;

  const years = [...new Set(visible.map((p) => p.year))].sort((a, b) => b - a);

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
      filters={
        <FilterChips
          label="Filter publications by topic"
          options={TOPICS}
          value={topic}
          onChange={setTopic}
          counts={counts}
          extra={
            <button
              type="button"
              className="chip chip-toggle"
              aria-pressed={firstOnly}
              onClick={() => setFirstOnly((v) => !v)}
            >
              <span className="chip-check" aria-hidden="true">
                {firstOnly && <Icon name="check" size={11} />}
              </span>
              First-author only
            </button>
          }
        />
      }
    >
      {visible.length === 0 && <p className="g-empty">No papers match these filters.</p>}
      {years.map((year) => (
        <GalleryGroup key={year} title={year}>
          {visible
            .filter((p) => p.year === year)
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
        {name.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span
      className="tool-ic"
      aria-hidden="true"
      style={{ "--ic-l": icon.light, "--ic-d": icon.dark } as CSSProperties}
    >
      <svg viewBox="0 0 24 24" width="15" height="15">
        <use href={`/assets/tool-icons.svg#${icon.id}`} />
      </svg>
    </span>
  );
}

export function StackView({ item }: { item: StageItem }) {
  const all = STACK.flatMap((g) => g.tools);

  return (
    <CollectionShell
      item={item}
      stats={[
        { value: all.length, label: "Tools & services" },
        { value: STACK.length, label: "Areas" },
        { value: STACK.find((g) => g.id === "llms")?.tools.length ?? 0, label: "LLMs & model APIs" },
      ]}
      filters={null}
    >
      <ul className="stack-board">
        {STACK.map((g, i) => (
          <li key={g.id} className="stack-card" style={{ ...tint(g.color), "--i": Math.min(i, 8) } as CSSProperties}>
            <header className="stack-head">
              <h3>{g.label}</h3>
              <small>{g.blurb}</small>
            </header>
            <ul className="stack-tools">
              {g.tools.map((t) => (
                <li key={t.name} title={t.detail ? `${t.name} — ${t.detail}` : t.name}>
                  <ToolIcon name={t.name} />
                  <span className="tool-text">
                    <span className="tool-name">{t.name}</span>
                    {t.detail && <span className="tool-detail">{t.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
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
  const count = (id: string) => counts[id] ?? 0;

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
          icons={{ all: "grid", ...Object.fromEntries(ACHIEVEMENT_KINDS.map((k) => [k.id, k.icon])) }}
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
                .map((a) => {
                  const k = KIND_BY_ID[a.kind];
                  return (
                    <li key={a.id} className="tl-event" style={tint(k.color)}>
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
