import { Footer, TopNav } from "@/components/site-chrome";
import portfolioContent from "@/data/portfolio-content.json";

const filters = ["All Years", "Journals", "Conferences", "Pre-prints"];
const publications = portfolioContent.publications;

export default function PublicationsPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl px-8 pb-24 pt-32">
        <header className="mb-16 flex flex-col justify-between gap-8 md:mb-24 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <span className="mb-4 block font-label text-xs uppercase tracking-[0.2em] text-primary">
              Archive of Research
            </span>
            <h1 className="font-headline text-5xl font-extrabold leading-none tracking-tighter text-on-surface md:text-7xl">
              Scientific Publications
            </h1>
          </div>
          
        </header>

        <div className="mb-12 flex flex-wrap items-center gap-4">
          <span className="mr-4 font-label text-xs uppercase tracking-widest text-outline">
            Filter by:
          </span>
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={
                index === 0
                  ? "rounded-full border border-outline-variant/10 bg-surface-container-high px-6 py-2 font-label text-xs uppercase tracking-widest text-on-surface transition-all hover:bg-surface-bright"
                  : "rounded-full bg-surface-container-lowest px-6 py-2 font-label text-xs uppercase tracking-widest text-outline transition-all hover:text-on-surface"
              }
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {publications.map((publication) => (
            <article
              key={`${publication.year}-${publication.title}`}
              className="publication-card flex flex-col items-start gap-8 rounded-xl border-l-2 border-primary/20 bg-surface-container-low p-8 transition-all duration-300 md:flex-row"
            >
              <div className="shrink-0 md:w-24">
                <span className="font-headline text-2xl font-bold text-primary opacity-50">
                  {publication.year}
                </span>
              </div>
              <div className="flex-grow space-y-4">
                {publication.badge ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-label text-[10px] uppercase tracking-widest text-primary">
                      {publication.badge}
                    </span>
                  </div>
                ) : null}
                <h2 className="font-headline text-xl font-bold leading-tight tracking-tight text-on-surface md:text-2xl">
                  {publication.title}
                </h2>
                <p className="max-w-3xl font-body leading-relaxed text-on-surface-variant">
                  {publication.authors}
                </p>
                <p className="font-label text-sm uppercase tracking-wide text-outline">
                  {publication.venue}
                </p>
                <div className="flex items-center gap-6 pt-4">
                  {/* <a
                    className="flex items-center gap-2 font-label text-sm uppercase tracking-wider text-primary transition-colors hover:text-on-surface"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">school</span>
                    Google Scholar
                  </a> */}
                  <a
                    className="flex items-center gap-2 font-label text-sm uppercase tracking-wider text-primary transition-colors hover:text-on-surface"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">link</span>
                    DOI: {publication.doi}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <button className="group flex flex-col items-center gap-2 transition-all">
            <span className="font-label text-xs uppercase tracking-[0.3em] text-outline group-hover:text-primary">
              Load Previous Years
            </span>
            <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-y-1">
              expand_more
            </span>
          </button>
        </div>
      </main>

      <section className="mb-16 bg-surface-container-low py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 font-headline text-3xl font-extrabold tracking-tighter text-on-surface md:text-4xl">
            Interested in collaborating on new research?
          </h2>
          <p className="mb-10 text-lg text-on-surface-variant">
            I am always looking for interdisciplinary opportunities at the intersection of
            machine learning and biological systems.
          </p>
          <a
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-inverse-primary px-10 py-4 font-headline text-sm font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:scale-105 active:scale-95"
            href="mailto:nianpham.reed@gmail.com"
          >
            Request Full CV
          </a>
        </div>
      </section>
      <Footer />
    </>
  );
}
