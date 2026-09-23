import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/store";
import { categories } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  return [
    ...["", "/articles", "/about", "/contact", "/editorial"].map((p) => ({
      url: `${base}${p}`,
    })),
    ...categories.map(category => ({url: `${base}/articles?${new URLSearchParams({category})}`})),
    ...(await publishedArticles())
      .filter((p) => !p.sample)
      .map((p) => ({ url: `${base}/articles/${p.id}`, lastModified: p.updatedAt || p.date,
        images: p.images?.map(image => new URL(image.url, base).href) })),
  ];
}
