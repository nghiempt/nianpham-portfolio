"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/publications", label: "Publications" }
];

function navClass(isActive: boolean) {
  return isActive
    ? "font-headline relative text-sm font-bold uppercase tracking-tight text-[#ddb7ff] after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#ddb7ff]"
    : "font-headline text-sm font-bold uppercase tracking-tight text-[#cec3d3] transition-colors duration-300 hover:text-[#ddb7ff]";
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav fixed top-0 z-50 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <Link
          href="/"
          className="font-headline text-xl font-extrabold tracking-tighter text-[#ebdef1]"
        >
          Portfolio
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className={navClass(isActive)}>
                {item.label}
              </Link>
            );
          })}
        </div>
        <a
          href="mailto:nianpham.reed@gmail.com"
          className="scale-95 text-[#ddb7ff] transition-transform active:scale-90"
          aria-label="Email"
        >
          <span className="material-symbols-outlined">mail</span>
        </a>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-[#4c4451]/15 bg-[#17111d] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 md:flex-row">
        <span className="font-body text-xs uppercase tracking-widest text-[#978d9d]">
          © 2026 Nianverse. All rights reserved.
        </span>
        <div className="flex gap-8">
          <a
            className="font-body text-xs uppercase tracking-widest text-[#978d9d] opacity-80 transition-all duration-200 hover:text-[#ebdef1] hover:opacity-100"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="font-body text-xs uppercase tracking-widest text-[#978d9d] opacity-80 transition-all duration-200 hover:text-[#ebdef1] hover:opacity-100"
            href="#"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
