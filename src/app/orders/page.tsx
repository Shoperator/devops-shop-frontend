"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Pagination from "@/components/Pagination";
import RequireAuth from "@/components/RequireAuth";
import { formatAmount, formatDateTime, shortId } from "@/lib/format";
import { usePagedResource } from "@/lib/usePagedResource";
import type { OrderStatus } from "@/services/dto/order.dto";
import { DEFAULT_PAGE_SIZE } from "@/services/dto/page.dto";
import { orderService } from "@/services/orderService";

const STATUS_CHIP: Record<OrderStatus, string> = {
  PENDING: "chip chip-pending",
  PAID: "chip chip-success",
  CANCELLED: "chip",
  FAILED: "chip chip-danger",
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  PENDING: "Waiting for payment",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  FAILED: "Payment failed",
};

function MyOrders() {
  const [pageNumber, setPageNumber] = useState(1);

  const fetchPage = useCallback(
    () => orderService.listMine({ page: pageNumber, limit: DEFAULT_PAGE_SIZE }),
    [pageNumber],
  );

  const { page, isLoading, error } = usePagedResource(fetchPage);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">My orders</h1>
        <p className="page-subtitle">
          Everything you bought from this shop, newest first.
        </p>
      </header>

      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {isLoading && page === null ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Loading your orders…</p>
          </div>
        </div>
      ) : page !== null && page.items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">No orders yet</p>
            <p className="empty-state-text">
              Once you buy something from the catalogue, the order and its
              payment status show up here.
            </p>
            <div className="empty-state-actions">
              <Link href="/" className="btn btn-filled">
                Browse the catalogue
              </Link>
            </div>
          </div>
        </div>
      ) : page !== null ? (
        <>
          <ul className="order-list">
            {page.items.map((order) => (
              <li key={order.id} className="card order-card">
                <div className="order-card-header">
                  <div>
                    <p className="order-reference font-mono text-sm">
                      {shortId(order.id)}
                    </p>
                    <p className="cell-subtext">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <span className={STATUS_CHIP[order.status]}>
                    {STATUS_TEXT[order.status]}
                  </span>
                </div>

                <ul className="cell-list">
                  {order.items.map((item, index) => (
                    // The article id alone is not guaranteed unique within an
                    // order, so the position completes the key.
                    <li key={`${item.articleId}-${index}`}>
                      {item.quantity} × {item.articleName}
                      <span className="cell-subtext-inline">
                        {" "}
                        @ {formatAmount(item.unitPrice, order.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="order-total">
                  <span className="detail-label">Total</span>
                  <span className="basket-total-value">
                    {formatAmount(order.total, order.currency)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            onPageChange={setPageNumber}
            itemLabel="orders"
          />
        </>
      ) : null}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth role="CUSTOMER">
      <MyOrders />
    </RequireAuth>
  );
}
