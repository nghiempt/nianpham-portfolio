import Link from "next/link";

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
        </div>
    );
}
