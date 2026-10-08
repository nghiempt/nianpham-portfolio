export const SITE_URL = "https://www.nianpham.my";

export const OWNER = {
  name: "Nghiem Thanh Pham",
  nickname: "Nian Pham",
  role: "Senior AI Engineer & Scientific Researcher",
  email: "nianpham.reed@gmail.com",
  location: "Ho Chi Minh City, Vietnam",
  website: "nianpham.my",
  photo: "/assets/profile.jpg",
};

export const EDUCATION = {
  degree: "Bachelor of Software Engineering with Artificial Intelligence",
  school: "FPT University",
  graduated: "Oct 2024",
  facts: [
    { label: "GPA", value: "3.2" },
    { label: "Scholarship", value: "70%" },
    { label: "IELTS", value: "6.0" },
  ],
  /** Subjects covered by the degree, shown as chips under the facts. */
  coursework: [
    "C/C++",
    "Java",
    "Python",
    "Data Structures & Algorithms",
    "OOP",
    "Databases",
    "Operating Systems",
    "Computer Networks",
    "Software Engineering",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Data Mining",
  ],
};

/** Places to reach me — listed on the About window, not windows of their own. */
export type Channel = {
  id: string;
  name: string;
  label: string;
  icon: string;
  href: string;
};

export const CHANNELS: Channel[] = [
  { id: "github", name: "GitHub", label: "Code & open source", icon: "/assets/icons/github.png", href: "https://github.com/nghiempt" },
  { id: "linkedin", name: "LinkedIn", label: "Career & experience", icon: "/assets/icons/linkedin.png", href: "https://www.linkedin.com/in/nianpham" },
  { id: "scholar", name: "Scholar", label: "Research & citations", icon: "/assets/icons/scholar.png", href: "https://scholar.google.com/citations?user=23NArXYAAAAJ" },
  { id: "researchgate", name: "RG", label: "Research network", icon: "/assets/icons/rg.png", href: "https://www.researchgate.net/profile/Nghiem-Pham" },
  { id: "facebook", name: "Facebook", label: "Life & updates", icon: "/assets/icons/facebook.png", href: "https://www.facebook.com/nianpham.me" },
  { id: "email", name: "Email", label: "Direct line", icon: "/assets/icons/gmail.png", href: `mailto:${OWNER.email}` },
];

export type WindowKind = "about" | "projects" | "publications" | "stack" | "achievements";

export type StageItem = {
  id: string;
  kind: WindowKind;
  /** Shown on the stage strip and the window chrome. */
  name: string;
  /** App icon image; collection windows draw a glyph instead. */
  icon?: string;
  /** Brand color — every value here passes 4.5:1 against white button text. */
  accent: string;
  /** Thumbnail / hero image. Collection windows render a mock preview. */
  cover?: string;
  coverPosition?: string;
  /** Short URL shown in the window's address bar. */
  display: string;
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  /** What the copy buttons copy, and how the toast names it. */
  copyValue: string;
  copyLabel: string;
};

export const WINDOWS: StageItem[] = [
  {
    id: "about",
    kind: "about",
    name: "About",
    icon: OWNER.photo,
    accent: "#2563eb",
    cover: OWNER.photo,
    coverPosition: "center 22%",
    display: "nianpham.my",
    eyebrow: "Hello, I'm",
    title: OWNER.name,
    description:
      "Stop searching for me on every social network — everything is on this desk. Browse my projects, papers, toolbox and milestones on the left, or reach me on any channel below.",
    href: `mailto:${OWNER.email}`,
    copyValue: OWNER.email,
    copyLabel: "Email address",
  },
  {
    id: "projects",
    kind: "projects",
    name: "Projects",
    accent: "#6d28d9",
    display: "nianpham.my/projects",
    eyebrow: "Showcase",
    title: "Projects",
    description: "",
    copyValue: `${SITE_URL}/#projects`,
    copyLabel: "Link",
  },
  {
    id: "publications",
    kind: "publications",
    name: "Publications",
    accent: "#0f766e",
    display: "nianpham.my/publications",
    eyebrow: "Research",
    title: "Publications",
    description: "",
    copyValue: `${SITE_URL}/#publications`,
    copyLabel: "Link",
  },
  {
    id: "stack",
    kind: "stack",
    name: "Tech Stack",
    accent: "#0369a1",
    display: "nianpham.my/stack",
    eyebrow: "Toolbox",
    title: "Tech Stack",
    description: "",
    copyValue: `${SITE_URL}/#stack`,
    copyLabel: "Link",
  },
  {
    id: "achievements",
    kind: "achievements",
    name: "Achievements",
    accent: "#b45309",
    display: "nianpham.my/achievements",
    eyebrow: "Milestones",
    title: "Achievements",
    description: "",
    copyValue: `${SITE_URL}/#achievements`,
    copyLabel: "Link",
  },
];
