import { apiRequest } from "./api";
import { ENDPOINTS, withQuery } from "./apiConstants";
import type {
  ArticleDto,
  ArticleQuery,
  CreateArticleRequestDto,
  UpdateArticleRequestDto,
} from "./dto/article.dto";
import type { PageDto } from "./dto/page.dto";

/**
 * The article catalogue. Reading is public — visitors browse before they sign
 * in — while every mutation is admin-only and rejected by the backend guard.
 */
export const articleService = {
  list(query: ArticleQuery = {}): Promise<PageDto<ArticleDto>> {
    return apiRequest<PageDto<ArticleDto>>(
      withQuery(ENDPOINTS.articles.list, {
        page: query.page,
        limit: query.limit,
        search: query.search,
      }),
    );
  },

  getById(id: string): Promise<ArticleDto> {
    return apiRequest<ArticleDto>(ENDPOINTS.articles.byId(id));
  },

  create(article: CreateArticleRequestDto): Promise<ArticleDto> {
    return apiRequest<ArticleDto>(ENDPOINTS.articles.list, {
      method: "POST",
      body: article,
      authenticated: true,
    });
  },

  update(id: string, changes: UpdateArticleRequestDto): Promise<ArticleDto> {
    return apiRequest<ArticleDto>(ENDPOINTS.articles.byId(id), {
      method: "PATCH",
      body: changes,
      authenticated: true,
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(ENDPOINTS.articles.byId(id), {
      method: "DELETE",
      authenticated: true,
    });
  },
};
