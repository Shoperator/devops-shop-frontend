import { AUTH_TOKEN_KEY } from "./apiConstants";
import { articleService } from "./articleService";

const BASE = "http://shop-backend.test";

/**
 * jsdom ships no Fetch API, so the pieces of a `Response` that `apiRequest`
 * actually touches are stood up by hand.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

/** A 204 carries no body at all, so parsing it would throw. */
function noContentResponse(): Response {
  return {
    ok: true,
    status: 204,
    json: () => Promise.reject(new SyntaxError("Unexpected end of JSON input")),
  } as Response;
}

function lastRequest(): { url: string; init: RequestInit } {
  const calls = (globalThis.fetch as jest.Mock).mock.calls;
  const [url, init] = calls[calls.length - 1] as [string, RequestInit];
  return { url, init };
}

describe("articleService", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({}));
  });

  describe("list", () => {
    it("asks for the catalogue without any query when nothing is filtered", async () => {
      await articleService.list();

      expect(lastRequest().url).toBe(`${BASE}/api/v1/articles`);
    });

    it("passes the page, the page size and the search term", async () => {
      await articleService.list({ page: 2, limit: 20, search: "green tea" });

      const { url } = lastRequest();
      const query = new URL(url).searchParams;
      expect(query.get("page")).toBe("2");
      expect(query.get("limit")).toBe("20");
      expect(query.get("search")).toBe("green tea");
    });

    it("leaves out a filter that is not set, keeping the URL stable", async () => {
      await articleService.list({ page: 1 });

      expect(lastRequest().url).toBe(`${BASE}/api/v1/articles?page=1`);
    });

    it("browses the catalogue without a token, so visitors can look around", async () => {
      window.localStorage.setItem(AUTH_TOKEN_KEY, "admin-token");

      await articleService.list();

      const headers = lastRequest().init.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe("create", () => {
    it("posts the article with the admin token attached", async () => {
      window.localStorage.setItem(AUTH_TOKEN_KEY, "admin-token");

      await articleService.create({ name: "Green tea", price: 12.5, quantity: 8 });

      const { url, init } = lastRequest();
      expect(url).toBe(`${BASE}/api/v1/articles`);
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({
        Authorization: "Bearer admin-token",
        "Content-Type": "application/json",
      });
      expect(JSON.parse(init.body as string)).toEqual({
        name: "Green tea",
        price: 12.5,
        quantity: 8,
      });
    });
  });

  describe("update", () => {
    it("patches only the fields it was given", async () => {
      await articleService.update("article-id", { quantity: 40 });

      const { url, init } = lastRequest();
      expect(url).toBe(`${BASE}/api/v1/articles/article-id`);
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toEqual({ quantity: 40 });
    });
  });

  describe("remove", () => {
    it("deletes the article and tolerates the empty 204 body", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(noContentResponse());

      await expect(articleService.remove("article-id")).resolves.toBeUndefined();

      const { url, init } = lastRequest();
      expect(url).toBe(`${BASE}/api/v1/articles/article-id`);
      expect(init.method).toBe("DELETE");
    });
  });

  describe("error handling", () => {
    it("surfaces the message the backend sent", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(
        jsonResponse({ message: ["price must not be less than 0"] }, 400),
      );

      await expect(
        articleService.create({ name: "Free", price: -1, quantity: 1 }),
      ).rejects.toThrow("price must not be less than 0");
    });

    it("clears the session when the token was rejected", async () => {
      window.localStorage.setItem(AUTH_TOKEN_KEY, "expired-token");
      (globalThis.fetch as jest.Mock).mockResolvedValue(
        jsonResponse({ message: "Unauthorized" }, 401),
      );

      await expect(articleService.remove("article-id")).rejects.toThrow();

      expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });
  });
});
