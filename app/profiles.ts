export const OWNER = {
  name: "Nghiem Thanh Pham",
  nickname: "Nian Pham",
  role: "Senior AI Engineer & Scientific Researcher",
  tagline: "The shortest path from impossible to production runs through my code.",
  email: "nianpham.reed@gmail.com",
  photo: "/assets/profile.jpg",
};

export type Profile = {
  id: string;
  /** Platform name, shown on the stage strip, dock and window chrome. */
  name: string;
  icon: string;
  /** Brand color — every value here passes 4.5:1 against white button text. */
  accent: string;
  cover: string;
  /** CSS object-position for the cover image. */
  coverPosition?: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  meta: { label: string; value: string }[];
  href: string;
  /** Short URL shown in the window's address bar. */
  display: string;
  cta: string;
  /** What the copy button copies; defaults to href. */
  copyValue?: string;
  copyLabel?: string;
};

export const PROFILES: Profile[] = [
  {
    id: "about",
    name: "About",
    icon: OWNER.photo,
    accent: "#2563eb",
    cover: OWNER.photo,
    coverPosition: "center 22%",
    eyebrow: "Hello, I'm",
    title: OWNER.name,
    description:
      "Stop searching for me on every social network. Each window on this desk is a real profile of mine — pick one from the stage on the left, have a look around, and say hello.",
    highlights: [],
    meta: [],
    href: `mailto:${OWNER.email}`,
    display: "nianpham.my",
    cta: "Say hello",
    copyValue: OWNER.email,
    copyLabel: "Email address",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "/assets/icons/github.png",
    accent: "#24292f",
    cover: "/assets/github.jpeg",
    eyebrow: "Code & open source",
    title: "Where my code lives",
    description:
      "Projects, experiments and open-source work from my day-to-day as an AI engineer. If you want to see how I actually build things, start here.",
    highlights: [
      "Source code for AI and machine-learning projects",
      "Prototypes, experiments and side projects",
      "Open-source contributions",
    ],
    meta: [
      { label: "Handle", value: "@nghiempt" },
      { label: "Platform", value: "GitHub" },
      { label: "Best for", value: "Reading my code" },
    ],
    href: "https://github.com/nghiempt",
    display: "github.com/nghiempt",
    cta: "View GitHub",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "/assets/icons/linkedin.png",
    accent: "#0a66c2",
    cover: "/assets/linkedin.jpeg",
    eyebrow: "Career & experience",
    title: "My professional story",
    description:
      "Roles, experience and the teams I've shipped AI products with. The best place to talk about work, hiring or partnerships.",
    highlights: [
      "Work history and current role",
      "Skills and professional background",
      "Career updates and posts",
    ],
    meta: [
      { label: "Name", value: OWNER.name },
      { label: "Role", value: "Senior AI Engineer" },
      { label: "Best for", value: "Work & hiring" },
    ],
    href: "https://www.linkedin.com/in/nianpham",
    display: "linkedin.com/in/nianpham",
    cta: "Connect on LinkedIn",
  },
  {
    id: "scholar",
    name: "Scholar",
    icon: "/assets/icons/scholar.png",
    accent: "#1967d2",
    cover: "/assets/google-scholar-thumb.jpg",
    eyebrow: "Research & citations",
    title: "Publications on Google Scholar",
    description:
      "Peer-reviewed publications, citations and ongoing AI research, indexed and kept up to date by Google Scholar.",
    highlights: [
      "Peer-reviewed papers and preprints",
      "Citation counts and metrics",
      "Co-authors and research areas",
    ],
    meta: [
      { label: "Author", value: OWNER.nickname },
      { label: "Platform", value: "Google Scholar" },
      { label: "Best for", value: "Citing my work" },
    ],
    href: "https://scholar.google.com/citations?user=23NArXYAAAAJ",
    display: "scholar.google.com",
    cta: "View publications",
  },
  {
    id: "researchgate",
    name: "ResearchGate",
    icon: "/assets/icons/rg.png",
    accent: "#00796b",
    cover: "/assets/rs.jpg",
    eyebrow: "Research network",
    title: "Papers & discussions",
    description:
      "Full-text papers, preprints and conversations with the wider scientific community. Reach out here for research questions or collaboration.",
    highlights: [
      "Full-text papers and preprints",
      "Research questions and discussions",
      "Collaborators and co-authors",
    ],
    meta: [
      { label: "Profile", value: "Nghiem Pham" },
      { label: "Platform", value: "ResearchGate" },
      { label: "Best for", value: "Research talk" },
    ],
    href: "https://www.researchgate.net/profile/Nghiem-Pham",
    display: "researchgate.net/profile/Nghiem-Pham",
    cta: "Open ResearchGate",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "/assets/icons/facebook.png",
    accent: "#0866ff",
    cover: OWNER.photo,
    coverPosition: "center 22%",
    eyebrow: "Life & updates",
    title: "The personal side",
    description:
      "Daily life, moments and casual updates away from the terminal. The easiest place to drop me a friendly message.",
    highlights: ["Daily life and moments", "Personal updates", "Quick, casual messages"],
    meta: [
      { label: "Handle", value: "nianpham.me" },
      { label: "Platform", value: "Facebook" },
      { label: "Best for", value: "Saying hi" },
    ],
    href: "https://www.facebook.com/nianpham.me",
    display: "facebook.com/nianpham.me",
    cta: "Say hi on Facebook",
  },
  {
    id: "email",
    name: "Email",
    icon: "/assets/icons/gmail.png",
    accent: "#c5221f",
    cover: "/assets/gmail-banner.jpg",
    eyebrow: "Direct line",
    title: "Say hello",
    description:
      "Open to collaboration and interesting problems — I reply fast. Tell me a little about what you're working on.",
    highlights: [
      "Collaboration on AI products",
      "Research partnerships",
      "Interesting problems of any size",
    ],
    meta: [
      { label: "Address", value: OWNER.email },
      { label: "Reply time", value: "Fast" },
      { label: "Best for", value: "Anything" },
    ],
    href: `mailto:${OWNER.email}`,
    display: OWNER.email,
    cta: "Send an email",
    copyValue: OWNER.email,
    copyLabel: "Email address",
  },
];
