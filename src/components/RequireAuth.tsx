"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Wraps a page that only makes sense for a signed-in customer. The session is
 * read from localStorage, so the check can only happen after hydration.
 */
export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
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

  return <>{children}</>;
}
