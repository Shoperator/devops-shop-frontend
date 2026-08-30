"use client";

import { useCallback, useState } from "react";
import ArticleForm from "@/components/admin/ArticleForm";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import RequireAuth from "@/components/RequireAuth";
import { formatAmount, formatDateTime } from "@/lib/format";
import { usePagedResource } from "@/lib/usePagedResource";
import { ApiError } from "@/services/api";
import { articleService } from "@/services/articleService";
import type { ArticleDto } from "@/services/dto/article.dto";
import { DEFAULT_PAGE_SIZE } from "@/services/dto/page.dto";

/** Which modal is open, if any. `article: null` means "create a new one". */
type Editing = { article: ArticleDto | null };

function ArticleAdmin() {
  const [pageNumber, setPageNumber] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ArticleDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPage = useCallback(
    () =>
      articleService.list({
        page: pageNumber,
        limit: DEFAULT_PAGE_SIZE,
        search: search === "" ? undefined : search,
      }),
    [pageNumber, search],
  );

  const { page, isLoading, error, reload } = usePagedResource(fetchPage);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageNumber(1);
    setSearch(searchInput.trim());
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPageNumber(1);
  }

  function handleSaved() {
    setEditing(null);
    reload();
  }

  async function handleConfirmDelete() {
    if (deleting === null) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await articleService.remove(deleting.id);
      setDeleting(null);

      // Removing the last row of a page would leave the admin staring at an
      // empty table, so step back to the page that still has articles. The new
      // page number re-runs the fetch on its own.
      if (page !== null && page.items.length === 1 && page.page > 1) {
        setPageNumber(page.page - 1);
      } else {
        reload();
      }
    } catch (caught) {
      setDeleteError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <div>
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">
            Everything this shop sells. Add, restock, reprice or remove an
            article.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-filled"
          onClick={() => setEditing({ article: null })}
        >
          New article
        </button>
      </header>

      <form className="toolbar" onSubmit={handleSearch} role="search">
        <input
          className="form-input toolbar-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or description"
          aria-label="Search articles"
        />
        <button type="submit" className="btn btn-outlined">
          Search
        </button>
        {search !== "" && (
          <button
            type="button"
            className="btn btn-text"
            onClick={handleClearSearch}
          >
            Clear
          </button>
        )}
      </form>

      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="card card-flush">
        {isLoading && page === null ? (
          <div className="empty-state">
            <p className="empty-state-text">Loading articles…</p>
          </div>
        ) : page !== null && page.items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">
              {search === "" ? "No articles yet" : "Nothing matched"}
            </p>
            <p className="empty-state-text">
              {search === ""
                ? "Add the first article and it shows up in the shop right away."
                : `No article matches "${search}".`}
            </p>
          </div>
        ) : page !== null ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Article</th>
                  <th scope="col">Price</th>
                  <th scope="col">In stock</th>
                  <th scope="col">Last change</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <span className="cell-title">{article.name}</span>
                      {article.description !== null && (
                        <span className="cell-subtext">
                          {article.description}
                        </span>
                      )}
                    </td>
                    <td>{formatAmount(article.price)}</td>
                    <td>
                      {article.inStock ? (
                        <span className="chip chip-success">
                          {article.quantity} pcs
                        </span>
                      ) : (
                        <span className="chip chip-danger">Out of stock</span>
                      )}
                    </td>
                    <td>{formatDateTime(article.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-text"
                          onClick={() => setEditing({ article })}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-text btn-danger"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(article);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {page !== null && page.items.length > 0 && (
        <Pagination
          page={page}
          onPageChange={setPageNumber}
          itemLabel="articles"
        />
      )}

      {editing !== null && (
        <Modal
          title={editing.article === null ? "New article" : "Edit article"}
          onClose={() => setEditing(null)}
        >
          <ArticleForm
            article={editing.article}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting !== null && (
        <Modal title="Delete article" onClose={() => setDeleting(null)}>
          <p className="modal-text">
            Delete <strong>{deleting.name}</strong>? Customers stop seeing it
            immediately. Orders that already contain it keep their own copy of
            the name and price, so past orders are unaffected.
          </p>
          {deleteError !== null && (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-text"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-filled btn-filled-danger"
              onClick={() => void handleConfirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminArticlesPage() {
  return (
    <RequireAuth role="ADMIN">
      <ArticleAdmin />
    </RequireAuth>
  );
}
