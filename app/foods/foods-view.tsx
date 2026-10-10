"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { FOODS, formatPrice, mapsSearchUrl, type Food } from "../data/foods";
import { OWNER } from "../profiles";
import {
  Clock,
  DEFAULT_WALLPAPER,
  readWallpaper,
  subscribeWallpaper,
  WallpaperPicker,
  writeWallpaper,
} from "../stage-manager";
import { Icon } from "../ui";

// Same desktop, menubar and window chrome as the collection pages, but with a
// single window and no strip: /foods is unlisted and only reached by URL.
const ACCENT = "#c2410c";

/* Line icons this page needs that app/ui.tsx doesn't have. */
const Svg = ({ size = 16, children }: { size?: number; children: ReactNode }) => (
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
    {children}
  </svg>
);
const PlusIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const CloseIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);
const ImagesIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </Svg>
);
const ChevronIcon = ({ dir, size }: { dir: "left" | "right"; size?: number }) => (
  <Svg size={size}>
    <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
  </Svg>
);

/** Native <dialog> opened as a modal while `open` is true; Esc and backdrop clicks close it. */
function Modal({
  open,
  onClose,
  className,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  className: string;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`f-dialog ${className}`}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}

/* ----------------------------------------------------------------- Card */

function FoodCard({ food, index, onGallery }: { food: Food; index: number; onGallery: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <li style={{ "--c": ACCENT, "--i": Math.min(index, 8) } as CSSProperties}>
      <article className="p-card is-link f-card">
        <span className={`p-cover f-cover${broken ? "" : " has-image"}`}>
          {broken ? (
            <span className="f-cover-fallback" aria-hidden="true">
              {food.name.charAt(0)}
            </span>
          ) : (
            <img
              className="p-shot"
              src={food.thumbnail}
              alt={food.name}
              loading={index < 6 ? "eager" : "lazy"}
              decoding="async"
              onError={() => setBroken(true)}
            />
          )}
          <span className="p-cover-tag">
            <span className="p-cover-tag-text">{food.category}</span>
          </span>
          {food.images.length > 0 && (
            <button
              type="button"
              className="f-more"
              onClick={onGallery}
              aria-label={`Xem ${food.images.length} hình của ${food.name}`}
              title="Xem thêm hình"
            >
              <ImagesIcon size={14} />
              {food.images.length}
            </button>
          )}
        </span>
        <span className="p-body">
          <strong className="p-name">{food.name}</strong>
          <span className="f-addr">
            <Icon name="pin" size={14} />
            <span>{food.address}</span>
          </span>
          <span className="f-foot">
            <span className="f-price">
              {formatPrice(food.price)}
              <small>/người</small>
            </span>
            <a
              className="f-map"
              href={food.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Mở ${food.name} trên Google Maps`}
            >
              <Icon name="map" size={14} />
              Maps
            </a>
          </span>
        </span>
      </article>
    </li>
  );
}

/* -------------------------------------------------------------- Gallery */

function Gallery({ food, onClose }: { food: Food | null; onClose: () => void }) {
  return (
    <Modal open={!!food?.images.length} onClose={onClose} className="f-gallery" label={`Hình của ${food?.name ?? ""}`}>
      {/* Keyed so each place opens on its first image */}
      {food && <GalleryBody key={food.id} food={food} onClose={onClose} />}
    </Modal>
  );
}

function GalleryBody({ food, onClose }: { food: Food; onClose: () => void }) {
  const [i, setI] = useState(0);
  const images = food.images;
  const n = images.length;
  const go = (step: number) => setI((v) => (v + step + n) % n);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  return (
      <div className="f-gallery-inner" onKeyDown={onKey}>
        <header className="f-dialog-head">
          <strong>{food.name}</strong>
          <span className="f-gallery-count">
            {i + 1} / {n}
          </span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <CloseIcon size={18} />
          </button>
        </header>
        <div className="f-gallery-stage">
          <img key={images[i]} src={images[i]} alt={`${food.name} — hình ${i + 1}`} />
          {n > 1 && (
            <>
              <button type="button" className="f-nav is-prev" onClick={() => go(-1)} aria-label="Hình trước">
                <ChevronIcon dir="left" size={20} />
              </button>
              <button type="button" className="f-nav is-next" onClick={() => go(1)} aria-label="Hình sau">
                <ChevronIcon dir="right" size={20} />
              </button>
            </>
          )}
        </div>
        {n > 1 && (
          <ul className="f-strip">
            {images.map((src, k) => (
              <li key={src + k}>
                <button
                  type="button"
                  aria-label={`Hình ${k + 1}`}
                  aria-current={k === i || undefined}
                  onClick={() => setI(k)}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
  );
}

/* ------------------------------------------------------------- Add form */

const EMPTY = { name: "", category: "", district: "", street: "", price: "", mapUrl: "", thumbnail: "", images: "" };

// HCMC districts by the old (pre-2025) administrative map, from the public
// provinces.open-api.vn v1 API. The built-in list is used if it can't be reached.
const DISTRICTS_API = "https://provinces.open-api.vn/api/v1/p/79?depth=2";
const FALLBACK_DISTRICTS = [
  "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Quận Bình Tân", "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú",
  "Thành phố Thủ Đức", "Huyện Bình Chánh", "Huyện Cần Giờ", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Nhà Bè",
];
// "Quận 1", "Quận 3" … "Quận 12" first, then named districts, then outer huyện.
const districtRank = (d: string) => (/^Quận \d/.test(d) ? 0 : d.startsWith("Quận") ? 1 : d.startsWith("Thành phố") ? 2 : 3);
const sortDistricts = (list: string[]) =>
  [...list].sort((a, b) => districtRank(a) - districtRank(b) || a.localeCompare(b, "vi", { numeric: true }));

let districtsRequest: Promise<string[]> | null = null;
function loadDistricts() {
  districtsRequest ??= fetch(DISTRICTS_API)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { districts: { name: string }[] }) => sortDistricts(d.districts.map((x) => x.name)))
    .catch(() => {
      districtsRequest = null;
      return sortDistricts(FALLBACK_DISTRICTS);
    });
  return districtsRequest;
}

const composeAddress = (street: string, district: string) =>
  street.trim() && district ? `${street.trim()}, ${district}, TP. Hồ Chí Minh` : "";

function AddFoodDialog({
  open,
  categories,
  onClose,
  onAdded,
}: {
  open: boolean;
  categories: string[];
  onClose: () => void;
  onAdded: (food: Food) => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  // Pick an existing category, or switch to typing a new one.
  const [newCategory, setNewCategory] = useState(categories.length === 0);
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (open) loadDistricts().then(setDistricts);
  }, [open]);

  const price = Number(form.price.replace(/[.,\s]/g, ""));
  const address = composeAddress(form.street, form.district);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          address,
          mapUrl: form.mapUrl,
          thumbnail: form.thumbnail,
          price: form.price,
          images: form.images.split(/\s*\n\s*/).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
      onAdded(data.food);
      setForm(EMPTY);
      setNewCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setError("");
        onClose();
      }}
      className="f-add"
      label="Thêm địa điểm"
    >
      <form className="f-form" onSubmit={submit}>
        <header className="f-dialog-head">
          <strong>Thêm địa điểm</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <CloseIcon size={18} />
          </button>
        </header>
        <div className="f-form-body">
          <label className="f-field is-wide">
            <span>Tên địa điểm *</span>
            <input required value={form.name} onChange={set("name")} placeholder="Cơm tấm Nguyễn Văn Cừ" />
          </label>
          <div className="f-field">
            <label htmlFor="food-category">Danh mục *</label>
            <div className="f-combo">
              {newCategory ? (
                <input
                  id="food-category"
                  required
                  autoFocus
                  value={form.category}
                  onChange={set("category")}
                  placeholder="Tên danh mục mới, ví dụ: Lẩu"
                />
              ) : (
                <select id="food-category" required value={form.category} onChange={set("category")}>
                  <option value="" disabled>
                    Chọn danh mục
                  </option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              {(categories.length > 0 || !newCategory) && (
                <button
                  type="button"
                  className="f-btn is-ghost is-small"
                  onClick={() => {
                    setNewCategory((v) => !v);
                    setForm((f) => ({ ...f, category: "" }));
                  }}
                  title={newCategory ? "Chọn danh mục có sẵn" : "Tạo danh mục mới"}
                >
                  {newCategory ? (
                    "Có sẵn"
                  ) : (
                    <>
                      <PlusIcon size={14} />
                      Mới
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <label className="f-field">
            <span>
              Giá (VND) *{form.price && Number.isFinite(price) && <em>{formatPrice(price)}</em>}
            </span>
            <input required inputMode="numeric" value={form.price} onChange={set("price")} placeholder="190000" />
          </label>
          <label className="f-field">
            <span>Quận / Huyện *</span>
            <select required value={form.district} onChange={set("district")}>
              <option value="" disabled>
                {districts.length ? "Chọn quận" : "Đang tải…"}
              </option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="f-field">
            <span>Số nhà, tên đường *</span>
            <input required value={form.street} onChange={set("street")} placeholder="1 Nguyễn Văn Cừ" />
          </label>
          <label className="f-field is-wide">
            <span>Link Google Map</span>
            <input
              type="url"
              value={form.mapUrl}
              onChange={set("mapUrl")}
              placeholder={
                form.name && address ? mapsSearchUrl(form.name, address) : "Để trống sẽ tự tạo từ tên + địa chỉ"
              }
            />
          </label>
          <label className="f-field is-wide">
            <span>Thumbnail URL *</span>
            <input required type="url" value={form.thumbnail} onChange={set("thumbnail")} placeholder="https://…" />
          </label>
          {/^https?:\/\//.test(form.thumbnail) && (
            <img className="f-preview" src={form.thumbnail} alt="Xem trước thumbnail" />
          )}
          <label className="f-field is-wide">
            <span>Hình phụ (mỗi dòng 1 URL)</span>
            <textarea rows={3} value={form.images} onChange={set("images")} placeholder={"https://…\nhttps://…"} />
          </label>
          {error && (
            <p className="f-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="f-form-foot">
          <button type="button" className="f-btn is-ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="f-btn" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu địa điểm"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------- Page */

export default function FoodsView() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const wallpaper = useSyncExternalStore(subscribeWallpaper, readWallpaper, () => DEFAULT_WALLPAPER);
  const [foods, setFoods] = useState<Food[]>(FOODS);
  const [category, setCategory] = useState("all");
  const [gallery, setGallery] = useState<Food | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

  const changeWallpaper = useCallback((id: string) => {
    const apply = () => {
      if (desktopRef.current) desktopRef.current.dataset.wallpaper = id;
      writeWallpaper(id);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduced) document.startViewTransition(apply);
    else apply();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const categories = [...new Set(foods.map((f) => f.category))];
  const counts: Record<string, number> = { all: foods.length };
  for (const f of foods) counts[f.category] = (counts[f.category] ?? 0) + 1;
  const visible = category === "all" ? foods : foods.filter((f) => f.category === category);

  return (
    <div className="desktop" ref={desktopRef} data-wallpaper={wallpaper}>
      <div className="wp-motion" aria-hidden="true">
        <i className="wp-blob b-a" />
        <i className="wp-blob b-b" />
        <i className="wp-blob b-c" />
        <i className="wp-blob b-d" />
        <i className="wp-sheen" />
      </div>
      <h1 className="sr-only">Foods — {OWNER.name}</h1>

      <header className="menubar">
        <div className="mb-left">
          <span className="mb-logo" aria-hidden="true">
            N
          </span>
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
                <span>nianpham.my/foods</span>
              </div>
              <div className="tb-actions" />
            </header>

            <div className="window-body is-collection">
              <div className="collection">
                <header className="col-head">
                  <div className="col-intro">
                    <p className="eyebrow">
                      <i aria-hidden="true" />
                      Ăn gì ở Sài Gòn
                    </p>
                    <h2>Foods</h2>
                    <p className="col-desc">Những quán ăn quen ở TP. Hồ Chí Minh.</p>
                  </div>
                  <button type="button" className="f-btn f-add-btn" onClick={() => setAdding(true)}>
                    <PlusIcon size={16} />
                    Thêm địa điểm
                  </button>
                </header>

                <div className="chips">
                  <div className="seg" role="toolbar" aria-label="Lọc theo danh mục">
                    {["all", ...categories].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="seg-btn"
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                      >
                        {c === "all" ? "All" : c}
                        <span className="seg-count">{counts[c] ?? 0}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gallery">
                  {visible.length ? (
                    <ul className="g-grid p-grid">
                      {visible.map((f, i) => (
                        <FoodCard key={f.id} food={f} index={i} onGallery={() => setGallery(f)} />
                      ))}
                    </ul>
                  ) : (
                    <p className="f-empty">Chưa có địa điểm nào.</p>
                  )}
                </div>
              </div>
            </div>

            <footer className="statusbar">
              <span>{foods.length} địa điểm · Foods</span>
            </footer>
          </section>
        </div>
      </main>

      <Gallery food={gallery} onClose={() => setGallery(null)} />
      <AddFoodDialog
        open={adding}
        categories={categories}
        onClose={() => setAdding(false)}
        onAdded={(food) => {
          setFoods((list) => [food, ...list.filter((f) => f.id !== food.id)]);
          setCategory("all");
          setAdding(false);
          setToast({ text: `Đã thêm ${food.name} vào foods.json`, key: Date.now() });
        }}
      />

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
