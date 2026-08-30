/**
 * Stand-in for `next-runtime-env` (wired up in `jest.config.mjs`).
 *
 * The real package's entry point re-exports a server component, which drags
 * `next/cache` and a good part of the Next server runtime into the test — none
 * of which jsdom can load. What the library actually does in a browser is a
 * single lookup in the `window.__ENV` payload `<PublicEnvScript />` wrote, and
 * that is reproduced faithfully here.
 */
export function env(key: string): string | undefined {
  if (!key.startsWith("NEXT_PUBLIC_")) {
    throw new Error(
      `Environment variable '${key}' is not public and cannot be accessed in the browser.`,
    );
  }
  return (window as unknown as { __ENV: Record<string, string | undefined> })
    .__ENV[key];
}

/** In the browser this only emits the `window.__ENV` script tag. */
export function PublicEnvScript() {
  return null;
}
