import type { Metadata } from "next";
import MindMap from "./mind-map";

// Personal mind map. Unlisted: no window in the strip, not in the sitemap,
// not indexed. Reachable only by typing /mind-map.
export const metadata: Metadata = {
  title: "Mind Map",
  robots: { index: false, follow: false },
};

export default function MindMapPage() {
  return <MindMap />;
}
