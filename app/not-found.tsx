import type { Metadata } from "next";
import Link from "next/link";
import { WINDOWS } from "./profiles";

export const metadata: Metadata = {
    title: "Page not found",
    robots: { index: false, follow: true },
};

const IMAGE_URL = "https://octodex.github.com/images/NUX_Octodex.gif";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ backgroundColor: "#fff" }}>
            <img
                src={IMAGE_URL}
                alt="404"
                className="w-72 object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1a1a1a" }}>
                404 — Page not found
            </h1>
            <Link
                href="/"
                className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-60"
                style={{ color: "#555" }}
            >
                Go back home
            </Link>
            <nav aria-label="Pages" className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: "#555" }}>
                {WINDOWS.filter((w) => w.path !== "/").map((w) => (
                    <Link key={w.id} href={w.path} className="underline-offset-4 hover:underline">
                        {w.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
