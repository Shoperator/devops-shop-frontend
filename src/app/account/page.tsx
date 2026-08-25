"use client";

import { useAuth } from "@/context/AuthContext";

const PLACEHOLDER = "—";

export default function AccountPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Account</h1>
        <p className="page-subtitle">
          The details this shop keeps about you and the wallet you pay from.
        </p>
      </header>

      {isLoading ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Loading your account…</p>
          </div>
        </div>
      ) : user === null ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">You are not signed in</p>
            <p className="empty-state-text">
              Sign in to see your profile, your wallet address and the orders
              tied to this account.
            </p>
          </div>
        </div>
      ) : (
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
              <span className="chip chip-success">{user.role}</span>
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Wallet address</span>
            <span className="detail-value font-mono text-sm">
              {user.walletAddress ?? PLACEHOLDER}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
