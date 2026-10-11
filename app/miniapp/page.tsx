import type { Metadata } from "next";
import Hub from "./hub";

// Preview of the Smart Insight Space Zalo Mini App UI. Unlisted: no window in
// the strip, not in the sitemap, not indexed. Reachable only by typing /miniapp.
export const metadata: Metadata = {
  title: "Smart Insight Space",
  robots: { index: false, follow: false },
};

export default function MiniAppPreviewPage() {
  return <Hub />;
}
