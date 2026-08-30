"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import {
  addToBasket,
  clearBasket,
  getServerBasket,
  getStoredBasket,
  removeFromBasket,
  subscribeToBasket,
  type BasketItem,
} from "@/lib/basketStorage";

interface BasketContextValue {
  items: BasketItem[];
  /** Sum of the lines, at the prices the catalogue showed. */
  total: number;
  count: number;
  contains: (articleId: string) => boolean;
  add: (item: BasketItem) => void;
  remove: (articleId: string) => void;
  clear: () => void;
}

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  // The basket lives in localStorage, which is an external store: the server
  // renders it empty and React swaps in the real value after hydration.
  const items = useSyncExternalStore(
    subscribeToBasket,
    getStoredBasket,
    getServerBasket,
  );

  const contains = useCallback(
    (articleId: string) => items.some((item) => item.articleId === articleId),
    [items],
  );

  const value = useMemo<BasketContextValue>(
    () => ({
      items,
      // Rounded like the backend does, so the two never disagree by a cent.
      total:
        Math.round(
          items.reduce((sum, item) => sum + item.unitPrice, 0) * 100,
        ) / 100,
      count: items.length,
      contains,
      add: addToBasket,
      remove: removeFromBasket,
      clear: clearBasket,
    }),
    [items, contains],
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket(): BasketContextValue {
  const context = useContext(BasketContext);
  if (context === null) {
    throw new Error("useBasket must be used inside a BasketProvider");
  }
  return context;
}
