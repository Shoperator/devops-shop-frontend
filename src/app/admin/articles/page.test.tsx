import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/services/api";
import { articleService } from "@/services/articleService";
import type { ArticleDto } from "@/services/dto/article.dto";
import type { PageDto } from "@/services/dto/page.dto";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import AdminArticlesPage from "./page";

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

/** Renders the page as the shop admin and waits for the first load to settle. */
async function renderAdminPage(articles: ArticleDto[] = [article()]) {
  articleServiceMock.list.mockResolvedValue(pageOf(articles));
  const rendered = renderAs(ADMIN_USER, <AdminArticlesPage />);
  await waitFor(() => expect(articleServiceMock.list).toHaveBeenCalled());
  return rendered;
}

describe("AdminArticlesPage", () => {
  beforeEach(() => {
    articleServiceMock.list.mockResolvedValue(pageOf([article()]));
    articleServiceMock.create.mockResolvedValue(article());
    articleServiceMock.update.mockResolvedValue(article());
    articleServiceMock.remove.mockResolvedValue(undefined);
  });

  it("keeps a customer out and never asks the backend for the catalogue", async () => {
    renderAs(CUSTOMER_USER, <AdminArticlesPage />);

    expect(
      await screen.findByText("This page is for the shop admin"),
    ).toBeInTheDocument();
    expect(articleServiceMock.list).not.toHaveBeenCalled();
  });

  describe("the catalogue table", () => {
    it("lists the articles with their price and stock", async () => {
      await renderAdminPage();

      expect(await screen.findByText("Green tea")).toBeInTheDocument();
      expect(screen.getByText("Loose leaf, 100g")).toBeInTheDocument();
      expect(screen.getByText("12.50 USDT")).toBeInTheDocument();
      expect(screen.getByText("8 pcs")).toBeInTheDocument();
    });

    it("calls out an article nobody can buy any more", async () => {
      await renderAdminPage([article({ quantity: 0, inStock: false })]);

      expect(await screen.findByText("Out of stock")).toBeInTheDocument();
    });

    it("invites the admin to add the first article", async () => {
      await renderAdminPage([]);

      expect(await screen.findByText("No articles yet")).toBeInTheDocument();
    });

    it("shows what went wrong when the catalogue cannot be loaded", async () => {
      articleServiceMock.list.mockRejectedValue(
        new ApiError("Cannot reach the shop. Please try again.", 0),
      );

      renderAs(ADMIN_USER, <AdminArticlesPage />);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Cannot reach the shop. Please try again.",
      );
    });
  });

  describe("adding an article", () => {
    it("sends what the admin typed and reloads the list", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(screen.getByRole("button", { name: "New article" }));
      await user.type(screen.getByLabelText("Name"), "Rooibos");
      await user.type(screen.getByLabelText("Description"), "Caffeine free");
      await user.type(screen.getByLabelText("Price (USDT)"), "9.99");
      await user.type(screen.getByLabelText("Pieces in stock"), "12");
      await user.click(screen.getByRole("button", { name: "Add article" }));

      await waitFor(() =>
        expect(articleServiceMock.create).toHaveBeenCalledWith({
          name: "Rooibos",
          description: "Caffeine free",
          // Sent as numbers: the backend rejects the strings an input hands back.
          price: 9.99,
          quantity: 12,
        }),
      );
      // Once on mount, once after the article was stored.
      await waitFor(() =>
        expect(articleServiceMock.list).toHaveBeenCalledTimes(2),
      );
    });

    it("sends null rather than an empty string for a description left blank", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(screen.getByRole("button", { name: "New article" }));
      await user.type(screen.getByLabelText("Name"), "Rooibos");
      await user.type(screen.getByLabelText("Price (USDT)"), "9.99");
      await user.type(screen.getByLabelText("Pieces in stock"), "12");
      await user.click(screen.getByRole("button", { name: "Add article" }));

      await waitFor(() =>
        expect(articleServiceMock.create).toHaveBeenCalledWith(
          expect.objectContaining({ description: null }),
        ),
      );
    });

    it("does not call the backend when required fields are missing", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(screen.getByRole("button", { name: "New article" }));
      await user.click(screen.getByRole("button", { name: "Add article" }));

      expect(await screen.findByText("A name is required")).toBeInTheDocument();
      expect(screen.getByText("A price is required")).toBeInTheDocument();
      expect(
        screen.getByText("A number of pieces is required"),
      ).toBeInTheDocument();
      expect(articleServiceMock.create).not.toHaveBeenCalled();
    });

    it.each(["19.99", "0.29", "9.99", "0.01"])(
      "accepts %s, an ordinary two-decimal price",
      async (price) => {
        const user = userEvent.setup();
        await renderAdminPage();

        await user.click(screen.getByRole("button", { name: "New article" }));
        await user.type(screen.getByLabelText("Name"), "Rooibos");
        await user.type(screen.getByLabelText("Price (USDT)"), price);
        await user.type(screen.getByLabelText("Pieces in stock"), "1");
        await user.click(screen.getByRole("button", { name: "Add article" }));

        await waitFor(() =>
          expect(articleServiceMock.create).toHaveBeenCalledWith(
            expect.objectContaining({ price: Number(price) }),
          ),
        );
      },
    );

    it("refuses a price the price column could not store exactly", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(screen.getByRole("button", { name: "New article" }));
      await user.type(screen.getByLabelText("Name"), "Too precise");
      await user.type(screen.getByLabelText("Price (USDT)"), "1.005");
      await user.type(screen.getByLabelText("Pieces in stock"), "1");
      await user.click(screen.getByRole("button", { name: "Add article" }));

      expect(
        await screen.findByText("At most two decimal places"),
      ).toBeInTheDocument();
      expect(articleServiceMock.create).not.toHaveBeenCalled();
    });

    it("refuses a fraction of a piece", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(screen.getByRole("button", { name: "New article" }));
      await user.type(screen.getByLabelText("Name"), "Half a mug");
      await user.type(screen.getByLabelText("Price (USDT)"), "1.00");
      await user.type(screen.getByLabelText("Pieces in stock"), "1.5");
      await user.click(screen.getByRole("button", { name: "Add article" }));

      expect(await screen.findByText("Whole pieces only")).toBeInTheDocument();
      expect(articleServiceMock.create).not.toHaveBeenCalled();
    });

    it("keeps the form open and shows the reason when the backend refuses", async () => {
      const user = userEvent.setup();
      articleServiceMock.create.mockRejectedValue(
        new ApiError("name must be shorter than 128 characters", 400),
      );
      await renderAdminPage();

      await user.click(screen.getByRole("button", { name: "New article" }));
      await user.type(screen.getByLabelText("Name"), "Rooibos");
      await user.type(screen.getByLabelText("Price (USDT)"), "9.99");
      await user.type(screen.getByLabelText("Pieces in stock"), "12");
      await user.click(screen.getByRole("button", { name: "Add article" }));

      expect(
        await screen.findByText("name must be shorter than 128 characters"),
      ).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("editing an article", () => {
    it("opens the form filled in with the article", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(await screen.findByRole("button", { name: "Edit" }));

      expect(screen.getByLabelText("Name")).toHaveValue("Green tea");
      expect(screen.getByLabelText("Price (USDT)")).toHaveValue(12.5);
      expect(screen.getByLabelText("Pieces in stock")).toHaveValue(8);
    });

    it("saves a restock against the article that was edited", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(await screen.findByRole("button", { name: "Edit" }));
      await user.clear(screen.getByLabelText("Pieces in stock"));
      await user.type(screen.getByLabelText("Pieces in stock"), "40");
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() =>
        expect(articleServiceMock.update).toHaveBeenCalledWith(
          "a0000000-0000-4000-8000-000000000001",
          { quantity: 40 },
        ),
      );
    });

    describe("sends only the fields that changed", () => {
      /** Opens the edit dialog on the one article the page lists. */
      async function openEditor(user: ReturnType<typeof userEvent.setup>) {
        await renderAdminPage();
        await user.click(await screen.findByRole("button", { name: "Edit" }));
      }

      it("renaming an article does not touch its stock", async () => {
        const user = userEvent.setup();
        await openEditor(user);

        await user.clear(screen.getByLabelText("Name"));
        await user.type(screen.getByLabelText("Name"), "Sencha");
        await user.click(screen.getByRole("button", { name: "Save" }));

        // Carrying the stock along would undo any purchase made while the
        // dialog was open.
        await waitFor(() =>
          expect(articleServiceMock.update).toHaveBeenCalledWith(
            "a0000000-0000-4000-8000-000000000001",
            { name: "Sencha" },
          ),
        );
      });

      it("repricing an article does not touch its stock", async () => {
        const user = userEvent.setup();
        await openEditor(user);

        await user.clear(screen.getByLabelText("Price (USDT)"));
        await user.type(screen.getByLabelText("Price (USDT)"), "19.99");
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
          expect(articleServiceMock.update).toHaveBeenCalledWith(
            "a0000000-0000-4000-8000-000000000001",
            { price: 19.99 },
          ),
        );
      });

      it("clearing the description sends only that", async () => {
        const user = userEvent.setup();
        await openEditor(user);

        await user.clear(screen.getByLabelText("Description"));
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
          expect(articleServiceMock.update).toHaveBeenCalledWith(
            "a0000000-0000-4000-8000-000000000001",
            { description: null },
          ),
        );
      });

      it("sends several fields when several were edited", async () => {
        const user = userEvent.setup();
        await openEditor(user);

        await user.clear(screen.getByLabelText("Name"));
        await user.type(screen.getByLabelText("Name"), "Sencha");
        await user.clear(screen.getByLabelText("Pieces in stock"));
        await user.type(screen.getByLabelText("Pieces in stock"), "3");
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
          expect(articleServiceMock.update).toHaveBeenCalledWith(
            "a0000000-0000-4000-8000-000000000001",
            { name: "Sencha", quantity: 3 },
          ),
        );
      });

      it("does not call the backend at all when nothing was edited", async () => {
        const user = userEvent.setup();
        await openEditor(user);

        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
        expect(articleServiceMock.update).not.toHaveBeenCalled();
      });

      it("treats a retyped price of the same value as no change", async () => {
        const user = userEvent.setup();
        await openEditor(user);

        // The article costs 12.5; "12.50" is the same money.
        await user.clear(screen.getByLabelText("Price (USDT)"));
        await user.type(screen.getByLabelText("Price (USDT)"), "12.50");
        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
        expect(articleServiceMock.update).not.toHaveBeenCalled();
      });

      it("still sends everything when creating an article", async () => {
        const user = userEvent.setup();
        await renderAdminPage();

        await user.click(screen.getByRole("button", { name: "New article" }));
        await user.type(screen.getByLabelText("Name"), "Rooibos");
        await user.type(screen.getByLabelText("Price (USDT)"), "9.99");
        await user.type(screen.getByLabelText("Pieces in stock"), "12");
        await user.click(screen.getByRole("button", { name: "Add article" }));

        await waitFor(() =>
          expect(articleServiceMock.create).toHaveBeenCalledWith({
            name: "Rooibos",
            description: null,
            price: 9.99,
            quantity: 12,
          }),
        );
      });
    });
  });

  describe("deleting an article", () => {
    it("asks first and does nothing when the admin backs out", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(await screen.findByRole("button", { name: "Delete" }));
      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      expect(articleServiceMock.remove).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("removes the article once the admin confirms", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.click(await screen.findByRole("button", { name: "Delete" }));
      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      await waitFor(() =>
        expect(articleServiceMock.remove).toHaveBeenCalledWith(
          "a0000000-0000-4000-8000-000000000001",
        ),
      );
      await waitFor(() =>
        expect(articleServiceMock.list).toHaveBeenCalledTimes(2),
      );
    });

    it("keeps the article listed when the delete failed", async () => {
      const user = userEvent.setup();
      articleServiceMock.remove.mockRejectedValue(
        new ApiError("Article not found", 404),
      );
      await renderAdminPage();

      await user.click(await screen.findByRole("button", { name: "Delete" }));
      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("Article not found")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("searching", () => {
    it("asks the backend for the matches and starts again at page one", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

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

    it("says so when nothing matched, instead of looking empty", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      articleServiceMock.list.mockResolvedValue(pageOf([]));
      await user.type(screen.getByLabelText("Search articles"), "rooibos");
      await user.click(screen.getByRole("button", { name: "Search" }));

      expect(await screen.findByText("Nothing matched")).toBeInTheDocument();
      expect(
        screen.getByText('No article matches "rooibos".'),
      ).toBeInTheDocument();
    });

    it("goes back to the whole catalogue when the search is cleared", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.type(screen.getByLabelText("Search articles"), "rooibos");
      await user.click(screen.getByRole("button", { name: "Search" }));
      await screen.findByRole("button", { name: "Clear" });
      await user.click(screen.getByRole("button", { name: "Clear" }));

      await waitFor(() =>
        expect(articleServiceMock.list).toHaveBeenLastCalledWith({
          page: 1,
          limit: 20,
          search: undefined,
        }),
      );
    });
  });

  describe("paging", () => {
    it("asks for the next page", async () => {
      const user = userEvent.setup();
      articleServiceMock.list.mockResolvedValue(
        pageOf([article()], { total: 40, page: 1, totalPages: 2 }),
      );
      renderAs(ADMIN_USER, <AdminArticlesPage />);

      await user.click(await screen.findByRole("button", { name: "Next" }));

      await waitFor(() =>
        expect(articleServiceMock.list).toHaveBeenLastCalledWith({
          page: 2,
          limit: 20,
          search: undefined,
        }),
      );
    });

    it("hides the controls while everything fits on one page", async () => {
      await renderAdminPage();

      expect(await screen.findByText("Green tea")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Next" }),
      ).not.toBeInTheDocument();
    });
  });
});
