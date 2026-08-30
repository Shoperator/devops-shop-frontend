/**
 * Stand-in for `next/navigation`. The real hooks need an App Router context
 * that only exists inside a running Next server, so every test file gets this
 * one instead (wired up in `jest.setup.ts`).
 */
export const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

export const useRouter = () => routerMock;
export const usePathname = () => "/";
export const useSearchParams = () => new URLSearchParams();
