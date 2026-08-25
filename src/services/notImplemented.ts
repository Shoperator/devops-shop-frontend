/**
 * Placeholder for a service call that is not wired to the backend yet.
 * Every remaining usage disappears as the corresponding endpoint lands.
 */
export function notImplemented(operation: string, ...context: unknown[]): never {
  console.warn(`[api] ${operation} was called before it was wired up`, ...context);
  throw new Error(`${operation} is not implemented yet`);
}
