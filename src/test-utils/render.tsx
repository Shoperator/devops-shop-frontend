import { render, type RenderResult } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { storeSession } from "@/lib/authStorage";
import type { UserDto } from "@/services/dto/user.dto";

export const ADMIN_USER: UserDto = {
  id: "c0000000-0000-4000-8000-000000000001",
  username: "shop-admin",
  displayName: "Shop Admin",
  role: "ADMIN",
  walletAddress: null,
};

export const CUSTOMER_USER: UserDto = {
  id: "c0000000-0000-4000-8000-000000000002",
  username: "buyer",
  displayName: "Buyer One",
  role: "CUSTOMER",
  walletAddress: null,
};

/**
 * Renders inside a real `AuthProvider` with the session already in storage,
 * which is exactly how a page finds it after a reload.
 */
export function renderAs(
  user: UserDto | null,
  ui: React.ReactElement,
): RenderResult {
  if (user !== null) {
    storeSession(user, "test-access-token");
  }
  return render(<AuthProvider>{ui}</AuthProvider>);
}
