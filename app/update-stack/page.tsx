import type { Metadata } from "next";
import UpdateStackView from "./update-stack-view";

// Personal review page. Unlisted: no window in the strip, not in the sitemap,
// not indexed. Reachable only by typing /update-stack.
export const metadata: Metadata = {
  title: "Update Stack",
  robots: { index: false, follow: false },
};

export default function UpdateStackPage() {
  return <UpdateStackView />;
}
