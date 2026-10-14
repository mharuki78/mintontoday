import { siteUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";
import { getPublishedIndex } from "@/lib/public-content";
import { connection } from "next/server";
import { categories } from "@/lib/content";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  return [
    ...["", "/articles", "/about", "/contact", "/editorial"].map((p) => ({
      url: `${base}${p}`,
    })),
    ...categories.map(category => ({url: `${base}/articles?${new URLSearchParams({category})}`})),
    ...(await getPublishedIndex())
      .map((p) => ({ url: `${base}/articles/${p.id}`, lastModified: p.updatedAt || p.date,
        images: p.images?.map(image => new URL(image.url, base).href) })),
  ];
}
