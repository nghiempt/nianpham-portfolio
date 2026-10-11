// Copy of the website's app/mind-map/mind-map.tsx (preview at /mind-map). Change it there first.
// Six fixed big branches around a petal "flower", two tones (01–03, 04–06).
// Each big branch holds sub-branches one level deep; a sub-branch opens a
// free-form note. Plain React + mind-map.css, so it can move to the mini app.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import "./mind-map.css";
import NoteEditor from "./note-editor";
import {
  connect,
  getMap,
  getServerMap,
  getServerSync,
  getSync,
  newId,
  READ_ONLY,
  setMap,
  startSync,
  subscribeMap,
  type Child,
  type MapData,
  type SyncState,
} from "./storage";

type Tone = 1 | 2;
type Branch = { id: string; title: string; tone: Tone };

const BRANCHES: Branch[] = [
  { id: "daily-conversation", title: "Daily Conversation Smooth", tone: 1 },
  { id: "ielts", title: "IELTS 7.0+", tone: 1 },
  { id: "professional-academic", title: "Professional Academic", tone: 1 },
  { id: "industry", title: "Industry", tone: 2 },
  { id: "academia", title: "Academia", tone: 2 },
  { id: "daily-life", title: "Daily Life & World", tone: 2 },
];

// Petal directions in degrees (screen coords, 0 = right, 90 = down).
// Tone 1 fans out on the left (top → bottom), tone 2 on the right.
const ANGLES = [240, 180, 120, 300, 0, 60];

const num = (i: number) => String(i + 1).padStart(2, "0");
const rad = (deg: number) => (deg * Math.PI) / 180;
// Rounded so server and browser render identical numbers (no hydration diff).
const polar = (deg: number, r: number, c = { x: 0, y: 0 }) => ({
  x: Math.round((c.x + Math.cos(rad(deg)) * r) * 100) / 100,
  y: Math.round((c.y + Math.sin(rad(deg)) * r) * 100) / 100,
});

/* ---------------------------------------------------------------- Flower */

// One petal pointing along +x: a rounded pentagon from the ring outwards.
const PETAL = "M64 -28 L124 -50 L166 0 L124 50 L64 28 Z";

function Flower({ onPick, active }: { onPick: (id: string) => void; active?: string | null }) {
  return (
    <svg className="mm-flower" viewBox="-215 -215 430 430" aria-hidden="true">
      <defs>
        <linearGradient id="mm-ring" x1="0" x2="1">
          <stop offset="0" stopColor="var(--mm-t1-side)" />
          <stop offset="1" stopColor="var(--mm-t2-side)" />
        </linearGradient>
      </defs>
      {/* Soft ground shadow, offset down-left like the reference */}
      <g className="mm-ground">
        {ANGLES.map((a, i) => (
          <path key={i} d={PETAL} transform={`translate(-22 26) rotate(${a})`} />
        ))}
      </g>
      <circle className="mm-ring" r="54" stroke="url(#mm-ring)" />
      {BRANCHES.map((b, i) => {
        const a = ANGLES[i];
        const label = polar(a, 140);
        const dot = polar(a, 98);
        return (
          <g
            key={b.id}
            className={`mm-petal is-t${b.tone}${active === b.id ? " is-active" : ""}`}
            onClick={() => onPick(b.id)}
          >
            <path className="mm-petal-side" d={PETAL} transform={`translate(5 8) rotate(${a})`} />
            <path className="mm-petal-face" d={PETAL} transform={`rotate(${a})`} />
            <text x={label.x} y={label.y} dy="0.35em" textAnchor="middle">
              {num(i)}
            </text>
            <circle className="mm-petal-dot" cx={dot.x} cy={dot.y} r="4.5" />
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------ Sub-branches */

function ChildChips({
  branch,
  items,
  onOpen,
  onAdd,
  align = "start",
}: {
  branch: Branch;
  items: Child[];
  onOpen: (c: Child) => void;
  onAdd: (title: string) => void;
  align?: "start" | "end";
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const title = draft.trim();
    if (title) onAdd(title);
    setDraft("");
    setAdding(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setDraft("");
      setAdding(false);
    }
  };

  return (
    <ul className={`mm-chips is-${align} is-t${branch.tone}`} aria-label={`${branch.title} sub-branches`}>
      {items.map((c) => (
        <li key={c.id}>
          <button type="button" className={`mm-chip${c.note || c.note2 ? " has-note" : ""}`} onClick={() => onOpen(c)}>
            {c.title}
          </button>
        </li>
      ))}
      {!READ_ONLY && (
        <li>
          {adding ? (
            <input
              className="mm-chip-input"
              autoFocus
              value={draft}
              placeholder="New branch…"
              aria-label={`New sub-branch of ${branch.title}`}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              onBlur={commit}
            />
          ) : (
            <button type="button" className="mm-chip is-add" onClick={() => setAdding(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              Add
            </button>
          )}
        </li>
      )}
    </ul>
  );
}

/* ---------------------------------------------------------------- Layouts */

// Desktop scene: pill columns either side of the flower. Each column grows
// with its sub-branches, so the links are drawn from the pills' measured
// positions rather than fixed rows.
const W = 1180; // scene width; the flower sits in the middle
const FLOWER = 430; // rendered size of the flower's 430-unit viewBox (1:1)
const ELBOW = 180; // distance from the centre to each link's vertical run

type Point = { x: number; y: number };

function elbow(a: Point, xm: number, b: Point) {
  if (Math.abs(a.y - b.y) < 1) return `M${a.x} ${a.y} H${b.x}`;
  const dir = Math.sign(b.x - a.x);
  const vy = Math.sign(b.y - a.y);
  const r = Math.min(14, Math.abs(b.y - a.y) / 2);
  return `M${a.x} ${a.y} H${xm - dir * r} Q${xm} ${a.y} ${xm} ${a.y + vy * r} V${b.y - vy * r} Q${xm} ${b.y} ${xm + dir * r} ${b.y} H${b.x}`;
}

type ViewProps = {
  data: MapData;
  onOpen: (b: Branch, c: Child) => void;
  onAdd: (b: Branch, title: string) => void;
};

function DesktopMap({ data, onOpen, onAdd }: ViewProps) {
  const [active, setActive] = useState<string | null>(null);
  const scene = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLElement | null)[]>([]);
  // Scene height and each pill's inner-edge midpoint, in scene px.
  const [geo, setGeo] = useState<{ h: number; ends: Point[] } | null>(null);

  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      if (!box.height) return; // hidden (narrow screens use the cards)
      const ends = BRANCHES.map((b, i) => {
        const r = pills.current[i]?.getBoundingClientRect();
        if (!r) return { x: 0, y: 0 };
        return {
          x: Math.round((b.tone === 1 ? r.right : r.left) - box.left),
          y: Math.round(r.top + r.height / 2 - box.top),
        };
      });
      setGeo({ h: Math.round(box.height), ends });
    };
    // Fires once on observe, then whenever a column grows or shrinks.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll(".mm-col").forEach((col) => ro.observe(col));
    return () => ro.disconnect();
  }, []);

  const node = (b: Branch, i: number) => {
    const left = b.tone === 1;
    const items = data[b.id] ?? [];
    return (
      <section
        key={b.id}
        className={`mm-node is-t${b.tone} is-${left ? "left" : "right"}${active === b.id ? " is-active" : ""}`}
        onMouseEnter={() => setActive(b.id)}
        onMouseLeave={() => setActive(null)}
      >
        <h2
          className="mm-pill"
          ref={(el) => {
            pills.current[i] = el;
          }}
        >
          <span className="mm-num">{num(i)}</span>
          {b.title}
          {items.length > 0 && <span className="mm-count">{items.length}</span>}
        </h2>
        <ChildChips
          branch={b}
          items={items}
          align={left ? "end" : "start"}
          onOpen={(c) => onOpen(b, c)}
          onAdd={(t) => onAdd(b, t)}
        />
      </section>
    );
  };

  const c = geo ? { x: W / 2, y: geo.h / 2 } : null;

  return (
    <div className="mm-scene" ref={scene} style={{ width: W }}>
      {geo && c && (
        <svg className="mm-links" viewBox={`0 0 ${W} ${geo.h}`} aria-hidden="true">
          {BRANCHES.map((b, i) => {
            const left = b.tone === 1;
            const end = geo.ends[i];
            return (
              <g key={b.id} className={`mm-link is-t${b.tone}${active === b.id ? " is-active" : ""}`}>
                <path d={elbow(polar(ANGLES[i], 98, c), c.x + (left ? -ELBOW : ELBOW), end)} />
                <circle cx={end.x} cy={end.y} r="4" />
              </g>
            );
          })}
        </svg>
      )}

      <div className="mm-col is-left">{BRANCHES.map((b, i) => (b.tone === 1 ? node(b, i) : null))}</div>
      <div className="mm-flower-wrap" style={{ width: FLOWER }}>
        <Flower active={active} onPick={(id) => setActive((v) => (v === id ? null : id))} />
      </div>
      <div className="mm-col is-right">{BRANCHES.map((b, i) => (b.tone === 2 ? node(b, i) : null))}</div>
    </div>
  );
}

function MobileMap({ data, onOpen, onAdd }: ViewProps) {
  const pick = (id: string) =>
    document.getElementById(`mm-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  return (
    <div className="mm-mobile">
      <div className="mm-flower-mobile">
        <Flower onPick={pick} />
      </div>
      <ol className="mm-cards">
        {BRANCHES.map((b, i) => {
          const items = data[b.id] ?? [];
          return (
            <li key={b.id} id={`mm-card-${b.id}`} className={`mm-card is-t${b.tone}`}>
              <header>
                <span className="mm-num-badge">{num(i)}</span>
                <h2>{b.title}</h2>
                {items.length > 0 && <span className="mm-count">{items.length}</span>}
              </header>
              <ChildChips branch={b} items={items} onOpen={(c) => onOpen(b, c)} onAdd={(t) => onAdd(b, t)} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------- Sync */

const SYNC_LABEL: Record<SyncState, string> = {
  local: READ_ONLY ? "Saved copy" : "This device only",
  syncing: "Syncing…",
  synced: "Synced",
  offline: "Offline",
  denied: READ_ONLY ? "No access" : "Wrong password",
};

/** Sync status; on the website it also asks for the password to turn sync on. */
function SyncBadge() {
  const state = useSyncExternalStore(subscribeMap, getSync, getServerSync);
  const [asking, setAsking] = useState(false);
  const [pass, setPass] = useState("");
  const canConnect = !READ_ONLY && (state === "local" || state === "denied");

  return (
    <div className={`mm-sync is-${state}`} role="status">
      <i aria-hidden="true" />
      <span>{SYNC_LABEL[state]}</span>
      {canConnect && !asking && (
        <button type="button" onClick={() => setAsking(true)}>
          Connect
        </button>
      )}
      {asking && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            connect(pass);
            setPass("");
            setAsking(false);
          }}
        >
          <input
            type="password"
            autoFocus
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            aria-label="Mind map password"
          />
          <button type="submit">OK</button>
        </form>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- Page */

function Sparkle({ style }: { style: CSSProperties }) {
  return (
    <svg className="mm-sparkle" style={style} width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function MindMap() {
  const data = useSyncExternalStore(subscribeMap, getMap, getServerMap);
  const [open, setOpen] = useState<{ branch: Branch; childId: string } | null>(null);

  // Fetch the server copy once the page is up (the local copy shows meanwhile).
  useEffect(() => startSync(), []);

  // Everything saves on its own; Cmd/Ctrl+S out of habit shouldn't download
  // the page. (Inside a note it also saves immediately; see note-editor.)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (branchId: string, fn: (list: Child[]) => Child[]) => {
    const current = getMap();
    setMap({ ...current, [branchId]: fn(current[branchId] ?? []) });
  };

  const add = (b: Branch, title: string) =>
    update(b.id, (list) => [...list, { id: newId(), title, note: "", updatedAt: Date.now() }]);

  const openChild = open ? (data[open.branch.id] ?? []).find((c) => c.id === open.childId) : undefined;

  return (
    <main className="mm">
      <div className="mm-band" aria-hidden="true" />
      <Sparkle style={{ left: "16%", top: 120 }} />
      <Sparkle style={{ left: "4%", bottom: 40 }} />
      <Sparkle style={{ left: "42%", bottom: 60 }} />

      <SyncBadge />
      <header className="mm-head">
        <h1>
          Mind <span>Map</span>
        </h1>
      </header>

      <DesktopMap data={data} onOpen={(branch, c) => setOpen({ branch, childId: c.id })} onAdd={add} />
      <MobileMap data={data} onOpen={(branch, c) => setOpen({ branch, childId: c.id })} onAdd={add} />

      {open && openChild && (
        <NoteEditor
          key={openChild.id}
          title={openChild.title}
          branchTitle={open.branch.title}
          tone={open.branch.tone}
          readOnly={READ_ONLY}
          note={openChild.note}
          note2={openChild.note2 ?? ""}
          onTitle={(title) =>
            update(open.branch.id, (list) =>
              list.map((c) => (c.id === openChild.id ? { ...c, title, updatedAt: Date.now() } : c)),
            )
          }
          onNote={(note, note2) =>
            update(open.branch.id, (list) =>
              list.map((c) => (c.id === openChild.id ? { ...c, note, note2, updatedAt: Date.now() } : c)),
            )
          }
          onDelete={() => {
            update(open.branch.id, (list) => list.filter((c) => c.id !== openChild.id));
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}
