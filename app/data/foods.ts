// Food places are edited in foods.json, either by hand or through the
// "Thêm địa điểm" popup on /foods (which posts to app/api/foods in dev).
// Images are plain URLs hosted elsewhere; nothing is uploaded here.
import raw from "./foods.json";

export type Food = {
  id: string;
  /** Place name, e.g. "Cơm Tấm Ba Ghiền". */
  name: string;
  /** Free text, e.g. "Cơm", "Phở"; cards with the same text share a filter tab. */
  category: string;
  address: string;
  /** Typical spend in VND, e.g. 190000. */
  price: number;
  /** Google Maps link that opens this place. */
  mapUrl: string;
  /** Cover image URL. */
  thumbnail: string;
  /** Extra image URLs, shown in the gallery popup. */
  images: string[];
};

export type FoodInput = Omit<Food, "id">;

const isUrl = (s: string) => /^https?:\/\/\S+$/.test(s);

/** A Google Maps search for the place, used when no map link is given. */
export const mapsSearchUrl = (name: string, address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;

export const formatPrice = (vnd: number) => `${vnd.toLocaleString("vi-VN")}đ`;

/** Lower-case ASCII slug, e.g. "Phở Lệ" → "pho-le". */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "place";

/** Trims and checks one place; returns the cleaned value or an error message. */
export function checkFood(input: Partial<Record<keyof FoodInput, unknown>>): FoodInput | string {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(input.name);
  const category = str(input.category);
  const address = str(input.address);
  const thumbnail = str(input.thumbnail);
  const price = typeof input.price === "number" ? input.price : Number(str(input.price).replace(/[.,\s]/g, ""));
  const images = (Array.isArray(input.images) ? input.images : []).map(str).filter(Boolean);
  const mapUrl = str(input.mapUrl) || mapsSearchUrl(name, address);

  if (!name) return "Tên địa điểm là bắt buộc";
  if (!category) return "Danh mục là bắt buộc";
  if (!address) return "Địa chỉ là bắt buộc";
  if (!Number.isFinite(price) || price < 0) return "Giá phải là số, ví dụ 190000";
  if (!isUrl(thumbnail)) return "Thumbnail phải là URL bắt đầu bằng http(s)://";
  const badImage = images.find((u) => !isUrl(u));
  if (badImage) return `Hình phụ không phải URL hợp lệ: ${badImage}`;
  if (!isUrl(mapUrl)) return "Link Google Map phải là URL bắt đầu bằng http(s)://";

  return { name, category, address, price: Math.round(price), mapUrl, thumbnail, images };
}

export const FOODS: Food[] = raw.map((f, i) => {
  const checked = checkFood(f);
  if (typeof checked === "string") throw new Error(`foods.json[${i}] (${f.id ?? "no id"}): ${checked}`);
  return { id: f.id, ...checked };
});
