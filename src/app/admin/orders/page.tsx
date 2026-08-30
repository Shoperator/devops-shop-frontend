"use client";

import { useCallback, useState } from "react";
import Pagination from "@/components/Pagination";
import RequireAuth from "@/components/RequireAuth";
import { formatAmount, formatDateTime, shortId } from "@/lib/format";
import { usePagedResource } from "@/lib/usePagedResource";
import type { OrderDto, OrderStatus } from "@/services/dto/order.dto";
import { ORDER_STATUSES } from "@/services/dto/order.dto";
import { DEFAULT_PAGE_SIZE } from "@/services/dto/page.dto";
import { orderService } from "@/services/orderService";

const ALL_STATUSES = "ALL";

/** A paid order reads as success, a failed one as a problem worth spotting. */
const STATUS_CHIP: Record<OrderStatus, string> = {
  PENDING: "chip chip-pending",
  PAID: "chip chip-success",
  CANCELLED: "chip",
  FAILED: "chip chip-danger",
};

function buyerLabel(order: OrderDto): string {
  // The relation is loaded for this listing; the id is the honest fallback if
  // it ever is not.
  return order.buyer === null
    ? shortId(order.buyerId)
    : `${order.buyer.displayName} (${order.buyer.username})`;
}

function OrdersAdmin() {
  const [pageNumber, setPageNumber] = useState(1);
  const [status, setStatus] = useState<OrderStatus | typeof ALL_STATUSES>(
    ALL_STATUSES,
  );

  const fetchPage = useCallback(
    () =>
      orderService.list({
        page: pageNumber,
        limit: DEFAULT_PAGE_SIZE,
        status: status === ALL_STATUSES ? undefined : status,
      }),
    [pageNumber, status],
  );

  const { page, isLoading, error } = usePagedResource(fetchPage);

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setPageNumber(1);
    setStatus(event.target.value as OrderStatus | typeof ALL_STATUSES);
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">
          Every order customers placed in this shop, newest first.
        </p>
      </header>

      <div className="toolbar">
        <label className="form-label" htmlFor="order-status">
          Status
        </label>
        <select
          id="order-status"
          className="form-input toolbar-select"
          value={status}
          onChange={handleStatusChange}
        >
          <option value={ALL_STATUSES}>All</option>
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="card card-flush">
        {isLoading && page === null ? (
          <div className="empty-state">
            <p className="empty-state-text">Loading orders…</p>
          </div>
        ) : page !== null && page.items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No orders to show</p>
            <p className="empty-state-text">
              {status === ALL_STATUSES
                ? "As soon as a customer checks out, the order shows up here."
                : `No order currently has the status ${status}.`}
            </p>
          </div>
        ) : page !== null ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Buyer</th>
                  <th scope="col">Articles</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Placed</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-sm">{shortId(order.id)}</td>
                    <td>{buyerLabel(order)}</td>
                    <td>
                      <ul className="cell-list">
                        {order.items.map((item, index) => (
                          // The article id alone is not guaranteed unique
                          // within an order, so the position completes the key.
                          <li key={`${item.articleId}-${index}`}>
                            {item.quantity} × {item.articleName}
                            <span className="cell-subtext-inline">
                              {" "}
                              @ {formatAmount(item.unitPrice, order.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>{formatAmount(order.total, order.currency)}</td>
                    <td>
                      <span className={STATUS_CHIP[order.status]}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {page !== null && page.items.length > 0 && (
        <Pagination
          page={page}
          onPageChange={setPageNumber}
          itemLabel="orders"
        />
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <RequireAuth role="ADMIN">
      <OrdersAdmin />
    </RequireAuth>
  );
}
