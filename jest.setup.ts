import "@testing-library/jest-dom";
import { routerMock } from "@/test-utils/nextNavigation";

// The `mock` prefix is what lets jest hoist this above the imports.
const mockNextNavigation = {
  useRouter: () => routerMock,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
};

jest.mock("next/navigation", () => mockNextNavigation);

beforeEach(() => {
  // `window.__ENV` is the payload `<PublicEnvScript />` writes into the document
  // at request time, and what `env()` reads in the browser. Nothing renders that
  // script in jsdom, so the shop's runtime configuration is put there by hand.
  window.__ENV = {
    NODE_ENV: "test",
    NEXT_PUBLIC_SHOP_NAME: "Test Shop",
    NEXT_PUBLIC_API_URL: "http://shop-backend.test",
  };
});

afterEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});
