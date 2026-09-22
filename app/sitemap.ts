import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  return [
    ...["", "/articles", "/about", "/contact", "/editorial"].map((p) => ({
      url: `${base}${p}`,
    })),
    ...(await publishedArticles())
      .filter((p) => !p.sample)
      .map((p) => ({ url: `${base}/articles/${p.id}`, lastModified: p.date })),
  ];
}
