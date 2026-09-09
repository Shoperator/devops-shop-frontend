import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addToBasket, getStoredBasket } from "@/lib/basketStorage";
import { connect, ensureChain, isWalletAvailable, sendPayment, WalletError } from "@/lib/wallet";
import { ApiError } from "@/services/api";
import type { OrderDto } from "@/services/dto/order.dto";
import type { PaymentConfigDto } from "@/services/dto/payment.dto";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import BasketPage from "./page";

jest.mock("@/services/orderService");
jest.mock("@/services/paymentService");
jest.mock("@/lib/wallet", () => ({
  ...jest.requireActual("@/lib/wallet"),
  connect: jest.fn(),
  ensureChain: jest.fn(),
  sendPayment: jest.fn(),
  isWalletAvailable: jest.fn(),
}));

const orderServiceMock = jest.mocked(orderService);
const paymentServiceMock = jest.mocked(paymentService);
const connectMock = jest.mocked(connect);
const ensureChainMock = jest.mocked(ensureChain);
const sendPaymentMock = jest.mocked(sendPayment);
const isWalletAvailableMock = jest.mocked(isWalletAvailable);

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

/** Anvil account #1, the shop's payout address. */
const SHOP_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const BUYER_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const TX = "0x1111111111111111111111111111111111111111111111111111111111111111";

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
    currency: "ETH",
    status: "PENDING",
    walletAddress: SHOP_WALLET,
    transactionHash: null,
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
    ...overrides,
  };
}

function config(overrides: Partial<PaymentConfigDto> = {}): PaymentConfigDto {
  return {
    walletAddress: SHOP_WALLET,
    chainId: 31337,
    currency: "ETH",
    enabled: true,
    ...overrides,
  };
}

/** Places the order and lands on the payment step. */
async function reachPaymentStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Buy" }));
  expect(await screen.findByText("Pay for your order")).toBeInTheDocument();
}

describe("BasketPage", () => {
  beforeEach(() => {
    orderServiceMock.checkout.mockResolvedValue(order());
    orderServiceMock.confirmPayment.mockResolvedValue(
      order({ status: "PAID", transactionHash: TX }),
    );
    paymentServiceMock.getConfig.mockResolvedValue(config());
    connectMock.mockResolvedValue(BUYER_ACCOUNT);
    ensureChainMock.mockResolvedValue(undefined);
    sendPaymentMock.mockResolvedValue(TX);
    isWalletAvailableMock.mockReturnValue(true);
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
      expect(
        screen.queryByRole("button", { name: "Buy" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("a filled basket", () => {
    beforeEach(() => {
      addToBasket(TEA);
      addToBasket(MUG);
    });

    it("lists what is in it", async () => {
      renderAs(CUSTOMER_USER, <BasketPage />);

      expect(screen.getByText("Green tea")).toBeInTheDocument();
      expect(screen.getByText("Mug")).toBeInTheDocument();
      expect(await screen.findByText("12.50 ETH")).toBeInTheDocument();
      expect(screen.getByText("4.20 ETH")).toBeInTheDocument();
    });

    it("adds the lines up", async () => {
      renderAs(CUSTOMER_USER, <BasketPage />);

      expect(await screen.findByText("16.70 ETH")).toBeInTheDocument();
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

  describe("placing the order", () => {
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

    it("empties the basket, because the stock is now reserved", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await reachPaymentStep(user);

      expect(getStoredBasket()).toEqual([]);
    });

    it("asks for payment rather than declaring the order done", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);

      await reachPaymentStep(user);

      expect(screen.getByText("12.50 ETH")).toBeInTheDocument();
      expect(screen.getByText(SHOP_WALLET)).toBeInTheDocument();
      expect(screen.getByText("Chain 31337")).toBeInTheDocument();
    });

    it("reports what the shop said when the article ran out", async () => {
      const user = userEvent.setup();
      orderServiceMock.checkout.mockRejectedValue(
        new ApiError('"Green tea" does not have 1 piece(s) left', 409),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      expect(
        await screen.findByText('"Green tea" does not have 1 piece(s) left'),
      ).toBeInTheDocument();
    });

    it("keeps the basket when the order failed, so the customer can retry", async () => {
      const user = userEvent.setup();
      orderServiceMock.checkout.mockRejectedValue(
        new ApiError("Cannot reach the shop. Please try again.", 0),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);

      await user.click(screen.getByRole("button", { name: "Buy" }));

      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
      expect(getStoredBasket()).toEqual([TEA]);
      expect(screen.getByRole("button", { name: "Buy" })).toBeEnabled();
    });
  });

  describe("paying", () => {
    beforeEach(() => {
      addToBasket(TEA);
    });

    it("switches the wallet to the shop's chain before signing anything", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      await user.click(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      );

      await waitFor(() => expect(ensureChainMock).toHaveBeenCalledWith(31337));
    });

    it("pays the address on the order, for the order's own total", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      await user.click(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      );

      await waitFor(() =>
        expect(sendPaymentMock).toHaveBeenCalledWith({
          from: BUYER_ACCOUNT,
          to: SHOP_WALLET,
          amount: 12.5,
        }),
      );
    });

    it("submits the hash and reports what the shop made of it", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      await user.click(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      );

      await waitFor(() =>
        expect(orderServiceMock.confirmPayment).toHaveBeenCalledWith(
          order().id,
          TX,
        ),
      );
      expect(await screen.findByText("Payment received")).toBeInTheDocument();
    });

    it("stays on the payment step when the customer rejects it in the wallet", async () => {
      const user = userEvent.setup();
      sendPaymentMock.mockRejectedValue(
        new WalletError("You rejected the payment in your wallet."),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      await user.click(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      );

      expect(
        await screen.findByText("You rejected the payment in your wallet."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      ).toBeEnabled();
    });

    it("re-checks the same transaction instead of paying twice", async () => {
      // The shop declines a transaction that has not been mined yet, which
      // resolves on its own. Sending a second one would cost real money.
      const user = userEvent.setup();
      orderServiceMock.confirmPayment.mockRejectedValueOnce(
        new ApiError("That transaction has not been included in a block yet.", 422),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      await user.click(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      );
      const retry = await screen.findByRole("button", {
        name: "Check payment again",
      });
      await user.click(retry);

      expect(await screen.findByText("Payment received")).toBeInTheDocument();
      expect(sendPaymentMock).toHaveBeenCalledTimes(1);
      expect(orderServiceMock.confirmPayment).toHaveBeenCalledTimes(2);
      expect(orderServiceMock.confirmPayment).toHaveBeenLastCalledWith(
        order().id,
        TX,
      );
    });

    it("does not mark the order paid when the shop rejects the transaction", async () => {
      const user = userEvent.setup();
      orderServiceMock.confirmPayment.mockRejectedValue(
        new ApiError("That transaction paid 1 wei, 12500000000000000000 wei was owed", 422),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      await user.click(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      );

      expect(
        await screen.findByText(/12500000000000000000 wei was owed/),
      ).toBeInTheDocument();
      expect(screen.queryByText("Payment received")).not.toBeInTheDocument();
    });

    it("tells a customer with no wallet what to install, without breaking the page", async () => {
      const user = userEvent.setup();
      isWalletAvailableMock.mockReturnValue(false);
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      expect(await screen.findByText(/No Web3 wallet found/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      ).toBeDisabled();
    });

    it("refuses to offer payment for an order placed with no shop wallet", async () => {
      const user = userEvent.setup();
      orderServiceMock.checkout.mockResolvedValue(
        order({ walletAddress: null }),
      );
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      expect(
        await screen.findByText(/not set up to take payment yet/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Pay with your wallet" }),
      ).toBeDisabled();
    });

    it("leaves a way to pay later, since the order is already held", async () => {
      const user = userEvent.setup();
      renderAs(CUSTOMER_USER, <BasketPage />);
      await reachPaymentStep(user);

      expect(screen.getByRole("link", { name: "Pay later" })).toHaveAttribute(
        "href",
        "/orders",
      );
    });
  });
});
