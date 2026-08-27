import type { PageQuery } from "./page.dto";

/** Mirrors `ArticleResponseDto` on the backend. */
export interface ArticleDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleRequestDto {
  name: string;
  /** `null` clears the field; an empty string would be stored verbatim. */
  description?: string | null;
  price: number;
  quantity: number;
}

/** An absent field is left untouched, so the admin can restock in one call. */
export type UpdateArticleRequestDto = Partial<CreateArticleRequestDto>;

export interface ArticleQuery extends PageQuery {
  search?: string;
}
