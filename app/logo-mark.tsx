import Image from "next/image";

// The animated "N" logo (white mark, green trail running round the orbits).
// It stands in for the first letter of the name, both in the intro and on the
// About title, so it is sized in em; see .logo-mark in globals.css.
export default function LogoMark({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      className="logo-mark"
      src="/assets/logo-green-transparent.gif"
      alt=""
      aria-hidden="true"
      width={499}
      height={500}
      // Served as-is so the GIF keeps animating.
      unoptimized
      priority={priority}
      draggable={false}
    />
  );
}
