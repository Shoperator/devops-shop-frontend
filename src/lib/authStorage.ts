import { AUTH_TOKEN_KEY } from "@/services/apiConstants";
import type { UserDto } from "@/services/dto/user.dto";

const USER_STORAGE_KEY = "shop_user";

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * `useSyncExternalStore` compares snapshots by reference, so the parsed user is
 * cached and only rebuilt when the raw stored value actually changes.
 */
let cachedRaw: string | null = null;
let cachedUser: UserDto | null = null;

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A session that cannot be persisted still works for this tab.
  }
}

function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function handleStorageEvent(event: StorageEvent): void {
  // key === null means the whole storage was cleared.
  if (event.key === null || event.key === USER_STORAGE_KEY) {
    emit();
  }
}

/** Subscribes to session changes, including sign-ins made in another tab. */
export function subscribeToSession(listener: Listener): () => void {
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

export function getStoredUser(): UserDto | null {
  const raw = readItem(USER_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw === null ? null : (JSON.parse(raw) as UserDto);
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

/** On the server there is no session, so the shop always renders as signed out. */
export function getServerUser(): null {
  return null;
}

export function storeSession(user: UserDto, accessToken: string): void {
  writeItem(USER_STORAGE_KEY, JSON.stringify(user));
  writeItem(AUTH_TOKEN_KEY, accessToken);
  emit();
}

export function clearSession(): void {
  removeItem(USER_STORAGE_KEY);
  removeItem(AUTH_TOKEN_KEY);
  emit();
}

export function getStoredToken(): string | null {
  return readItem(AUTH_TOKEN_KEY);
}
