import Link from "next/link";
import { Footer, TopNav } from "@/components/site-chrome";
import portfolioContent from "@/data/portfolio-content.json";

const socials = [
  { iconSrc: "/assets/github.svg", label: "GitHub", url: "https://github.com/nghiempt" },
  { iconSrc: "/assets/scholar.svg", label: "Scholar", url: "https://scholar.google.com/citations?user=23NArXYAAAAJ" },
  { iconSrc: "/assets/facebook.svg", label: "Facebook", url: "https://www.facebook.com/nianpham.me" },
  { iconSrc: "/assets/linkedin.svg", label: "LinkedIn", url: "https://www.linkedin.com/in/nianpham" }
];

const explorationCards = portfolioContent.projects.slice(0, 4);
const featuredPublications = [...portfolioContent.publications]
  .sort((a, b) => Number(b.year) - Number(a.year))
  .slice(0, 4);

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main className="relative min-h-screen overflow-hidden pt-10">
        <div className="ambient-glow absolute right-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full" />
        <div className="ambient-glow absolute bottom-[10%] left-[-5%] h-[400px] w-[400px] rounded-full" />

        <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-16 px-8 py-16 md:flex-row md:gap-24 md:py-32">
          <div className="order-2 w-full md:order-1 md:w-1/2">
            <div className="group relative">
              <div className="luxury-gradient absolute -inset-1 blur-xl opacity-20 transition duration-1000 group-hover:opacity-40" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low">
                <img
                  alt="Professional Portrait"
                  className="h-full w-full object-cover transition-all duration-700"
                  src="https://res.cloudinary.com/farmcode/image/upload/v1774856006/other/nryttkceih8cof1hsyzt.png"
                />
              </div>
              <div className="absolute -right-4 bottom-6 flex items-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-highest px-6 py-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Available for collaborations
                </span>
              </div>
            </div>
          </div>

          <div className="order-1 w-full space-y-8 md:order-2 md:w-1/2">
            <div className="space-y-4">
              <span className="font-label text-xs uppercase tracking-[0.2em] text-primary">
                Introduction
              </span>
              <h1 className="font-headline text-5xl font-extrabold leading-[1.1] tracking-tighter text-on-surface md:text-7xl">
                Hi, I&apos;m <span className="italic text-primary">Nghiem</span>.
              </h1>
              <p className="max-w-lg font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
                AI Engineer with expertise in LLM systems, multi-agent architectures, and multimodal AI, backed by <strong className="text-primary">4 years of experience</strong> and <strong className="text-primary">20+ publications</strong>
              </p>
              <p className="max-w-lg font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
                Lead AI teams and delivered production-grade solutions for enterprise clients in finance, healthcare, and media.
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4">
              {socials.map((social) => (
                <a key={social.url} className="group flex flex-col items-center gap-2" href={social.url} target="_blank">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-on-surface text-on-surface-variant transition-all duration-300 group-hover:bg-surface-container-highest group-hover:text-primary">
                    <img
                      alt={`${social.label} icon`}
                      className="h-6 w-6 object-contain"
                      src={social.iconSrc}
                    />
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
                    {social.label}
                  </span>
                </a>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/publications"
                className="luxury-gradient rounded-full px-8 py-4 font-headline text-sm font-bold tracking-tight text-on-primary-fixed transition-all hover:scale-100 active:scale-95"
              >
                View Research
              </Link>
              <Link
                href="/projects"
                className="rounded-full border border-outline-variant/30 px-8 py-4 font-headline text-sm font-bold tracking-tight text-on-surface transition-all hover:bg-surface-container-high"
              >
                Read Projects
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16">
              <h2 className="font-headline text-3xl font-bold tracking-tight">Select Explorations</h2>
              <div className="mt-2 h-1 w-12 bg-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {explorationCards.map((card) =>
                <div
                  key={card.title}
                  className="group relative overflow-hidden rounded-xl bg-surface-container-high p-1 transition-all duration-500 hover:bg-surface-container-highest md:col-span-2"
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <img
                      alt={card.title}
                      className="h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
                      src={card.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <span className="mb-2 font-bold block font-label text-xs uppercase tracking-widest text-primary">
                        {card.category}
                      </span>
                      <h3 className="mb-2 font-headline md:text-2xl font-bold">{card.title}</h3>
                      <p className="max-w-md font-body text-sm text-on-surface-variant">
                        {card.homeDescription || card.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">Hot Publications</h2>
                <div className="mt-2 h-1 w-12 bg-primary" />
              </div>
              <Link
                href="/publications"
                className="font-label text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:text-on-surface"
              >
                View all publications
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featuredPublications.map((publication) => (
                <article
                  key={`${publication.year}-${publication.title}`}
                  className="flex h-full flex-col justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all duration-300 hover:border-primary/30 hover:bg-surface-container-high"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <span className="font-headline text-2xl font-bold text-primary/70">
                        {publication.year}
                      </span>
                      {publication.badge ? (
                        <span className="rounded bg-primary/10 px-2 py-1 font-label text-[10px] uppercase tracking-widest text-primary">
                          {publication.badge}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="line-clamp-4 font-headline text-xl font-bold leading-tight tracking-tight text-on-surface">
                      {publication.title}
                    </h3>

                    <p className="mt-4 line-clamp-2 font-body text-sm text-on-surface-variant">
                      {publication.authors}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-outline-variant/10 pt-4">
                    <p className="font-label text-xs uppercase tracking-[0.18em] text-outline">
                      {publication.venue}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
