import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_ARTICLES_TAG } from "./public-content";

export function invalidatePublicArticles() {
  revalidateTag(PUBLIC_ARTICLES_TAG, {expire:0});
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/articles/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
}
