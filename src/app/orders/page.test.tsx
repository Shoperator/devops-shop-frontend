import { screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/services/api";
import type { OrderDto } from "@/services/dto/order.dto";
import type { PageDto } from "@/services/dto/page.dto";
import { orderService } from "@/services/orderService";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import OrdersPage from "./page";

jest.mock("@/services/orderService");

const orderServiceMock = jest.mocked(orderService);

function order(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: "b0000000-0000-4000-8000-000000000001",
    buyerId: CUSTOMER_USER.id,
    buyer: null,
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

function pageOf(items: OrderDto[]): PageDto<OrderDto> {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 20,
    totalPages: items.length === 0 ? 0 : 1,
  };
}

describe("OrdersPage", () => {
  beforeEach(() => {
    orderServiceMock.listMine.mockResolvedValue(pageOf([order()]));
  });

  it("asks only for the signed-in customer's own orders", async () => {
    renderAs(CUSTOMER_USER, <OrdersPage />);

    await waitFor(() =>
      expect(orderServiceMock.listMine).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      }),
    );
    // Never the whole shop's listing, which is the admin's endpoint.
    expect(orderServiceMock.list).not.toHaveBeenCalled();
  });

  it("keeps the admin out — they have the shop-wide listing instead", () => {
    renderAs(ADMIN_USER, <OrdersPage />);

    expect(
      screen.getByText("This page is for the shop admin"),
    ).toBeInTheDocument();
    expect(orderServiceMock.listMine).not.toHaveBeenCalled();
  });

  it("shows what was bought and what it cost", async () => {
    renderAs(CUSTOMER_USER, <OrdersPage />);

    expect(await screen.findByText(/2 × Green tea/)).toBeInTheDocument();
    expect(screen.getByText("25.00 USDT")).toBeInTheDocument();
    expect(screen.getByText("b0000000")).toBeInTheDocument();
  });

  it("explains the payment status in words, not in an enum", async () => {
    renderAs(CUSTOMER_USER, <OrdersPage />);

    expect(await screen.findByText("Waiting for payment")).toBeInTheDocument();
  });

  it("marks a settled order as paid", async () => {
    orderServiceMock.listMine.mockResolvedValue(
      pageOf([order({ status: "PAID" })]),
    );

    renderAs(CUSTOMER_USER, <OrdersPage />);

    expect(await screen.findByText("Paid")).toBeInTheDocument();
  });

  it("invites a customer with no orders to go shopping", async () => {
    orderServiceMock.listMine.mockResolvedValue(pageOf([]));

    renderAs(CUSTOMER_USER, <OrdersPage />);

    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse the catalogue" }),
    ).toHaveAttribute("href", "/");
  });

  it("shows what went wrong when the orders cannot be loaded", async () => {
    orderServiceMock.listMine.mockRejectedValue(
      new ApiError("Cannot reach the shop. Please try again.", 0),
    );

    renderAs(CUSTOMER_USER, <OrdersPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot reach the shop. Please try again.",
    );
  });
});
