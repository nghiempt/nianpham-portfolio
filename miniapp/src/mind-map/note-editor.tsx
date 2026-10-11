// Copy of the website's app/mind-map/note-editor.tsx (preview at /mind-map). Change it there first.
// Full-size note popup for a sub-branch: a rich-text editor (contentEditable +
// execCommand, which every browser and the Zalo WebView still support) with a
// toolbar modelled on Google Docs-style editors. Saves as you type.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const FONTS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS"];
const BLOCKS = [
  { value: "p", label: "Normal" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "blockquote", label: "Quote" },
];
const ALIGNS = [
  { cmd: "justifyLeft", label: "Start Align" },
  { cmd: "justifyCenter", label: "Center Align" },
  { cmd: "justifyRight", label: "End Align" },
  { cmd: "justifyFull", label: "Justify" },
];

// Side padding of the writing area, remembered per browser.
const PADDINGS = [
  { label: "Tight", px: 12 },
  { label: "Comfortable", px: 24 },
  { label: "Roomy", px: 48 },
  { label: "Wide", px: 80 },
];
const PAD_KEY = "nianpham:mind-map:padding";
const readPad = () => {
  try {
    const v = Number(localStorage.getItem(PAD_KEY));
    if (PADDINGS.some((p) => p.px === v)) return v;
  } catch {}
  return 24;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/* Line icons for the toolbar */
const I = ({ d, size = 18 }: { d: ReactNode; size?: number }) => (
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
    {d}
  </svg>
);
const ICONS = {
  undo: <path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" />,
  redo: <path d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" />,
  font: <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
  para: <path d="M4 6h16M4 12h16M4 18h10" />,
  bold: <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />,
  italic: <path d="M19 4h-9M14 20H5M15 4 9 20" />,
  underline: <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />,
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  link: <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8" />,
  color: <path d="m6 16 6-12 6 12M8.5 11h7" />,
  highlight: <path d="m9 11-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  align: <path d="M3 4v16M7 6h14M7 12h10M7 18h12" />,
  page: <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />,
  padding: <path d="M3 3h18v18H3zM9 3v18M15 3v18" />,
};

/** Dropdown whose items keep the editor's selection (mousedown is cancelled). */
function Menu({
  label,
  icon,
  items,
  wide,
}: {
  label: ReactNode;
  icon?: ReactNode;
  items: { label: string; onPick: () => void; danger?: boolean }[];
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Fixed to the viewport, placed under the trigger and kept on screen: the
  // toolbar scrolls sideways on phones, so CSS alone would put it off-screen.
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const toggle = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 220)) });
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="mm-menu" ref={ref}>
      <button
        type="button"
        className={`mm-tb-btn is-text${wide ? " is-wide" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        {icon}
        {label}
        <I d={ICONS.chevron} size={14} />
      </button>
      {open && (
        <div className="mm-menu-list" role="menu" style={pos}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={it.danger ? "is-danger" : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                it.onPick();
                setOpen(false);
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  title: string;
  branchTitle: string;
  tone: 1 | 2;
  /** Left and right columns, as editor HTML. */
  note: string;
  note2: string;
  onTitle: (title: string) => void;
  onNote: (note: string, note2: string) => void;
  onDelete: () => void;
  onClose: () => void;
  /** View only (the mini app): no toolbar, no editing, no delete. */
  readOnly?: boolean;
};

const isBlank = (el: HTMLElement | null) => !el || (!el.textContent?.trim() && !el.querySelector("img, hr, li"));

export default function NoteEditor({
  title,
  branchTitle,
  tone,
  note,
  note2,
  onTitle,
  onNote,
  onDelete,
  onClose,
  readOnly = false,
}: Props) {
  // Two independent columns; the toolbar acts on whichever was used last.
  const editors = useRef<(HTMLDivElement | null)[]>([null, null]);
  const active = useRef(0);
  const cur = () => editors.current[active.current];
  const saved = useRef<Range | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [status, setStatus] = useState<"saved" | "saving">("saved");
  const [empty, setEmpty] = useState([!note, !note2]);
  const [pad, setPad] = useState(readPad);
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, block: "p", font: "Arial", size: 16 });
  const [align, setAlign] = useState("Start Align");
  const [colors, setColors] = useState({ fore: "#111827", hilite: "#fde68a" });
  const [link, setLink] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ---- persistence ---- */
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    if (readOnly) return;
    const [a, b] = editors.current;
    if (a && b) onNote(a.innerHTML, b.innerHTML);
    setStatus("saved");
  }, [onNote, readOnly]);

  const changed = useCallback(() => {
    setEmpty(editors.current.map(isBlank));
    setStatus("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 500);
  }, [flush]);

  const close = useCallback(() => {
    flush();
    onClose();
  }, [flush, onClose]);

  // Load the note once; the editor is uncontrolled after that.
  useEffect(() => {
    const [a, b] = editors.current;
    if (a) a.innerHTML = note;
    if (b) b.innerHTML = note2;
    if (readOnly) return;
    document.execCommand("styleWithCSS", false, "true");
    a?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, []);

  // Esc closes; the page behind doesn't scroll.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [close]);

  /* ---- selection + toolbar state ---- */
  const columnOf = (n: Node | null) => (n ? editors.current.findIndex((el) => el?.contains(n)) : -1);

  const refresh = useCallback(() => {
    const sel = document.getSelection();
    const col = sel && sel.rangeCount ? columnOf(sel.anchorNode) : -1;
    if (!sel || col < 0) return;
    active.current = col;
    saved.current = sel.getRangeAt(0).cloneRange();
    const node = sel.anchorNode;
    const el = node instanceof Element ? node : node?.parentElement;
    const block = String(document.queryCommandValue("formatBlock") || "p").toLowerCase();
    const font = String(document.queryCommandValue("fontName") || "Arial")
      .replace(/["']/g, "")
      .split(",")[0];
    setFmt({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      block: BLOCKS.some((b) => b.value === block) ? block : "p",
      font: FONTS.includes(font) ? font : "Arial",
      size: el ? Math.round(parseFloat(getComputedStyle(el).fontSize)) || 16 : 16,
    });
    const a = ALIGNS.find((x) => document.queryCommandState(x.cmd));
    if (a) setAlign(a.label);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, [refresh]);

  const restore = () => {
    const el = cur();
    if (!el) return;
    el.focus();
    const sel = document.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  };

  const exec = (cmd: string, value?: string) => {
    restore();
    document.execCommand(cmd, false, value);
    changed();
    refresh();
  };

  const setSize = (n: number) => {
    const size = Math.min(72, Math.max(8, n));
    setFmt((f) => ({ ...f, size }));
    restore();
    if (document.getSelection()?.isCollapsed) return;
    // execCommand only knows sizes 1–7: mark with 7, then swap in real pixels.
    document.execCommand("fontSize", false, "7");
    const el = cur()!;
    el.querySelectorAll<HTMLElement>('span[style*="xxx-large"]').forEach((s) => (s.style.fontSize = `${size}px`));
    el.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    changed();
  };

  const selectedText = () => (saved.current ? saved.current.toString() : "");

  const transformCase = (fn: (s: string) => string) => {
    const text = selectedText();
    if (text) exec("insertText", fn(text));
  };

  const applyLink = () => {
    let url = (link ?? "").trim();
    setLink(null);
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) url = `https://${url}`;
    if (selectedText()) exec("createLink", url);
    else exec("insertHTML", `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>&nbsp;`);
  };

  // Pasted content comes in as plain text: no foreign styles or markup.
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    changed();
  };

  const keep = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="mm-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={`mm-note is-t${tone}`} role="dialog" aria-modal="true" aria-label={`${title} notes`}>
        <header className="mm-note-head">
          <span className="mm-note-branch">{branchTitle}</span>
          <input
            className="mm-note-title"
            readOnly={readOnly}
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            aria-label="Branch name"
          />
          {!readOnly && (
            <span className="mm-note-status" aria-live="polite">
              {status === "saving" ? "Saving…" : "Saved"}
            </span>
          )}
          {!readOnly && (
            <button
              type="button"
              className={`mm-icon-btn${confirmDelete ? " is-danger" : ""}`}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              onBlur={() => setConfirmDelete(false)}
              title={confirmDelete ? "Click again to delete" : "Delete branch"}
              aria-label={confirmDelete ? "Confirm delete branch" : "Delete branch"}
            >
              <I d={ICONS.trash} />
              {confirmDelete && <span>Delete?</span>}
            </button>
          )}
          <button type="button" className="mm-icon-btn" onClick={close} aria-label="Close">
            <I d={ICONS.close} size={20} />
          </button>
        </header>

        {!readOnly && (
          <div className="mm-toolbar" role="toolbar" aria-label="Formatting">
            <button
              type="button"
              className="mm-tb-btn"
              onMouseDown={keep}
              onClick={() => exec("undo")}
              aria-label="Undo"
            >
              <I d={ICONS.undo} />
            </button>
            <button
              type="button"
              className="mm-tb-btn"
              onMouseDown={keep}
              onClick={() => exec("redo")}
              aria-label="Redo"
            >
              <I d={ICONS.redo} />
            </button>
            <i className="mm-tb-sep" />

            <label className="mm-tb-select is-font">
              <I d={ICONS.font} />
              <select value={fmt.font} onChange={(e) => exec("fontName", e.target.value)} aria-label="Font">
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <i className="mm-tb-sep" />
            <label className="mm-tb-select is-block">
              <I d={ICONS.para} />
              <select
                value={fmt.block}
                onChange={(e) => exec("formatBlock", `<${e.target.value}>`)}
                aria-label="Text style"
              >
                {BLOCKS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <i className="mm-tb-sep" />

            <button
              type="button"
              className="mm-tb-btn"
              onMouseDown={keep}
              onClick={() => setSize(fmt.size - 1)}
              aria-label="Smaller text"
            >
              <I d={ICONS.minus} />
            </button>
            <span className="mm-tb-size" aria-label="Font size">
              {fmt.size}
            </span>
            <button
              type="button"
              className="mm-tb-btn"
              onMouseDown={keep}
              onClick={() => setSize(fmt.size + 1)}
              aria-label="Bigger text"
            >
              <I d={ICONS.plus} />
            </button>
            <i className="mm-tb-sep" />

            <button
              type="button"
              className="mm-tb-btn"
              aria-pressed={fmt.bold}
              onMouseDown={keep}
              onClick={() => exec("bold")}
              aria-label="Bold"
            >
              <I d={ICONS.bold} />
            </button>
            <button
              type="button"
              className="mm-tb-btn"
              aria-pressed={fmt.italic}
              onMouseDown={keep}
              onClick={() => exec("italic")}
              aria-label="Italic"
            >
              <I d={ICONS.italic} />
            </button>
            <button
              type="button"
              className="mm-tb-btn"
              aria-pressed={fmt.underline}
              onMouseDown={keep}
              onClick={() => exec("underline")}
              aria-label="Underline"
            >
              <I d={ICONS.underline} />
            </button>
            <button
              type="button"
              className="mm-tb-btn"
              onMouseDown={keep}
              onClick={() => exec("insertHTML", `<code>${escapeHtml(selectedText()) || "&#8203;"}</code>`)}
              aria-label="Inline code"
            >
              <I d={ICONS.code} />
            </button>
            <button
              type="button"
              className="mm-tb-btn"
              aria-pressed={link !== null}
              onMouseDown={keep}
              onClick={() => setLink((v) => (v === null ? "" : null))}
              aria-label="Link"
            >
              <I d={ICONS.link} />
            </button>
            <label className="mm-tb-btn mm-tb-color" title="Text color" onMouseDown={() => refresh()}>
              <I d={ICONS.color} />
              <i style={{ background: colors.fore }} />
              <input
                type="color"
                value={colors.fore}
                onChange={(e) => {
                  setColors((c) => ({ ...c, fore: e.target.value }));
                  exec("foreColor", e.target.value);
                }}
                aria-label="Text color"
              />
            </label>
            <label className="mm-tb-btn mm-tb-color" title="Highlight" onMouseDown={() => refresh()}>
              <I d={ICONS.highlight} />
              <i style={{ background: colors.hilite }} />
              <input
                type="color"
                value={colors.hilite}
                onChange={(e) => {
                  setColors((c) => ({ ...c, hilite: e.target.value }));
                  exec("hiliteColor", e.target.value);
                }}
                aria-label="Highlight color"
              />
            </label>
            <Menu
              label="Aa"
              items={[
                { label: "UPPERCASE", onPick: () => transformCase((s) => s.toUpperCase()) },
                { label: "lowercase", onPick: () => transformCase((s) => s.toLowerCase()) },
                {
                  label: "Title Case",
                  onPick: () => transformCase((s) => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase())),
                },
                {
                  label: "Sentence case",
                  onPick: () => transformCase((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()),
                },
              ]}
            />
            <i className="mm-tb-sep" />
            <Menu
              label="Insert"
              icon={<I d={ICONS.plus} />}
              items={[
                { label: "Bulleted list", onPick: () => exec("insertUnorderedList") },
                { label: "Numbered list", onPick: () => exec("insertOrderedList") },
                { label: "Quote", onPick: () => exec("formatBlock", "<blockquote>") },
                { label: "Code block", onPick: () => exec("formatBlock", "<pre>") },
                { label: "Divider", onPick: () => exec("insertHorizontalRule") },
              ]}
            />
            <i className="mm-tb-sep" />
            <Menu
              label={align}
              icon={<I d={ICONS.align} />}
              wide
              items={ALIGNS.map((a) => ({
                label: a.label,
                onPick: () => {
                  setAlign(a.label);
                  exec(a.cmd);
                },
              }))}
            />
            <i className="mm-tb-sep" />
            <Menu
              label={PADDINGS.find((p) => p.px === pad)?.label ?? "Padding"}
              icon={<I d={ICONS.padding} />}
              items={PADDINGS.map((p) => ({
                label: `${p.label} · ${p.px}px`,
                onPick: () => {
                  setPad(p.px);
                  try {
                    localStorage.setItem(PAD_KEY, String(p.px));
                  } catch {}
                },
              }))}
            />
            <i className="mm-tb-sep" />
            <Menu
              label=""
              icon={<I d={ICONS.page} />}
              items={[
                { label: "Clear formatting", onPick: () => exec("removeFormat") },
                {
                  label: "Copy as text",
                  onPick: () =>
                    navigator.clipboard
                      ?.writeText(editors.current.map((el) => el?.innerText ?? "").join("\n\n"))
                      .catch(() => {}),
                },
                {
                  label: "Clear note",
                  danger: true,
                  onPick: () => {
                    editors.current.forEach((el) => el && (el.innerHTML = ""));
                    changed();
                  },
                },
              ]}
            />
          </div>
        )}

        {!readOnly && link !== null && (
          <form
            className="mm-linkbar"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <input
              autoFocus
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste or type a link…"
              aria-label="Link URL"
            />
            <button type="submit">Apply</button>
            <button type="button" onClick={() => setLink(null)}>
              Cancel
            </button>
          </form>
        )}

        <div className="mm-editor-scroll">
          <div className="mm-columns" style={{ "--mm-pad": `${pad}px` } as CSSProperties}>
            {[0, 1].map((col) => (
              <div
                key={col}
                ref={(el) => {
                  editors.current[col] = el;
                }}
                className={`mm-editor${empty[col] ? " is-empty" : ""}`}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label={`${title} notes, column ${col + 1}`}
                data-placeholder={
                  readOnly
                    ? col === 0
                      ? "No notes yet"
                      : ""
                    : col === 0
                      ? "Start writing your notes…"
                      : "Second column…"
                }
                onFocus={() => (active.current = col)}
                onInput={changed}
                onPaste={onPaste}
                onKeyUp={refresh}
                onMouseUp={refresh}
                onBlur={flush}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
