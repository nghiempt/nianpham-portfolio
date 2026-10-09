import Image from "next/image";

// The animated "N" logo, an animated WebP (a quarter of the original GIF's size) (white mark, green trail running round the orbits).
// It stands in for the first letter of the name, both in the intro and on the
// About title, so it is sized in em; see .logo-mark in globals.css.
export default function LogoMark({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      className="logo-mark"
      src="/assets/logo-green-transparent.webp"
      alt=""
      aria-hidden="true"
      width={499}
      height={500}
      // Served as-is so it keeps animating.
      unoptimized
      priority={priority}
      draggable={false}
    />
  );
}
