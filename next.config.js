/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Files in public/ are not content-hashed, so cache them for a month
    // (renaming a file, as the -v4 thumbs do, busts it sooner).
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

module.exports = nextConfig;
