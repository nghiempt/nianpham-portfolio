"use client";

// One-column rich-text box for the /update-stack notes, with the same toolbar
// as the mind map's note editor (contentEditable + execCommand). Uncontrolled:
// it reports HTML through onChange and is cleared through the `reset` key.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ALIGNS, BLOCKS, ColorMenu, escapeHtml, FONTS, I, ICONS, Menu } from "../mind-map/note-editor";
import "../mind-map/mind-map.css";

export type RichNoteHandle = { clear: () => void };

/** True when the editor holds nothing worth saving. */
export const isBlankHtml = (html: string) => {
  if (/<(img|hr|li)\b/i.test(html)) return false;
  return !html.replace(/<[^>]*>/g, "").replace(/&nbsp;|​/g, "").trim();
};

type Props = {
  placeholder: string;
  onChange: (html: string) => void;
  /** Ctrl/⌘ + Enter. */
  onSubmit: () => void;
};

const RichNote = forwardRef<RichNoteHandle, Props>(function RichNote({ placeholder, onChange, onSubmit }, ref) {
  const editor = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);
  const [empty, setEmpty] = useState(true);
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, block: "p", font: "Arial", size: 16 });
  const [align, setAlign] = useState("Start Align");
  const [colors, setColors] = useState({ fore: "#111827", hilite: "#fde68a" });
  const [link, setLink] = useState<string | null>(null);

  const changed = useCallback(() => {
    const html = editor.current?.innerHTML ?? "";
    setEmpty(isBlankHtml(html));
    onChange(html);
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    clear() {
      if (editor.current) editor.current.innerHTML = "";
      saved.current = null;
      changed();
    },
  }));

  useEffect(() => {
    document.execCommand("styleWithCSS", false, "true");
  }, []);

  const refresh = useCallback(() => {
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount || !editor.current?.contains(sel.anchorNode)) return;
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
    const el = editor.current;
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
    const el = editor.current!;
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
    <div className="us-rich">
      <div className="mm-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className="mm-tb-btn" onMouseDown={keep} onClick={() => exec("undo")} aria-label="Undo">
          <I d={ICONS.undo} />
        </button>
        <button type="button" className="mm-tb-btn" onMouseDown={keep} onClick={() => exec("redo")} aria-label="Redo">
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
          <select value={fmt.block} onChange={(e) => exec("formatBlock", `<${e.target.value}>`)} aria-label="Text style">
            {BLOCKS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <i className="mm-tb-sep" />

        <button type="button" className="mm-tb-btn" onMouseDown={keep} onClick={() => setSize(fmt.size - 1)} aria-label="Smaller text">
          <I d={ICONS.minus} />
        </button>
        <span className="mm-tb-size" aria-label="Font size">
          {fmt.size}
        </span>
        <button type="button" className="mm-tb-btn" onMouseDown={keep} onClick={() => setSize(fmt.size + 1)} aria-label="Bigger text">
          <I d={ICONS.plus} />
        </button>
        <i className="mm-tb-sep" />

        <button type="button" className="mm-tb-btn" aria-pressed={fmt.bold} onMouseDown={keep} onClick={() => exec("bold")} aria-label="Bold">
          <I d={ICONS.bold} />
        </button>
        <button type="button" className="mm-tb-btn" aria-pressed={fmt.italic} onMouseDown={keep} onClick={() => exec("italic")} aria-label="Italic">
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
        <ColorMenu
          label="Text color"
          icon={<I d={ICONS.color} />}
          value={colors.fore}
          resetLabel="Default color"
          onPick={(c) => {
            setColors((v) => ({ ...v, fore: c ?? "#111827" }));
            exec("foreColor", c ?? "#111827");
          }}
        />
        <ColorMenu
          label="Highlight color"
          icon={<I d={ICONS.highlight} />}
          value={colors.hilite}
          resetLabel="No highlight"
          onPick={(c) => {
            if (c) setColors((v) => ({ ...v, hilite: c }));
            exec("hiliteColor", c ?? "transparent");
          }}
        />
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
          label=""
          icon={<I d={ICONS.page} />}
          items={[
            { label: "Clear formatting", onPick: () => exec("removeFormat") },
            {
              label: "Copy as text",
              onPick: () => navigator.clipboard?.writeText(editor.current?.innerText ?? "").catch(() => {}),
            },
            {
              label: "Clear note",
              danger: true,
              onPick: () => {
                if (editor.current) editor.current.innerHTML = "";
                changed();
              },
            },
          ]}
        />
      </div>

      {link !== null && (
        <form
          className="mm-linkbar"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste or type a link…" aria-label="Link URL" />
          <button type="submit">Apply</button>
          <button type="button" onClick={() => setLink(null)}>
            Cancel
          </button>
        </form>
      )}

      <div
        ref={editor}
        className={`mm-editor us-rich-editor${empty ? " is-empty" : ""}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Note"
        data-placeholder={placeholder}
        onInput={changed}
        onPaste={onPaste}
        onKeyUp={refresh}
        onMouseUp={refresh}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
    </div>
  );
});

export default RichNote;
