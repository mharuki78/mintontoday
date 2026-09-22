import type { Article } from "@/lib/content";
export function ArticleImage({ image, width }: { image: NonNullable<Article["images"]>[number]; width?: string | null }) {
  return <figure className={`editorial-image ${image.kind}`} style={width ? { width, maxWidth:"100%", marginInline:"auto" } : undefined}>
    <img src={image.url} alt={image.alt} loading="lazy" referrerPolicy="no-referrer" />
    <figcaption>{image.caption} <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">사진·자료: {image.credit}</a>{image.licenseUrl && <> · <a href={image.licenseUrl} target="_blank" rel="license noopener noreferrer">{image.licenseName || "이용 조건"}</a></>}</figcaption>
  </figure>;
}
