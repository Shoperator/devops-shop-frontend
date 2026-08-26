"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  clearSession,
  getServerUser,
  getStoredUser,
  storeSession,
  subscribeToSession,
} from "@/lib/authStorage";
import type { UserDto } from "@/services/dto/user.dto";

interface AuthContextValue {
  user: UserDto | null;
  isAuthenticated: boolean;
  /** True until the stored session has been read on the client. */
  isLoading: boolean;
  signIn: (user: UserDto, accessToken: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const isHydratedOnClient = () => true;
const isHydratedOnServer = () => false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The session lives in localStorage, which is an external store: the server
  // renders it as signed out and React swaps in the real value after hydration.
  const user = useSyncExternalStore(
    subscribeToSession,
    getStoredUser,
    getServerUser,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToSession,
    isHydratedOnClient,
    isHydratedOnServer,
  );

  const signIn = useCallback((nextUser: UserDto, accessToken: string) => {
    storeSession(nextUser, accessToken);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading: !isHydrated,
      signIn,
      signOut,
    }),
    [user, isHydrated, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
