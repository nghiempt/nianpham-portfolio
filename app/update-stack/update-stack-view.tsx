"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import CV from "../data/cv.json";
import { CATEGORY_BY_ID, PROJECTS, type Project } from "../data/projects";
import { STACK } from "../data/stack";
import { OWNER } from "../profiles";
import { Clock, DEFAULT_WALLPAPER, readWallpaper, subscribeWallpaper, WallpaperPicker, writeWallpaper } from "../stage-manager";
import { Icon } from "../ui";
import RichNote, { isBlankHtml, type RichNoteHandle } from "./rich-note";

// Read-only overview of the data the portfolio and CV already hold, plus a
// daily notes log for what needs updating. Same desktop shell as /foods.
const ACCENT = "#0f766e";

const TABS = [
  { id: "effort", label: "Effort" },
  { id: "stack", label: "Tech stack" },
  { id: "skills", label: "Core skills (CV)" },
  { id: "projects", label: "All projects" },
  { id: "cv", label: "Projects (CV)" },
  { id: "notes", label: "Notes" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ---------------------------------------------------------------- Notes */

type Note = { id: string; text: string; createdAt: number };
type Sync = "local" | "syncing" | "synced" | "offline" | "denied";

const NOTES_KEY = "nianpham:update-stack:notes:v1";
// Shared with /mind-map: connecting there also syncs notes here.
const PASS_KEY = "nianpham:mind-map:password";
const API = "/api/stack-notes";

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

function readLocalNotes(): Note[] {
  try {
    const parsed: unknown = JSON.parse(store.get(NOTES_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    return [];
  }
}

const SYNC_LABEL: Record<Sync, string> = {
  local: "Chỉ lưu trên trình duyệt này",
  syncing: "Đang đồng bộ…",
  synced: "Đã đồng bộ",
  offline: "Không kết nối được server — đang lưu tạm trên máy",
  denied: "Sai mật khẩu",
};

function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sync, setSync] = useState<Sync>("local");
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<Note[]>([]);

  const push = useCallback(async () => {
    const pass = store.get(PASS_KEY);
    if (!pass) return setSync("local");
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { Authorization: `Bearer ${pass}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: latest.current }),
      });
      setSync(res.ok ? "synced" : res.status === 401 ? "denied" : "offline");
    } catch {
      setSync("offline");
    }
  }, []);

  const pull = useCallback(async () => {
    const pass = store.get(PASS_KEY);
    if (!pass) return setSync("local");
    setSync("syncing");
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${pass}` }, cache: "no-store" });
      if (res.status === 401) return setSync("denied");
      if (!res.ok) return setSync("offline");
      const body: { notes: Note[] | null } = await res.json();
      if (Array.isArray(body.notes)) {
        latest.current = body.notes;
        setNotes(body.notes);
        store.set(NOTES_KEY, JSON.stringify(body.notes));
        setSync("synced");
      } else {
        await push();
      }
    } catch {
      setSync("offline");
    }
  }, [push]);

  useEffect(() => {
    latest.current = readLocalNotes();
    setNotes(latest.current);
    void pull();
  }, [pull]);

  const save = useCallback(
    (next: Note[]) => {
      latest.current = next;
      setNotes(next);
      store.set(NOTES_KEY, JSON.stringify(next));
      if (!store.get(PASS_KEY)) return;
      window.clearTimeout(timer.current);
      setSync("syncing");
      timer.current = window.setTimeout(push, 600);
    },
    [push],
  );

  const connect = useCallback(
    (password: string) => {
      store.set(PASS_KEY, password.trim() || null);
      void pull();
    },
    [pull],
  );

  const disconnect = useCallback(() => {
    store.set(PASS_KEY, null);
    setSync("local");
  }, []);

  return { notes, sync, save, connect, disconnect, connected: sync !== "local" };
}

const dayKey = (t: number) => new Date(t).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
const timeOf = (t: number) => new Date(t).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

function NotesPanel() {
  const { notes, sync, save, connect, disconnect, connected } = useNotes();
  const [draft, setDraft] = useState("");
  const editorRef = useRef<RichNoteHandle>(null);
  const [pass, setPass] = useState("");

  const add = () => {
    if (isBlankHtml(draft)) return;
    save([{ id: crypto.randomUUID(), text: draft, createdAt: Date.now() }, ...notes]);
    editorRef.current?.clear();
  };

  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);
  const days: [string, Note[]][] = [];
  for (const n of sorted) {
    const k = dayKey(n.createdAt);
    const last = days[days.length - 1];
    if (last && last[0] === k) last[1].push(n);
    else days.push([k, [n]]);
  }

  return (
    <div className="us-notes">
      <div className="us-card us-compose">
        <RichNote
          ref={editorRef}
          placeholder="Hôm nay cần cập nhật gì? (Ctrl/⌘ + Enter để lưu)"
          onChange={setDraft}
          onSubmit={add}
        />
        <div className="us-compose-foot">
          <span className={`us-sync is-${sync}`}>{SYNC_LABEL[sync]}</span>
          <button type="button" className="f-btn" onClick={add} disabled={isBlankHtml(draft)}>
            Lưu note
          </button>
        </div>
        {connected ? (
          <button type="button" className="us-link" onClick={disconnect}>
            Ngắt đồng bộ trên trình duyệt này
          </button>
        ) : (
          <form
            className="us-connect"
            onSubmit={(e) => {
              e.preventDefault();
              connect(pass);
              setPass("");
            }}
          >
            <input
              className="us-input"
              type="password"
              placeholder="Mật khẩu mind map để đồng bộ giữa các máy"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />
            <button type="submit" className="f-btn is-ghost" disabled={!pass.trim()}>
              Kết nối
            </button>
          </form>
        )}
      </div>

      {days.length === 0 ? (
        <p className="f-empty">Chưa có note nào.</p>
      ) : (
        days.map(([day, list]) => (
          <section key={day} className="us-day">
            <h3 className="us-h3">{day}</h3>
            <ul className="us-list">
              {list.map((n) => (
                <li key={n.id} className="us-card us-note">
                  <div className="us-note-head">
                    <time>{timeOf(n.createdAt)}</time>
                    <button
                      type="button"
                      className="us-link"
                      onClick={() => {
                        if (window.confirm("Xoá note này?")) save(notes.filter((x) => x.id !== n.id));
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                  {/<[a-z][\s\S]*>/i.test(n.text) ? (
                    <div className="mm-editor us-note-html" dangerouslySetInnerHTML={{ __html: n.text }} />
                  ) : (
                    <p className="us-note-text">{n.text}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Panels */

const Chips = ({ items }: { items: string[] }) => (
  <ul className="us-chips">
    {items.map((s) => (
      <li key={s}>{s}</li>
    ))}
  </ul>
);

function countBy<T>(items: T[], key: (t: T) => string[]) {
  const m = new Map<string, number>();
  for (const it of items) for (const k of key(it)) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function EffortPanel() {
  return (
    <div className="us-stack">
      {CV.experience.map((e) => (
        <article key={e.company} className="us-card">
          <header className="us-card-head">
            <div>
              <h3 className="us-h3">
                {e.role}
                {e.type && <span className="us-meta"> · {e.type}</span>}
              </h3>
              <p className="us-meta">
                <em>{e.company}</em> · {e.location}
              </p>
            </div>
            <span className="us-meta">{e.period}</span>
          </header>
          <ul className="us-bullets">
            {e.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function StackPanel() {
  const count = STACK.reduce((s, g) => s + g.tools.length, 0);
  return (
    <div className="us-stack">
      <p className="us-note-muted">
        {STACK.length} nhóm · {count} công cụ (app/data/stack.json).
      </p>
      {STACK.map((g) => (
        <article key={g.id} className="us-card">
          <header className="us-card-head">
            <div>
              <h3 className="us-h3">{g.label}</h3>
              <p className="us-meta">{g.blurb}</p>
            </div>
            <span className="us-meta">{g.tools.length}</span>
          </header>
          <ul className="us-tools">
            {g.tools.map((t) => (
              <li key={t.name}>
                <strong>{t.name}</strong>
                {t.detail && <span>{t.detail}</span>}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function SkillsPanel() {
  return (
    <div className="us-stack">
      {CV.coreSkills.map((c) => (
        <article key={c.name} className="us-card">
          <h3 className="us-h3">{c.name}</h3>
          <p className="us-text">{c.items}</p>
        </article>
      ))}
    </div>
  );
}

function ProjectsPanel() {
  const [company, setCompany] = useState("all");
  const [q, setQ] = useState("");
  const companies = useMemo(() => countBy(PROJECTS, (p) => [p.company || "—"]), []);
  const query = q.trim().toLowerCase();
  const visible = PROJECTS.filter(
    (p) =>
      (company === "all" || (p.company || "—") === company) &&
      (!query || [p.name, p.description, p.metric, ...p.stack].join(" ").toLowerCase().includes(query)),
  );
  return (
    <div className="us-stack">
      <div className="us-toolbar">
        <div className="seg" role="toolbar" aria-label="Lọc theo công ty">
          {[["all", PROJECTS.length] as [string, number], ...companies].map(([c, n]) => (
            <button key={c} type="button" className="seg-btn" aria-pressed={company === c} onClick={() => setCompany(c)}>
              {c === "all" ? "All" : c}
              <span className="seg-count">{n}</span>
            </button>
          ))}
        </div>
        <input className="us-input us-search" placeholder="Tìm tên, mô tả, tech…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {visible.length === 0 && <p className="f-empty">Không có dự án nào khớp.</p>}
      {visible.map((p: Project) => (
        <article key={p.id} className="us-card">
          <header className="us-card-head">
            <div>
              <h3 className="us-h3">{p.name}</h3>
              <p className="us-meta">
                {[p.company, p.year, CATEGORY_BY_ID[p.category]?.label].filter(Boolean).join(" · ")}
              </p>
            </div>
            {p.url && (
              <a className="us-link" href={p.url} target="_blank" rel="noreferrer">
                Mở <Icon name="external" size={12} />
              </a>
            )}
          </header>
          <p className="us-text">{p.description}</p>
          {p.metric && <p className="us-metric">{p.metric}</p>}
          {p.stack.length > 0 && <Chips items={p.stack} />}
        </article>
      ))}
    </div>
  );
}

function CvPanel() {
  return (
    <ul className="us-tools us-cv-projects">
      {CV.projects.map((p) => (
        <li key={p.name}>
          <strong>{p.name}</strong>
          <span>{p.category}</span>
          <em>{p.link}</em>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------- Page */

export default function UpdateStackView() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const wallpaper = useSyncExternalStore(subscribeWallpaper, readWallpaper, () => DEFAULT_WALLPAPER);
  const [tab, setTab] = useState<TabId>("effort");

  const changeWallpaper = useCallback((id: string) => {
    const apply = () => {
      if (desktopRef.current) desktopRef.current.dataset.wallpaper = id;
      writeWallpaper(id);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduced) document.startViewTransition(apply);
    else apply();
  }, []);

  return (
    <div className="desktop" ref={desktopRef} data-wallpaper={wallpaper}>
      <div className="wp-motion" aria-hidden="true">
        <i className="wp-blob b-a" />
        <i className="wp-blob b-b" />
        <i className="wp-blob b-c" />
        <i className="wp-blob b-d" />
        <i className="wp-sheen" />
      </div>
      <h1 className="sr-only">Update Stack — {OWNER.name}</h1>

      <header className="menubar">
        <div className="mb-left">
          <Image className="mb-logo" src="/assets/new-logo-v2.png" alt="" aria-hidden="true" width={20} height={20} />
          <strong>{OWNER.nickname}</strong>
          <span className="mb-role">{OWNER.role}</span>
        </div>
        <div className="mb-right">
          <WallpaperPicker value={wallpaper} onChange={changeWallpaper} />
          <Clock />
        </div>
      </header>

      <main className="stage f-stage">
        <div className="viewport">
          <section className="window is-foods" style={{ "--p-accent": ACCENT } as CSSProperties}>
            <header className="titlebar">
              <div className="traffic" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="address">
                <Icon name="lock" size={12} />
                <span>nghiemthanhpham.com/update-stack</span>
              </div>
              <div className="tb-actions" />
            </header>

            <div className="window-body is-collection">
              <div className="collection">
                <header className="col-head">
                  <div className="col-intro">
                    <p className="eyebrow">
                      <i aria-hidden="true" />
                      Chỉ xem
                    </p>
                    <h2>Update Stack</h2>
                    <p className="col-desc">Dữ liệu đang có trong portfolio và CV, kèm nhật ký những gì cần cập nhật.</p>
                  </div>
                </header>

                <div className="chips">
                  <div className="seg" role="toolbar" aria-label="Mục">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="seg-btn"
                        aria-pressed={tab === t.id}
                        onClick={() => setTab(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gallery us-body">
                  {tab === "effort" && <EffortPanel />}
                  {tab === "stack" && <StackPanel />}
                  {tab === "skills" && <SkillsPanel />}
                  {tab === "projects" && <ProjectsPanel />}
                  {tab === "cv" && <CvPanel />}
                  {tab === "notes" && <NotesPanel />}
                </div>
              </div>
            </div>

            <footer className="statusbar">
              <span>
                {PROJECTS.length} dự án · {STACK.reduce((s, g) => s + g.tools.length, 0)} công cụ · Update Stack
              </span>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
