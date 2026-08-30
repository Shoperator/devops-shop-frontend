"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/services/api";
import type { PageDto } from "@/services/dto/page.dto";

/** The outcome of one finished request, tagged with the request it answered. */
interface Settled<T> {
  fetchPage: () => Promise<PageDto<T>>;
  reloadToken: number;
  page: PageDto<T> | null;
  error: string | null;
}

export interface PagedResource<T> {
  page: PageDto<T> | null;
  isLoading: boolean;
  error: string | null;
  /** Re-runs the fetch, e.g. after the admin changed something. */
  reload: () => void;
}

/**
 * Loads one page of a list endpoint and keeps it in step with the filters.
 *
 * `fetchPage` must be memoised by the caller (`useCallback` over the filters):
 * it is the effect's dependency, so a new function on every render would loop.
 */
export function usePagedResource<T>(
  fetchPage: () => Promise<PageDto<T>>,
): PagedResource<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // Filters change faster than the network answers, so a response that
    // belongs to a superseded request has to be dropped instead of rendered.
    let isCurrent = true;

    fetchPage()
      .then((page) => {
        if (isCurrent) {
          setSettled({ fetchPage, reloadToken, page, error: null });
        }
      })
      .catch((caught: unknown) => {
        if (isCurrent) {
          setSettled({
            fetchPage,
            reloadToken,
            page: null,
            error:
              caught instanceof ApiError
                ? caught.message
                : "Something went wrong. Please try again.",
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchPage, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // Derived rather than stored: a request is in flight exactly when the result
  // in state does not belong to the request the current filters describe.
  const isSettled =
    settled !== null &&
    settled.fetchPage === fetchPage &&
    settled.reloadToken === reloadToken;

  return {
    page: settled?.page ?? null,
    isLoading: !isSettled,
    error: isSettled ? settled.error : null,
    reload,
  };
}
