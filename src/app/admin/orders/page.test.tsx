import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/services/api";
import type { OrderDto } from "@/services/dto/order.dto";
import type { PageDto } from "@/services/dto/page.dto";
import { orderService } from "@/services/orderService";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import AdminOrdersPage from "./page";

jest.mock("@/services/orderService");

const orderServiceMock = jest.mocked(orderService);

function order(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: "b0000000-0000-4000-8000-000000000001",
    buyerId: "c0000000-0000-4000-8000-000000000002",
    buyer: {
      id: "c0000000-0000-4000-8000-000000000002",
      username: "buyer",
      displayName: "Buyer One",
    },
    items: [
      {
        articleId: "a0000000-0000-4000-8000-000000000001",
        articleName: "Green tea",
        unitPrice: 12.5,
        quantity: 2,
      },
    ],
    total: 25,
    currency: "USDT",
    status: "PENDING",
    walletAddress: null,
    transactionHash: null,
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
    ...overrides,
  };
}

function pageOf(
  items: OrderDto[],
  overrides: Partial<PageDto<OrderDto>> = {},
): PageDto<OrderDto> {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 20,
    totalPages: items.length === 0 ? 0 : 1,
    ...overrides,
  };
}

async function renderAdminPage(orders: OrderDto[] = [order()]) {
  orderServiceMock.list.mockResolvedValue(pageOf(orders));
  const rendered = renderAs(ADMIN_USER, <AdminOrdersPage />);
  await waitFor(() => expect(orderServiceMock.list).toHaveBeenCalled());
  return rendered;
}

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    orderServiceMock.list.mockResolvedValue(pageOf([order()]));
  });

  it("keeps a customer out and never asks the backend for the orders", async () => {
    renderAs(CUSTOMER_USER, <AdminOrdersPage />);

    expect(
      await screen.findByText("This page is for the shop admin"),
    ).toBeInTheDocument();
    expect(orderServiceMock.list).not.toHaveBeenCalled();
  });

  describe("the order table", () => {
    it("shows who ordered what, for how much", async () => {
      await renderAdminPage();

      expect(await screen.findByText("Buyer One (buyer)")).toBeInTheDocument();
      expect(screen.getByText(/2 × Green tea/)).toBeInTheDocument();
      expect(screen.getByText("25.00 USDT")).toBeInTheDocument();
      // Scoped to the table: "PENDING" is also one of the filter options.
      expect(
        within(screen.getByRole("table")).getByText("PENDING"),
      ).toBeInTheDocument();
    });

    it("shows the price each article was actually bought at", async () => {
      await renderAdminPage();

      // The unit price is the snapshot from checkout, not today's price.
      expect(await screen.findByText(/12\.50 USDT/)).toBeInTheDocument();
    });

    it("falls back to the buyer id when the buyer was not joined in", async () => {
      await renderAdminPage([order({ buyer: null })]);

      expect(await screen.findByText("c0000000")).toBeInTheDocument();
    });

    it("renders the order in the currency it was paid in", async () => {
      await renderAdminPage([order({ currency: "ETH", total: 0.5 })]);

      expect(await screen.findByText("0.50 ETH")).toBeInTheDocument();
    });

    it("says the shop has had no orders yet", async () => {
      await renderAdminPage([]);

      expect(await screen.findByText("No orders to show")).toBeInTheDocument();
    });

    it("shows what went wrong when the orders cannot be loaded", async () => {
      orderServiceMock.list.mockRejectedValue(
        new ApiError("Cannot reach the shop. Please try again.", 0),
      );

      renderAs(ADMIN_USER, <AdminOrdersPage />);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Cannot reach the shop. Please try again.",
      );
    });
  });

  describe("filtering by status", () => {
    it("asks the backend for that status only", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.selectOptions(screen.getByLabelText("Status"), "PAID");

      await waitFor(() =>
        expect(orderServiceMock.list).toHaveBeenLastCalledWith({
          page: 1,
          limit: 20,
          status: "PAID",
        }),
      );
    });

    it("drops the filter again when the admin picks All", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      await user.selectOptions(screen.getByLabelText("Status"), "PAID");
      await user.selectOptions(screen.getByLabelText("Status"), "ALL");

      await waitFor(() =>
        expect(orderServiceMock.list).toHaveBeenLastCalledWith({
          page: 1,
          limit: 20,
          status: undefined,
        }),
      );
    });

    it("explains an empty result rather than looking broken", async () => {
      const user = userEvent.setup();
      await renderAdminPage();

      orderServiceMock.list.mockResolvedValue(pageOf([]));
      await user.selectOptions(screen.getByLabelText("Status"), "FAILED");

      expect(
        await screen.findByText("No order currently has the status FAILED."),
      ).toBeInTheDocument();
    });
  });

  describe("paging", () => {
    it("asks for the next page", async () => {
      const user = userEvent.setup();
      orderServiceMock.list.mockResolvedValue(
        pageOf([order()], { total: 40, page: 1, totalPages: 2 }),
      );
      renderAs(ADMIN_USER, <AdminOrdersPage />);

      await user.click(await screen.findByRole("button", { name: "Next" }));

      await waitFor(() =>
        expect(orderServiceMock.list).toHaveBeenLastCalledWith({
          page: 2,
          limit: 20,
          status: undefined,
        }),
      );
    });

    it("cannot page back past the first page", async () => {
      orderServiceMock.list.mockResolvedValue(
        pageOf([order()], { total: 40, page: 1, totalPages: 2 }),
      );
      renderAs(ADMIN_USER, <AdminOrdersPage />);

      expect(await screen.findByRole("button", { name: "Previous" })).toBeDisabled();
    });
  });
});
