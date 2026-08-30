/**
 * The basket lives in the customer's own browser until checkout. Nothing about
 * it is worth a round trip, let alone a server-side session store: the shop
 * runs behind two or three replicas, and a basket held in one pod's memory
 * would vanish the moment the load balancer picked another one.
 */
export interface BasketItem {
  articleId: string;
  name: string;
  unitPrice: number;
}

const BASKET_STORAGE_KEY = "shop_basket";

type Listener = () => void;

const listeners = new Set<Listener>();

/** `useSyncExternalStore` compares snapshots by reference. */
let cachedRaw: string | null = null;
let cachedItems: BasketItem[] = [];

/** Stable reference, so the server snapshot never looks like a new value. */
const EMPTY: BasketItem[] = [];

function readItems(): BasketItem[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(BASKET_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return EMPTY;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = raw === null ? EMPTY : parse(raw);
  }
  return cachedItems;
}

function parse(raw: string): BasketItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BasketItem[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(items: BasketItem[]): void {
  try {
    window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // A basket that cannot be persisted still works for this tab.
  }
  emit();
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function handleStorageEvent(event: StorageEvent): void {
  // key === null means the whole storage was cleared.
  if (event.key === null || event.key === BASKET_STORAGE_KEY) {
    emit();
  }
}

/** Subscribes to basket changes, including those made in another tab. */
export function subscribeToBasket(listener: Listener): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

export function getStoredBasket(): BasketItem[] {
  return readItems();
}

/** On the server there is no basket, so the shop renders it as empty. */
export function getServerBasket(): BasketItem[] {
  return EMPTY;
}

/**
 * Adds an article once. There is no quantity to raise, so putting the same
 * article in twice is a no-op rather than a second line.
 */
export function addToBasket(item: BasketItem): void {
  const items = readItems();
  if (items.some((stored) => stored.articleId === item.articleId)) {
    return;
  }
  write([...items, item]);
}

export function removeFromBasket(articleId: string): void {
  const items = readItems();
  const remaining = items.filter((item) => item.articleId !== articleId);
  if (remaining.length !== items.length) {
    write(remaining);
  }
}

export function clearBasket(): void {
  try {
    window.localStorage.removeItem(BASKET_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
  emit();
}
