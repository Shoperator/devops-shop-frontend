import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { articleService } from "@/services/articleService";
import type { ArticleDto } from "@/services/dto/article.dto";
import type { PageDto } from "@/services/dto/page.dto";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import { getStoredBasket } from "@/lib/basketStorage";
import { ApiError } from "@/services/api";
import Catalogue from "./Catalogue";

jest.mock("@/services/articleService");

const articleServiceMock = jest.mocked(articleService);

function article(overrides: Partial<ArticleDto> = {}): ArticleDto {
  return {
    id: "a0000000-0000-4000-8000-000000000001",
    name: "Green tea",
    description: "Loose leaf, 100g",
    price: 12.5,
    quantity: 8,
    inStock: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function pageOf(
  items: ArticleDto[],
  overrides: Partial<PageDto<ArticleDto>> = {},
): PageDto<ArticleDto> {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 20,
    totalPages: items.length === 0 ? 0 : 1,
    ...overrides,
  };
}

async function renderCatalogue(
  user: typeof CUSTOMER_USER | null,
  articles: ArticleDto[] = [article()],
) {
  articleServiceMock.list.mockResolvedValue(pageOf(articles));
  const rendered = renderAs(user, <Catalogue />);
  await screen.findByText("Green tea").catch(() => null);
  return rendered;
}

describe("Catalogue", () => {
  beforeEach(() => {
    articleServiceMock.list.mockResolvedValue(pageOf([article()]));
  });

  describe("browsing", () => {
    it("is readable without signing in", async () => {
      await renderCatalogue(null);

      expect(await screen.findByText("Green tea")).toBeInTheDocument();
      expect(screen.getByText("Loose leaf, 100g")).toBeInTheDocument();
      expect(screen.getByText("12.50 USDT")).toBeInTheDocument();
    });

    it("says how many pieces are left", async () => {
      await renderCatalogue(CUSTOMER_USER);

      expect(await screen.findByText("8 left")).toBeInTheDocument();
    });

    it("says when the shop has nothing on the shelves", async () => {
      await renderCatalogue(CUSTOMER_USER, []);

      expect(
        await screen.findByText("Nothing on the shelves yet"),
      ).toBeInTheDocument();
    });

    it("shows what went wrong when the catalogue cannot be loaded", async () => {
      articleServiceMock.list.mockRejectedValue(
        new ApiError("Cannot reach the shop. Please try again.", 0),
      );

      renderAs(CUSTOMER_USER, <Catalogue />);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Cannot reach the shop. Please try again.",
      );
    });
  });

  describe("searching", () => {
    it("asks the backend for the matches", async () => {
      const user = userEvent.setup();
      await renderCatalogue(CUSTOMER_USER);

      await user.type(screen.getByLabelText("Search articles"), "rooibos");
      await user.click(screen.getByRole("button", { name: "Search" }));

      await waitFor(() =>
        expect(articleServiceMock.list).toHaveBeenLastCalledWith({
          page: 1,
          limit: 20,
          search: "rooibos",
        }),
      );
    });

    it("says so when nothing matched", async () => {
      const user = userEvent.setup();
      await renderCatalogue(CUSTOMER_USER);

      articleServiceMock.list.mockResolvedValue(pageOf([]));
      await user.type(screen.getByLabelText("Search articles"), "rooibos");
      await user.click(screen.getByRole("button", { name: "Search" }));

      expect(await screen.findByText("Nothing matched")).toBeInTheDocument();
    });
  });

  describe("adding to the basket", () => {
    it("puts the article in the basket", async () => {
      const user = userEvent.setup();
      await renderCatalogue(CUSTOMER_USER);

      await user.click(
        await screen.findByRole("button", { name: "Add to basket" }),
      );

      expect(getStoredBasket()).toEqual([
        {
          articleId: "a0000000-0000-4000-8000-000000000001",
          name: "Green tea",
          unitPrice: 12.5,
        },
      ]);
    });

    it("says the article is already in the basket and stops offering it", async () => {
      const user = userEvent.setup();
      await renderCatalogue(CUSTOMER_USER);

      await user.click(
        await screen.findByRole("button", { name: "Add to basket" }),
      );

      const inBasket = await screen.findByRole("button", { name: "In basket" });
      expect(inBasket).toBeDisabled();
    });

    it("cannot add an article that is out of stock", async () => {
      await renderCatalogue(CUSTOMER_USER, [
        article({ quantity: 0, inStock: false }),
      ]);

      const button = await screen.findByRole("button", { name: "Out of stock" });
      expect(button).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Add to basket" }),
      ).not.toBeInTheDocument();
    });

    it("asks a signed-out visitor to sign in first", async () => {
      await renderCatalogue(null);

      const card = (await screen.findByText("Green tea")).closest("li");
      expect(
        within(card as HTMLElement).getByRole("link", { name: "Sign in to buy" }),
      ).toHaveAttribute("href", "/login");
      expect(
        screen.queryByRole("button", { name: "Add to basket" }),
      ).not.toBeInTheDocument();
    });

    it("offers the admin nothing to buy — they manage the shop", async () => {
      await renderCatalogue(ADMIN_USER);

      expect(await screen.findByText("Green tea")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Add to basket" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Sign in to buy" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("paging", () => {
    it("asks for the next page", async () => {
      const user = userEvent.setup();
      articleServiceMock.list.mockResolvedValue(
        pageOf([article()], { total: 40, page: 1, totalPages: 2 }),
      );
      renderAs(CUSTOMER_USER, <Catalogue />);

      await user.click(await screen.findByRole("button", { name: "Next" }));

      await waitFor(() =>
        expect(articleServiceMock.list).toHaveBeenLastCalledWith({
          page: 2,
          limit: 20,
          search: undefined,
        }),
      );
    });
  });
});
