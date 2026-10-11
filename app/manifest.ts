import type { MetadataRoute } from "next";
import { OWNER } from "./profiles";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${OWNER.name} (${OWNER.nickname})`,
    short_name: OWNER.nickname,
    description: `${OWNER.name} — ${OWNER.role}`,
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
