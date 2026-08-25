"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SHOP_NAME } from "@/config/shop";
import { useAuth } from "@/context/AuthContext";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/orders", label: "My orders" },
  { href: "/account", label: "Account" },
];

function initials(displayName: string): string {
  const [first = "", second = ""] = displayName.trim().split(/\s+/);
  return (first.charAt(0) + second.charAt(0)) || "?";
}

export default function NavBar() {
  const { user, isAuthenticated, signOut } = useAuth();
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">
          <span className="navbar-logo" aria-hidden="true">
            {SHOP_NAME.charAt(0).toUpperCase()}
          </span>
          <span>{SHOP_NAME}</span>
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
            <span className="navbar-caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {isMenuOpen && (
            <div className="navbar-menu" role="menu">
              <p className="navbar-menu-label">Pages</p>
              {PAGES.map((page) => (
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

              {isAuthenticated && (
                <>
                  <div className="navbar-menu-separator" />
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-menu-item navbar-menu-danger"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
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
