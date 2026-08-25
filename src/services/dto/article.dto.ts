/** Mirrors `ArticleResponseDto` on the backend. */
export interface ArticleDto {
  id: string;
  name: string;
  description: string | null;
  /** Price in the shop currency (USDT). */
  price: number;
  /** Pieces currently available. */
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface CreateArticleDto {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export type UpdateArticleDto = Partial<CreateArticleDto>;
