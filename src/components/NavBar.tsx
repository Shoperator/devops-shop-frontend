"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getShopName } from "@/config/shop";
import { useAuth } from "@/context/AuthContext";

const SIGNED_IN_PAGES = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "My orders" },
  { href: "/account", label: "Account" },
];

const SIGNED_OUT_PAGES = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

/** Only ever rendered for the shop admin; the backend enforces the same rule. */
const ADMIN_PAGES = [
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/orders", label: "Orders" },
];

function initials(displayName: string): string {
  const [first = "", second = ""] = displayName.trim().split(/\s+/);
  return first.charAt(0) + second.charAt(0) || "?";
}

export default function NavBar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click, the way a Material menu behaves.
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const displayName = user?.displayName ?? "Guest";
  const pages = isAuthenticated ? SIGNED_IN_PAGES : SIGNED_OUT_PAGES;
  const isAdmin = user?.role === "ADMIN";
  const shopName = getShopName();

  function handleSignOut() {
    signOut();
    setIsMenuOpen(false);
    router.push("/");
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">
          <span className="navbar-logo" aria-hidden="true">
            {shopName.charAt(0).toUpperCase()}
          </span>
          <span>{shopName}</span>
        </Link>

        <div className="navbar-user" ref={menuRef}>
          <button
            type="button"
            className="navbar-user-button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <span className="navbar-avatar" aria-hidden="true">
              {initials(displayName)}
            </span>
            <span>{displayName}</span>
            {isAdmin && <span className="chip chip-success">Admin</span>}
            <span className="navbar-caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {isMenuOpen && (
            <div className="navbar-menu" role="menu">
              <p className="navbar-menu-label">Pages</p>
              {pages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  role="menuitem"
                  className="navbar-menu-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {page.label}
                </Link>
              ))}

              {isAdmin && (
                <>
                  <div className="navbar-menu-separator" />
                  <p className="navbar-menu-label">Manage shop</p>
                  {ADMIN_PAGES.map((page) => (
                    <Link
                      key={page.href}
                      href={page.href}
                      role="menuitem"
                      className="navbar-menu-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {page.label}
                    </Link>
                  ))}
                </>
              )}

              {isAuthenticated && (
                <>
                  <div className="navbar-menu-separator" />
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-menu-item navbar-menu-danger"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
