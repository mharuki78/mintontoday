import type { Article } from "./content";

// Cards never need bodies, rich documents, result reports or photo licences.
export type ArticlePreview = Pick<Article, "id" | "title" | "category" | "excerpt" | "art" | "date" | "seriesDate" | "sample"> & {
  readingMinutes: number;
  tags?: string[];
  images?: Pick<NonNullable<Article["images"]>[number], "url" | "alt" | "generated">[];
  event?: Pick<NonNullable<Article["event"]>, "type" | "region" | "startDate" | "endDate" | "status">;
};
