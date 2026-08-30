"use client";

import Link from "next/link";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { useBasket } from "@/context/BasketContext";
import { formatAmount, shortId } from "@/lib/format";
import { ApiError } from "@/services/api";
import type { OrderDto } from "@/services/dto/order.dto";
import { orderService } from "@/services/orderService";

function confirmationMessage(order: OrderDto): string {
  return [
    `Order ${shortId(order.id)} placed.`,
    `Total: ${formatAmount(order.total, order.currency)}`,
    `Status: ${order.status}`,
  ].join("\n");
}

function Basket() {
  const { items, total, count, remove, clear } = useBasket();
  const [isBuying, setIsBuying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleBuy() {
    setIsBuying(true);
    try {
      const order = await orderService.checkout({
        // No quantity picker in the basket, so every line is a single piece.
        items: items.map((item) => ({ articleId: item.articleId, quantity: 1 })),
      });

      window.alert(confirmationMessage(order));
      clear();
      setIsDone(true);
    } catch (caught) {
      // The basket is kept: the customer can drop whatever ran out and retry.
      window.alert(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsBuying(false);
    }
  }

  if (isDone) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">Thank you for your order</p>
            <p className="empty-state-text">
              Your basket is empty again. The order and its payment status are
              on your orders page.
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
                    {formatAmount(item.unitPrice)}
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

          <div className="basket-summary">
            <p className="basket-total">
              <span className="detail-label">Total</span>
              <span className="basket-total-value">{formatAmount(total)}</span>
            </p>
            <button
              type="button"
              className="btn btn-filled"
              onClick={() => void handleBuy()}
              disabled={isBuying}
            >
              {isBuying ? "Placing the order…" : "Buy"}
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
