"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { useBasket } from "@/context/BasketContext";
import { formatAmount, shortId } from "@/lib/format";
import {
  connect,
  ensureChain,
  isWalletAvailable,
  sendPayment,
  WalletError,
} from "@/lib/wallet";
import { ApiError } from "@/services/api";
import type { OrderDto } from "@/services/dto/order.dto";
import type { PaymentConfigDto } from "@/services/dto/payment.dto";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";

/**
 * Buying is two beats, not one.
 *
 * Placing the order reserves the stock and fixes the price and the address to
 * pay; only then does the wallet get involved. Keeping them apart is what makes
 * a customer who closes the tab mid-payment a recoverable case — the order
 * exists, it is PENDING, and it is on their orders page — rather than money
 * moved against nothing.
 */
type Phase = "basket" | "awaiting-payment" | "paid";

function messageFor(caught: unknown): string {
  if (caught instanceof WalletError || caught instanceof ApiError) {
    return caught.message;
  }
  return "Something went wrong. Please try again.";
}

function Basket() {
  const { items, total, count, remove, clear } = useBasket();
  const [phase, setPhase] = useState<Phase>("basket");
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [config, setConfig] = useState<PaymentConfigDto | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * The transaction already broadcast for this order, if any. Held so that
   * retrying a submission the shop could not accept yet re-checks that
   * transaction instead of sending — and paying for — another one.
   */
  const [sentHash, setSentHash] = useState<string | null>(null);

  // The extension injects `window.ethereum` into the page, so it cannot be read
  // while this renders on the server; doing it in an effect keeps the two
  // passes agreeing.
  useEffect(() => {
    setHasWallet(isWalletAvailable());
  }, []);

  useEffect(() => {
    // A shop that cannot say how it takes payment still shows its basket; the
    // payment button is what goes away.
    paymentService
      .getConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  async function handlePlaceOrder() {
    setBusy(true);
    setError(null);
    try {
      const placed = await orderService.checkout({
        // No quantity picker in the basket, so every line is a single piece.
        items: items.map((item) => ({ articleId: item.articleId, quantity: 1 })),
      });

      setOrder(placed);
      setPhase("awaiting-payment");
      // The stock is reserved and the order is on the customer's orders page,
      // so the basket has done its job.
      clear();
    } catch (caught) {
      // The basket is kept: the customer can drop whatever ran out and retry.
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (order === null || config === null || order.walletAddress === null) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // A hash already sent is never sent again. The shop can decline a
      // submission for reasons that resolve on their own — chiefly a
      // transaction that has not made it into a block yet — and paying a
      // second time to get past that would cost the customer real money.
      let hash = sentHash;
      if (hash === null) {
        const account = await connect();
        // Checked on every payment rather than once: the customer can switch
        // networks in the extension while this page is open.
        await ensureChain(config.chainId);

        hash = await sendPayment({
          from: account,
          to: order.walletAddress,
          amount: order.total,
        });
        setSentHash(hash);
      }

      // The shop verifies the transaction against the chain before it agrees
      // the order is paid, so this is the answer that matters, not the hash.
      setOrder(await orderService.confirmPayment(order.id, hash));
      setPhase("paid");
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  if (phase === "paid" && order !== null) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">Payment received</p>
            <p className="empty-state-text">
              Order {shortId(order.id)} is paid in full. The transaction is
              recorded against it on your orders page.
            </p>
            <div className="empty-state-actions">
              <Link href="/" className="btn btn-filled">
                Back to the catalogue
              </Link>
              <Link href="/orders" className="btn btn-outlined">
                My orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "awaiting-payment" && order !== null) {
    const payable = order.walletAddress !== null && config !== null;

    return (
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">Pay for your order</h1>
          <p className="page-subtitle">
            Order {shortId(order.id)} is held for you. It is yours once the
            payment is on chain.
          </p>
        </header>

        <div className="card">
          <div className="detail-row">
            <span className="detail-label">Amount</span>
            <span className="detail-value">
              {formatAmount(order.total, order.currency)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Pay to</span>
            <span className="detail-value font-mono text-sm">
              {order.walletAddress ?? "—"}
            </span>
          </div>
          {config !== null && (
            <div className="detail-row">
              <span className="detail-label">Network</span>
              <span className="detail-value">Chain {config.chainId}</span>
            </div>
          )}
        </div>

        {error !== null && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {!payable && (
          <p className="form-error" role="alert">
            This shop is not set up to take payment yet. Your order is held —
            please contact the shop.
          </p>
        )}

        {payable && !hasWallet && (
          <p className="form-error" role="alert">
            No Web3 wallet found. Install MetaMask, then pay this order from
            your orders page.
          </p>
        )}

        {sentHash !== null && (
          <p className="cell-subtext">
            Your payment has been sent as{" "}
            <span className="font-mono text-sm">{sentHash}</span>. Checking
            again will not send it a second time.
          </p>
        )}

        <div className="basket-summary">
          <button
            type="button"
            className="btn btn-filled"
            onClick={() => void handlePay()}
            disabled={busy || !payable || (!hasWallet && sentHash === null)}
          >
            {busy
              ? "Waiting for the chain…"
              : sentHash === null
                ? "Pay with your wallet"
                : "Check payment again"}
          </button>
          <Link href="/orders" className="btn btn-text">
            Pay later
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Basket</h1>
        <p className="page-subtitle">
          {count === 0
            ? "Nothing in here yet."
            : `${count} article${count === 1 ? "" : "s"} ready to buy.`}
        </p>
      </header>

      {count === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">Your basket is empty</p>
            <p className="empty-state-text">
              Pick something from the catalogue and it shows up here.
            </p>
            <div className="empty-state-actions">
              <Link href="/" className="btn btn-filled">
                Back to the catalogue
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card card-flush">
            <ul className="basket-list">
              {items.map((item) => (
                <li key={item.articleId} className="basket-row">
                  <span className="basket-name">{item.name}</span>
                  <span className="basket-price">
                    {formatAmount(item.unitPrice, config?.currency)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-text btn-danger"
                    onClick={() => remove(item.articleId)}
                    aria-label={`Remove ${item.name} from the basket`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {error !== null && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="basket-summary">
            <p className="basket-total">
              <span className="detail-label">Total</span>
              <span className="basket-total-value">
                {formatAmount(total, config?.currency)}
              </span>
            </p>
            <button
              type="button"
              className="btn btn-filled"
              onClick={() => void handlePlaceOrder()}
              disabled={busy}
            >
              {busy ? "Placing the order…" : "Buy"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function BasketPage() {
  return (
    <RequireAuth role="CUSTOMER">
      <Basket />
    </RequireAuth>
  );
}
