import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addToBasket, getStoredBasket } from "@/lib/basketStorage";
import { ApiError } from "@/services/api";
import type { OrderDto } from "@/services/dto/order.dto";
import { orderService } from "@/services/orderService";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import BasketPage from "./page";

jest.mock("@/services/orderService");

const orderServiceMock = jest.mocked(orderService);

const TEA = {
  articleId: "a0000000-0000-4000-8000-000000000001",
  name: "Green tea",
  unitPrice: 12.5,
};

const MUG = {
  articleId: "a0000000-0000-4000-8000-000000000002",
  name: "Mug",
  unitPrice: 4.2,
};

function order(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: "b0000000-0000-4000-8000-000000000001",
    buyerId: CUSTOMER_USER.id,
    buyer: null,
    items: [
      {
        articleId: TEA.articleId,
        articleName: "Green tea",
        unitPrice: 12.5,
        quantity: 1,
      },
    ],
    total: 12.5,
    currency: "USDT",
    status: "PENDING",
    walletAddress: null,
    transactionHash: null,
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
    ...overrides,
  };
}

describe("BasketPage", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => undefined);
    orderServiceMock.checkout.mockResolvedValue(order());
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("keeps the admin out — the basket is a customer thing", () => {
    renderAs(ADMIN_USER, <BasketPage />);

    expect(
      screen.getByText("This page is for the shop admin"),
    ).toBeInTheDocument();
  });

  describe("an empty basket", () => {
    it("says so and points back at the catalogue", () => {
      renderAs(CUSTOMER_USER, <BasketPage />);

      expect(screen.getByText("Your basket is empty")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to the catalogue" }),
      ).toHaveAttribute("href", "/");
      expect(screen.queryByRole("button", { name: "Buy" })).not.toBeInTheDocument();
    });
  });

  describe("a filled basket", () => {
    beforeEach(() => {
      addToBasket(TEA);
      addToBasket(MUG);
    });

    it("lists what is in it", () => {
      renderAs(CUSTOMER_USER, <BasketPage />);

      expect(screen.getByText("Green tea")).toBeInTheDocument();
      expect(screen.getByText("Mug")).toBeInTheDocument();
      expect(screen.getByText("12.50 USDT")).toBeInTheDocument();
      expect(screen.getByText("4.20 USDT")).toBeInTheDocument();
    });

    it("adds the lines up", () => {
      renderAs(CUSTOMER_USER, <BasketPage />);

      expect(screen.getByText("16.70 USDT")).toBeInTheDocument();
    });

    it("takes an article back out", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(
        screen.getByRole("button", {
          name: "Remove Green tea from the basket",
        }),
      );

      expect(screen.queryByText("Green tea")).not.toBeInTheDocument();
      expect(screen.getByText("Mug")).toBeInTheDocument();
      expect(getStoredBasket()).toEqual([MUG]);
    });
  });

  describe("buying", () => {
    beforeEach(() => {
      addToBasket(TEA);
    });

    it("sends one line per article, a single piece each", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      await waitFor(() =>
        expect(orderServiceMock.checkout).toHaveBeenCalledWith({
          items: [{ articleId: TEA.articleId, quantity: 1 }],
        }),
      );
    });

    it("shows the order the backend created in an alert", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      await waitFor(() => expect(alertSpy).toHaveBeenCalled());
      const message = alertSpy.mock.calls[0][0] as string;
      expect(message).toContain("b0000000");
      expect(message).toContain("12.50 USDT");
      expect(message).toContain("PENDING");
    });

    it("empties the basket once the order is placed", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      await waitFor(() => expect(getStoredBasket()).toEqual([]));
    });

    it("offers the way back to the catalogue", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      expect(
        await screen.findByText("Thank you for your order"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to the catalogue" }),
      ).toHaveAttribute("href", "/");
    });

    it("reports what the shop said when the article ran out", async () => {
      const user = userEvent.setup();
      orderServiceMock.checkout.mockRejectedValue(
        new ApiError('"Green tea" does not have 1 piece(s) left', 409),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          '"Green tea" does not have 1 piece(s) left',
        ),
      );
    });

    it("keeps the basket when the order failed, so the customer can retry", async () => {
      const user = userEvent.setup();
      orderServiceMock.checkout.mockRejectedValue(
        new ApiError("Cannot reach the shop. Please try again.", 0),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      await waitFor(() => expect(alertSpy).toHaveBeenCalled());
      expect(getStoredBasket()).toEqual([TEA]);
      expect(screen.getByRole("button", { name: "Buy" })).toBeEnabled();
    });
  });
});
