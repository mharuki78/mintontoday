import type { Article } from "./content.ts";
import { articleHashtags } from "./hashtags.ts";
import { publisher } from "./publisher.ts";

const siteName = "Minton Today";
const rootUrl = (base: string) => new URL("/", base).href;

function organization(root: string) {
  return {
    "@type": "Organization",
    "@id": `${root}#organization`,
    name: siteName,
    alternateName: "민턴투데이",
    url: root,
    logo: { "@type": "ImageObject", url: `${root}apple-icon.png`, contentUrl: `${root}apple-icon.png`, width: 180, height: 180 },
    email: publisher.email,
    contactPoint: { "@type": "ContactPoint", contactType: "editorial inquiries", email: publisher.email, url: `${root}contact`, availableLanguage: "ko" },
    publishingPrinciples: `${root}editorial`,
    correctionsPolicy: `${root}editorial`,
  };
}

export function homeStructuredData(base: string) {
  const root = rootUrl(base);
  const org = organization(root);
  return {
    "@context": "https://schema.org",
    "@graph": [
      org,
      { "@type": "WebSite", "@id": `${root}#website`, url: root, name: siteName, alternateName: "민턴투데이", inLanguage: "ko-KR", publisher: { "@id": org["@id"] } },
      { "@type": "WebPage", "@id": `${root}#webpage`, url: root, name: "Minton Today — 오늘도, 배드민턴.", inLanguage: "ko-KR", isPartOf: { "@id": `${root}#website` }, about: { "@id": org["@id"] } },
    ],
  };
}

export function articleStructuredData(post: Article, base: string) {
  if (post.status !== "published" || post.sample) return null;
  const root = rootUrl(base);
  const url = `${root}articles/${post.id}`;
  const categoryUrl = new URL(`/articles?${new URLSearchParams({ category: post.category })}`, root).href;
  const org = organization(root);
  const images = post.images?.map((image, index) => ({
    "@type": "ImageObject", "@id": `${url}#image-${index + 1}`,
    url: new URL(image.url, root).href,
    contentUrl: new URL(image.url, root).href,
    caption: image.caption,
    creditText: image.credit,
    ...(image.licenseUrl ? { license: image.licenseUrl } : {}),
  })) || [];
  const sources = [...(post.sources || []), ...(post.sourceUrl ? [{ url: post.sourceUrl, name: post.sourceName || "원문 보기" }] : [])];
  const citations = [...new Map(sources.map(source => [source.url, source])).values()]
    .map(source => ({ "@type": "CreativeWork", name: source.name, url: source.url }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      org,
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: post.title,
        description: post.excerpt, inLanguage: "ko-KR",
        isPartOf: { "@id": `${root}#website` },
        mainEntity: { "@id": `${url}#article` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        ...(images.length ? { primaryImageOfPage: { "@id": images[0]["@id"] } } : {}),
      },
      {
        "@type": post.category === "뉴스" ? "NewsArticle" : "BlogPosting",
        "@id": `${url}#article`, url, headline: post.title, description: post.excerpt,
        // Legacy records only store the publication day; do not invent a clock time.
        datePublished: post.date,
        ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
        ...(images.length ? { image: images } : {}),
        inLanguage: "ko-KR", articleSection: post.category, keywords: articleHashtags(post).join(", "),
        isAccessibleForFree: true,
        author: { "@id": org["@id"] }, publisher: { "@id": org["@id"] },
        mainEntityOfPage: { "@id": `${url}#webpage` },
        ...(citations.length ? { citation: citations } : {}),
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: root },
          { "@type": "ListItem", position: 2, name: post.category, item: categoryUrl },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
