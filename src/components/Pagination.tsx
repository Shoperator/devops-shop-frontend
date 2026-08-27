"use client";

import type { PageDto } from "@/services/dto/page.dto";

/** Shared by every admin list so paging behaves the same way everywhere. */
export default function Pagination<T>({
  page,
  onPageChange,
  itemLabel,
}: {
  page: PageDto<T>;
  onPageChange: (nextPage: number) => void;
  /** Plural noun for the total, e.g. "articles". */
  itemLabel: string;
}) {
  const hasPrevious = page.page > 1;
  const hasNext = page.page < page.totalPages;

  // A single page of results needs no controls at all.
  if (page.totalPages <= 1) {
    return (
      <p className="pagination-summary">
        {page.total} {itemLabel}
      </p>
    );
  }

  return (
    <div className="pagination">
      <p className="pagination-summary">
        Page {page.page} of {page.totalPages} · {page.total} {itemLabel}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-outlined"
          onClick={() => onPageChange(page.page - 1)}
          disabled={!hasPrevious}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-outlined"
          onClick={() => onPageChange(page.page + 1)}
          disabled={!hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
