"use client";

import { useState } from "react";
import { formatAmount, formatDate, statusChipClass } from "@/lib/format";
import type { OrderDto } from "@/services/dto/order.dto";

export default function OrdersPage() {
  // Filled from orderService.getMyOrders() once the endpoint lands.
  const [orders] = useState<OrderDto[]>([]);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">My orders</h1>
        <p className="page-subtitle">
          Everything you bought from this shop, newest first.
        </p>
      </header>

      <div className="card card-flush">
        {orders.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No orders yet</p>
            <p className="empty-state-text">
              Once you buy something from the catalogue, the order and its
              payment status show up here.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs">
                      {order.id.slice(0, 8)}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.items.length}</td>
                    <td>{formatAmount(order.total, order.currency)}</td>
                    <td>
                      <span className={statusChipClass(order.status)}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
