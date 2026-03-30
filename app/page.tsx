import Link from "next/link";
import { Footer, TopNav } from "@/components/site-chrome";
import portfolioContent from "@/data/portfolio-content.json";

const socials = [
  { icon: "code", label: "GitHub" },
  { icon: "school", label: "Scholar" },
  { icon: "share", label: "Social" }
];

const explorationCards = portfolioContent.projects.slice(0, 2);

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main className="relative min-h-screen overflow-hidden pt-24">
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
               AI Engineer with expertise in LLM systems, multi-agent architectures, and multimodal AI, backed by ~4 years of experience and 20+ publications
              </p>
              <p className="max-w-lg font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
               Lead AI teams and delivered production-grade solutions for enterprise clients in finance, healthcare, and media.
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4">
              {socials.map((social) => (
                <a key={social.label} className="group flex flex-col items-center gap-2" href="#">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-all duration-300 group-hover:bg-surface-container-highest group-hover:text-primary">
                    <span className="material-symbols-outlined text-2xl">{social.icon}</span>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {explorationCards.map((card) =>
                card.featured ? (
                  <div
                    key={card.title}
                    className="group relative overflow-hidden rounded-xl bg-surface-container-high p-1 transition-all duration-500 hover:bg-surface-container-highest md:col-span-2"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <img
                        alt={card.title}
                        className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                        src={card.image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent" />
                      <div className="absolute bottom-8 left-8 right-8">
                        <span className="mb-2 block font-label text-xs uppercase tracking-widest text-primary">
                          {card.category}
                        </span>
                        <h3 className="mb-2 font-headline text-2xl font-bold">{card.title}</h3>
                        <p className="max-w-md font-body text-sm text-on-surface-variant">
                          {card.homeDescription || card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={card.title}
                    className="group relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-xl bg-surface-container-high p-8 transition-all duration-500 hover:bg-surface-container-highest"
                  >
                    <div className="absolute left-0 top-0 h-full w-full opacity-10 transition-opacity group-hover:opacity-20">
                      <img
                        alt={card.title}
                        className="h-full w-full object-cover grayscale"
                        src={card.image}
                      />
                    </div>
                    <div className="relative z-10">
                      <span className="mb-2 block font-label text-xs uppercase tracking-widest text-primary">
                        {card.category}
                      </span>
                      <h3 className="mb-2 font-headline text-2xl font-bold">{card.title}</h3>
                      <p className="font-body text-sm text-on-surface-variant">
                        {card.homeDescription || card.description}
                      </p>
                      <Link
                        href="/projects"
                        className="group/link mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary"
                      >
                        Read Case Study
                        <span className="material-symbols-outlined text-sm transition-transform group-hover/link:translate-x-1">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
