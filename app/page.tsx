import type { Metadata } from "next";
import JsonLd from "./json-ld";
import { WINDOWS } from "./profiles";
import { pageJsonLd, pageMetadata } from "./seo";
import StageManager from "./stage-manager";

const about = WINDOWS[0];

export const metadata: Metadata = pageMetadata(about);

export default function HomePage() {
  return (
    <>
      <JsonLd data={pageJsonLd(about)} />
      <StageManager initialId={about.id} />
    </>
  );
}
