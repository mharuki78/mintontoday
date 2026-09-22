import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return [
    ...["", "/articles", "/about", "/contact", "/editorial"].map((p) => ({
      url: `${base}${p}`,
    })),
    ...(await publishedArticles())
      .filter((p) => !p.sample)
      .map((p) => ({ url: `${base}/articles/${p.id}`, lastModified: p.date })),
  ];
}
