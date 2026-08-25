"use client";

import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";

const PLACEHOLDER = "—";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Shop admin",
  CUSTOMER: "Customer",
};

function AccountDetails() {
  const { user } = useAuth();

  if (user === null) {
    return null;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Account</h1>
        <p className="page-subtitle">
          The details this shop keeps about you and the wallet you pay from.
        </p>
      </header>

      <div className="card">
        <h2 className="section-title">Profile</h2>
        <div className="detail-row">
          <span className="detail-label">Display name</span>
          <span className="detail-value">{user.displayName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Username</span>
          <span className="detail-value">{user.username}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Role</span>
          <span className="detail-value">
            <span className="chip chip-success">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Wallet address</span>
          <span className="detail-value font-mono text-sm">
            {user.walletAddress ?? PLACEHOLDER}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountDetails />
    </RequireAuth>
  );
}
