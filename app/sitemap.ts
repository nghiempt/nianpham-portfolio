import type { MetadataRoute } from "next";
import { SITE_URL, WINDOWS } from "./profiles";

// Every window has its own page; the About window is the home page.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return WINDOWS.map((w) => ({
    url: w.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${w.path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: w.path === "/" ? 1 : 0.8,
  }));
}
