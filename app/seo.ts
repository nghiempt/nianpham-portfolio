// Search metadata and schema.org structured data for every page. The copy
// here is what Google shows in results, so each page gets its own title,
// description and canonical URL, and the JSON-LD names the same person
// everywhere so the pages are understood as one profile.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { ACHIEVEMENTS, KIND_BY_ID } from "./data/achievements";
import { CATEGORY_BY_ID, PROJECTS } from "./data/projects";
import { isPublished, PUBLICATIONS } from "./data/publications";
import { STACK } from "./data/stack";
import { CHANNELS, EDUCATION, OWNER, SITE_URL, WINDOWS, type StageItem } from "./profiles";

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const url = (path: string) => (path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`);

const published = PUBLICATIONS.filter(isPublished);
const toolCount = STACK.reduce((n, g) => n + g.tools.length, 0);

export const DESCRIPTIONS: Record<string, string> = {
  about: `${OWNER.name} (${OWNER.nickname}) is a ${OWNER.role} in ${OWNER.location}: ${PROJECTS.length}+ AI products shipped, ${published.length}+ published papers and ${toolCount}+ tools in daily use.`,
  projects: `${PROJECTS.length}+ projects built by ${OWNER.name} (${OWNER.nickname}): agentic AI assistants, LLM and RAG systems, computer vision, robotics and full-stack web and mobile apps.`,
  publications: `Research papers by ${OWNER.name} (${OWNER.nickname}) in AI, small language models and NLP — ${published.length} published at venues such as EMNLP, with Q1 journal articles and DOIs.`,
  stack: `The ${toolCount}+ tools ${OWNER.name} (${OWNER.nickname}) works with across ${STACK.length} areas: LLMs and model APIs, agents, RAG, vector search, MLOps, cloud, backend and frontend.`,
  achievements: `Certificates, awards, AI contests and community events of ${OWNER.name} (${OWNER.nickname}), ${OWNER.role}, in a year-by-year timeline.`,
};

export const SECTIONS = WINDOWS.filter((w) => w.kind !== "about");

export function windowById(id: string) {
  return WINDOWS.find((w) => w.id === id);
}

// A page that sets its own openGraph/twitter drops the root's file-based
// images, so every page names the shared social card explicitly.
const SHARE_IMAGE_ALT = readFileSync(join(process.cwd(), "app/opengraph-image.alt.txt"), "utf8").trim();
const shareImage = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: SHARE_IMAGE_ALT };

/** Title, description, canonical and social cards for one window's page. */
export function pageMetadata(item: StageItem): Metadata {
  const description = DESCRIPTIONS[item.id];
  return {
    title: { absolute: item.pageTitle },
    description,
    alternates: { canonical: url(item.path) },
    openGraph: {
      type: item.kind === "about" ? "profile" : "website",
      url: url(item.path),
      title: item.pageTitle,
      description,
      siteName: OWNER.name,
      locale: "en_US",
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title: item.pageTitle, description, images: [shareImage] },
  };
}

/* ------------------------------------------------------------- JSON-LD */

/** The person and the site, shared by every page and referenced by @id. */
function siteGraph() {
  return [
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: url("/"),
      name: OWNER.name,
      alternateName: [OWNER.nickname, OWNER.website],
      description: DESCRIPTIONS.about,
      inLanguage: "en",
      publisher: { "@id": PERSON_ID },
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: OWNER.name,
      alternateName: [OWNER.nickname, OWNER.nativeName, "Nghiem Pham"],
      givenName: "Nghiem",
      familyName: "Pham",
      jobTitle: OWNER.role,
      description: DESCRIPTIONS.about,
      url: url("/"),
      image: `${SITE_URL}${OWNER.photo}`,
      email: `mailto:${OWNER.email}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ho Chi Minh City",
        addressCountry: "VN",
      },
      nationality: { "@type": "Country", name: "Vietnam" },
      alumniOf: { "@type": "CollegeOrUniversity", name: EDUCATION.school, sameAs: "https://fpt.edu.vn" },
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: EDUCATION.degree,
      },
      knowsAbout: [
        "Artificial Intelligence",
        "Large Language Models",
        "Agentic AI",
        "Retrieval-Augmented Generation",
        "Small Language Models",
        "Natural Language Processing",
        "Computer Vision",
        "Machine Learning",
        "Software Engineering",
      ],
      sameAs: CHANNELS.filter((c) => !c.href.startsWith("mailto:")).map((c) => c.href),
    },
  ];
}

function breadcrumb(item: StageItem) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url(item.path)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: url("/") },
      { "@type": "ListItem", position: 2, name: item.name, item: url(item.path) },
    ],
  };
}

function itemList(item: StageItem): object[] {
  switch (item.kind) {
    case "projects":
      return PROJECTS.map((p) => ({
        "@type": "CreativeWork",
        name: p.name,
        description: p.description,
        genre: CATEGORY_BY_ID[p.category].label,
        keywords: p.stack.join(", "),
        ...(p.url ? { url: p.url } : {}),
        ...(p.thumbnail ? { image: p.thumbnail.startsWith("/") ? `${SITE_URL}${p.thumbnail}` : p.thumbnail } : {}),
        creator: { "@id": PERSON_ID },
      }));
    case "publications":
      return published.map((p) => ({
        "@type": "ScholarlyArticle",
        headline: p.title,
        name: p.title,
        datePublished: String(p.year),
        author: p.authors.length ? p.authors.map((name) => ({ "@type": "Person", name })) : [{ "@id": PERSON_ID }],
        ...(p.venueFull || p.venue ? { isPartOf: { "@type": "Periodical", name: p.venueFull || p.venue } } : {}),
        ...(p.doi ? { url: `https://doi.org/${p.doi}`, sameAs: `https://doi.org/${p.doi}` } : {}),
      }));
    case "stack":
      return STACK.map((g) => ({
        "@type": "DefinedTermSet",
        name: g.label,
        hasDefinedTerm: g.tools.map((t) => ({ "@type": "DefinedTerm", name: t.name })),
      }));
    case "achievements":
      return ACHIEVEMENTS.filter((a) => !a.goal).map((a) => ({
        "@type": "Thing",
        name: a.name,
        description: [KIND_BY_ID[a.kind].label, a.detail, a.year].filter(Boolean).join(" · "),
      }));
    default:
      return [];
  }
}

/** The full @graph for one page: site + person, the page itself, and its contents. */
export function pageJsonLd(item: StageItem) {
  const page =
    item.kind === "about"
      ? {
          "@type": "ProfilePage",
          "@id": `${url("/")}#webpage`,
          url: url("/"),
          name: item.pageTitle,
          description: DESCRIPTIONS.about,
          isPartOf: { "@id": WEBSITE_ID },
          mainEntity: { "@id": PERSON_ID },
          about: { "@id": PERSON_ID },
          primaryImageOfPage: `${SITE_URL}${OWNER.photo}`,
          inLanguage: "en",
        }
      : {
          "@type": "CollectionPage",
          "@id": `${url(item.path)}#webpage`,
          url: url(item.path),
          name: item.pageTitle,
          description: DESCRIPTIONS[item.id],
          isPartOf: { "@id": WEBSITE_ID },
          about: { "@id": PERSON_ID },
          author: { "@id": PERSON_ID },
          breadcrumb: { "@id": `${url(item.path)}#breadcrumb` },
          inLanguage: "en",
          mainEntity: {
            "@type": "ItemList",
            name: `${item.title} — ${OWNER.name}`,
            itemListElement: itemList(item).map((entry, i) => ({ "@type": "ListItem", position: i + 1, item: entry })),
          },
        };

  return {
    "@context": "https://schema.org",
    "@graph": [...siteGraph(), page, ...(item.kind === "about" ? [] : [breadcrumb(item)])],
  };
}
