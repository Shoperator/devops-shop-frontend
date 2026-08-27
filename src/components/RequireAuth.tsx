"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/services/dto/user.dto";

/**
 * Wraps a page that only makes sense for a signed-in user. The session is read
 * from localStorage, so the check can only happen after hydration.
 *
 * With `role`, the page is further restricted to that role. This is a UX guard
 * only — the token is what the backend trusts, and it enforces the same rule.
 */
export default function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: UserRole;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">
              {isLoading ? "Checking your session…" : "Taking you to sign in…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Signed in, but as somebody else: say so instead of bouncing them to a sign
  // in form they have already completed.
  if (role !== undefined && user?.role !== role) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">This page is for the shop admin</p>
            <p className="empty-state-text">
              Your account does not manage this shop. If that is unexpected,
              sign in with the shop owner account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
