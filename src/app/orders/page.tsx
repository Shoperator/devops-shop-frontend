import RequireAuth from "@/components/RequireAuth";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">My orders</h1>
          <p className="page-subtitle">
            Everything you bought from this shop, newest first.
          </p>
        </header>

        <div className="card card-flush">
          <div className="empty-state">
            <p className="empty-state-title">No orders yet</p>
            <p className="empty-state-text">
              Once you buy something from the catalogue, the order and its
              payment status show up here.
            </p>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
