import { Footer, TopNav } from "@/components/site-chrome";
import portfolioContent from "@/data/portfolio-content.json";

const projects = portfolioContent.projects;

export default function ProjectsPage() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl px-8 pb-24 pt-32">
        <header className="mb-20">
          <span className="mb-4 block font-label text-xs uppercase tracking-[0.2em] text-primary">
            Portfolio Exhibition
          </span>
          <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface md:text-7xl">
            Selected Projects
          </h1>
          <div className="mt-8 max-w-2xl">
            <p className="font-body text-lg leading-relaxed text-on-surface-variant">
              A curated selection of digital experiments and architectural code. These works
              represent the intersection of high-performance engineering and nocturnal aesthetics.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={project.title}
              className={`project-card-glow group relative overflow-hidden rounded-xl bg-surface-container-high transition-all duration-500 hover:scale-[1.02] hover:bg-surface-container-highest ${
                index === 3 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="aspect-video w-full overflow-hidden bg-surface-container-lowest">
                <img
                  alt={project.title}
                  className="h-full w-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-80"
                  src={project.image}
                />
              </div>
              <div className="p-8">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="font-headline text-2xl font-bold text-on-surface">{project.title}</h3>
                  <a className="text-on-surface-variant transition-colors hover:text-primary" href="#">
                    <span className="material-symbols-outlined">{project.icon}</span>
                  </a>
                </div>
                <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-surface-container-lowest px-2 py-1 font-label text-[10px] uppercase tracking-widest text-outline"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a
                    className="inline-flex items-center gap-2 text-sm font-bold tracking-tight text-primary hover:underline"
                    href="https://github.com"
                  >
                    View on GitHub
                    <span className="material-symbols-outlined text-sm">arrow_outward</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
