import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "../json-ld";
import { pageJsonLd, pageMetadata, SECTIONS, windowById } from "../seo";
import StageManager from "../stage-manager";

// One static page per collection window: /projects, /publications, /stack,
// /achievements. Anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((w) => ({ section: w.id }));
}

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = windowById((await params).section);
  return item ? pageMetadata(item) : {};
}

export default async function SectionPage({ params }: Props) {
  const item = windowById((await params).section);
  if (!item || item.kind === "about") notFound();
  return (
    <>
      <JsonLd data={pageJsonLd(item)} />
      <StageManager initialId={item.id} />
    </>
  );
}
