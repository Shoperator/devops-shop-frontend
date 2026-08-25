import type { ArticleDto } from "./dto/article.dto";
import { notImplemented } from "./notImplemented";

/**
 * Article catalogue. The HTTP calls are added in a follow-up commit; for now
 * this file only pins down the surface the UI will talk to.
 */
export const articleService = {
  getAll(): Promise<ArticleDto[]> {
    return notImplemented("articleService.getAll");
  },

  getById(id: string): Promise<ArticleDto> {
    return notImplemented("articleService.getById", id);
  },
};
