import { getApiBaseUrl, withQuery } from "./apiConstants";

describe("getApiBaseUrl", () => {
  it("is empty when nothing is configured, so calls stay on the page's origin", () => {
    // What a deployed shop looks like: the operator sets the shop's name and
    // nothing about addresses, because the Ingress already puts the backend
    // under /api on this same host.
    delete window.__ENV.NEXT_PUBLIC_API_URL;

    expect(getApiBaseUrl()).toBe("");
  });

  it("keeps a request path relative, so the browser resolves it", () => {
    delete window.__ENV.NEXT_PUBLIC_API_URL;

    expect(`${getApiBaseUrl()}/api/v1/articles`).toBe("/api/v1/articles");
  });

  it("honours an override, for a backend on another origin", () => {
    window.__ENV.NEXT_PUBLIC_API_URL = "http://shop-backend.test";

    expect(getApiBaseUrl()).toBe("http://shop-backend.test");
  });
});

describe("withQuery", () => {
  it("leaves a path untouched when no parameter is set", () => {
    expect(withQuery("/api/v1/articles", { page: undefined, search: "" })).toBe(
      "/api/v1/articles",
    );
  });

  it("appends only the parameters that have a value", () => {
    expect(
      withQuery("/api/v1/articles", { page: 2, limit: 20, search: undefined }),
    ).toBe("/api/v1/articles?page=2&limit=20");
  });
});
