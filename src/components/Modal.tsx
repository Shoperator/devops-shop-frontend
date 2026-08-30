"use client";

import { useEffect, useRef } from "react";

/**
 * A modal dialog. Deliberately a plain element rather than `<dialog>`: the
 * native element's focus and backdrop behaviour still differs between browsers,
 * and the shop is served to whatever browser the customer's admin happens to
 * use.
 */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Moves the keyboard into the dialog, so a tab press does not walk the page
  // behind it.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-backdrop"
      // A click on the backdrop closes; a click inside the panel must not
      // bubble out and close it too.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="card modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="section-title modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
