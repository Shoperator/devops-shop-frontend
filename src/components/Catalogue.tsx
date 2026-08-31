"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useBasket } from "@/context/BasketContext";
import { formatAmount } from "@/lib/format";
import { usePagedResource } from "@/lib/usePagedResource";
import { articleService } from "@/services/articleService";
import type { ArticleDto } from "@/services/dto/article.dto";
import { DEFAULT_PAGE_SIZE } from "@/services/dto/page.dto";

/**
 * What a visitor can do with an article depends on who they are: customers buy,
 * the admin manages the catalogue elsewhere, and a visitor has to sign in first.
 */
function AddToBasket({ article }: { article: ArticleDto }) {
  const { user, isAuthenticated } = useAuth();
  const { contains, add } = useBasket();

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="btn btn-outlined article-action">
        Sign in to buy
      </Link>
    );
  }

  // The shop owner manages this catalogue rather than buying from it, and the
  // backend refuses an order from an admin token anyway.
  if (user?.role !== "CUSTOMER") {
    return null;
  }

  if (!article.inStock) {
    return (
      <button type="button" className="btn btn-filled article-action" disabled>
        Out of stock
      </button>
    );
  }

  if (contains(article.id)) {
    return (
      <button type="button" className="btn btn-outlined article-action" disabled>
        In basket
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-filled article-action"
      onClick={() =>
        add({
          articleId: article.id,
          name: article.name,
          unitPrice: article.price,
        })
      }
    >
      Add to basket
    </button>
  );
}

export default function Catalogue() {
  const [pageNumber, setPageNumber] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchPage = useCallback(
    () =>
      articleService.list({
        page: pageNumber,
        limit: DEFAULT_PAGE_SIZE,
        search: search === "" ? undefined : search,
      }),
    [pageNumber, search],
  );

  const { page, isLoading, error } = usePagedResource(fetchPage);

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

  return (
    <section id="catalogue">
      <h2 className="section-title">Catalogue</h2>

      <form className="toolbar" onSubmit={handleSearch} role="search">
        <input
          className="form-input toolbar-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search the shop"
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

      {isLoading && page === null ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-text">Loading the catalogue…</p>
          </div>
        </div>
      ) : page !== null && page.items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">
              {search === "" ? "Nothing on the shelves yet" : "Nothing matched"}
            </p>
            <p className="empty-state-text">
              {search === ""
                ? "The shop owner has not published any articles so far. Check back soon."
                : `No article matches "${search}".`}
            </p>
          </div>
        </div>
      ) : page !== null ? (
        <>
          <ul className="catalogue-grid">
            {page.items.map((article) => (
              <li key={article.id} className="card article-card">
                <div>
                  <h3 className="article-name">{article.name}</h3>
                  {article.description !== null && (
                    <p className="article-description">{article.description}</p>
                  )}
                </div>
                <div className="article-footer">
                  <div>
                    <p className="article-price">
                      {formatAmount(article.price)}
                    </p>
                    {article.inStock ? (
                      <span className="chip chip-success">
                        {article.quantity} left
                      </span>
                    ) : (
                      <span className="chip chip-danger">Out of stock</span>
                    )}
                  </div>
                  <AddToBasket article={article} />
                </div>
              </li>
            ))}
          </ul>
          {page.items.length > 0 && (
            <Pagination
              page={page}
              onPageChange={setPageNumber}
              itemLabel="articles"
            />
          )}
        </>
      ) : null}
    </section>
  );
}
