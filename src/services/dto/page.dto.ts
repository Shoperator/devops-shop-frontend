/** Mirrors `PageDto<T>` on the backend: the envelope of every list endpoint. */
export interface PageDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
