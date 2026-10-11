// Copy of the website's app/mind-map/mind-map.tsx (preview at /mind-map). Change it there first.
// Six fixed big branches around a petal "flower", two tones (01–03, 04–06).
// Each big branch holds sub-branches one level deep; a sub-branch opens a
// free-form note. Plain React + mind-map.css, so it can move to the mini app.
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
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

// Desktop scene, in px. The flower sits in the middle; pills line up in rows.
const W = 1180;
const H = 660;
const C = { x: W / 2, y: 300 };
const FLOWER = 430; // rendered size of the flower's 430-unit viewBox (1:1)
const ROWS = [130, 300, 470];
const PILL_EDGE = 300; // distance from the centre to each pill column's inner edge
const ELBOW = 180;

function elbow(a: { x: number; y: number }, xm: number, b: { x: number; y: number }) {
  if (Math.abs(a.y - b.y) < 1) return `M${a.x} ${a.y} H${b.x}`;
  const dir = Math.sign(b.x - a.x);
  const vy = Math.sign(b.y - a.y);
  const r = 14;
  return `M${a.x} ${a.y} H${xm - dir * r} Q${xm} ${a.y} ${xm} ${a.y + vy * r} V${b.y - vy * r} Q${xm} ${b.y} ${xm + dir * r} ${b.y} H${b.x}`;
}

type ViewProps = {
  data: MapData;
  onOpen: (b: Branch, c: Child) => void;
  onAdd: (b: Branch, title: string) => void;
};

function DesktopMap({ data, onOpen, onAdd }: ViewProps) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="mm-scene" style={{ width: W, height: H }}>
      <svg className="mm-links" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {BRANCHES.map((b, i) => {
          const a = ANGLES[i];
          const left = b.tone === 1;
          const dot = polar(a, 98, C);
          const end = { x: C.x + (left ? -PILL_EDGE : PILL_EDGE), y: ROWS[i % 3] };
          const xm = C.x + (left ? -ELBOW : ELBOW);
          return (
            <g key={b.id} className={`mm-link is-t${b.tone}${active === b.id ? " is-active" : ""}`}>
              <path d={elbow(dot, xm, end)} />
              <circle cx={end.x} cy={end.y} r="4" />
            </g>
          );
        })}
      </svg>

      <div className="mm-flower-wrap" style={{ left: C.x - FLOWER / 2, top: C.y - FLOWER / 2, width: FLOWER }}>
        <Flower active={active} onPick={(id) => setActive((v) => (v === id ? null : id))} />
      </div>

      {BRANCHES.map((b, i) => {
        const left = b.tone === 1;
        const pos: CSSProperties = left
          ? { right: W - (C.x - PILL_EDGE), top: ROWS[i % 3] }
          : { left: C.x + PILL_EDGE, top: ROWS[i % 3] };
        const items = data[b.id] ?? [];
        return (
          <section
            key={b.id}
            className={`mm-node is-t${b.tone} is-${left ? "left" : "right"}${active === b.id ? " is-active" : ""}`}
            style={pos}
            onMouseEnter={() => setActive(b.id)}
            onMouseLeave={() => setActive(null)}
          >
            <h2 className="mm-pill">
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
      })}
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
