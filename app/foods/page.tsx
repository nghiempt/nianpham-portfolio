import type { Metadata } from "next";
import FoodsView from "./foods-view";

// Unlisted page: no window in the strip, not in the sitemap, not indexed.
// Reachable only by typing /foods.
export const metadata: Metadata = {
  title: "Foods",
  description: "Quán ăn yêu thích ở TP. Hồ Chí Minh.",
  robots: { index: false, follow: false },
};

export default function FoodsPage() {
  return <FoodsView />;
}
