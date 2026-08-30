"use client";

import { useState } from "react";
import { ApiError } from "@/services/api";
import { articleService } from "@/services/articleService";
import type {
  ArticleDto,
  CreateArticleRequestDto,
  UpdateArticleRequestDto,
} from "@/services/dto/article.dto";

/** The form keeps raw strings; number inputs hand back text either way. */
interface FormValues {
  name: string;
  description: string;
  price: string;
  quantity: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function toFormValues(article: ArticleDto | null): FormValues {
  return {
    name: article?.name ?? "",
    description: article?.description ?? "",
    price: article === null ? "" : String(article.price),
    quantity: article === null ? "" : String(article.quantity),
  };
}

/**
 * An empty text field means "no value", not an empty string: the backend stores
 * whatever it is sent, and an article would end up with a blank description
 * instead of none.
 */
function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Only the fields whose value really differs from the article as it was loaded.
 */
function changedFields(
  article: ArticleDto,
  next: CreateArticleRequestDto,
): UpdateArticleRequestDto {
  const changes: UpdateArticleRequestDto = {};

  if (next.name !== article.name) {
    changes.name = next.name;
  }
  if ((next.description ?? null) !== article.description) {
    changes.description = next.description;
  }
  if (next.price !== article.price) {
    changes.price = next.price;
  }
  if (next.quantity !== article.quantity) {
    changes.quantity = next.quantity;
  }

  return changes;
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.trim() === "") {
    errors.name = "A name is required";
  }

  const price = Number(values.price);
  if (values.price.trim() === "" || Number.isNaN(price)) {
    errors.price = "A price is required";
  } else if (price < 0) {
    errors.price = "The price cannot be negative";
  } else if (Math.round(price * 100) !== price * 100) {
    // The column is numeric(18, 2), so a third decimal would be lost.
    errors.price = "At most two decimal places";
  }

  const quantity = Number(values.quantity);
  if (values.quantity.trim() === "" || Number.isNaN(quantity)) {
    errors.quantity = "A number of pieces is required";
  } else if (!Number.isInteger(quantity)) {
    errors.quantity = "Whole pieces only";
  } else if (quantity < 0) {
    errors.quantity = "The stock cannot be negative";
  }

  return errors;
}

/**
 * Creates a new article, or edits the one passed in. The backend is the real
 * authority on what is valid; the checks here only save a round trip.
 */
export default function ArticleForm({
  article,
  onSaved,
  onCancel,
}: {
  article: ArticleDto | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(article));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload: CreateArticleRequestDto = {
      name: values.name.trim(),
      description: blankToNull(values.description),
      price: Number(values.price),
      quantity: Number(values.quantity),
    };

    setIsSaving(true);
    try {
      if (article === null) {
        await articleService.create(payload);
      } else {
        const changes = changedFields(article, payload);
        if (Object.keys(changes).length > 0) {
          await articleService.update(article.id, changes);
        }
      }
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong. Please try again.",
      );
      setIsSaving(false);
    }
  }

  return (
    <form className="form-fields" onSubmit={handleSubmit} noValidate>
      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-field">
        <label className="form-label" htmlFor="article-name">
          Name
        </label>
        <input
          id="article-name"
          className="form-input"
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          autoComplete="off"
        />
        {fieldErrors.name !== undefined && (
          <p className="form-field-error">{fieldErrors.name}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="article-description">
          Description
        </label>
        <textarea
          id="article-description"
          className="form-input form-textarea"
          rows={3}
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="article-price">
            Price (USDT)
          </label>
          <input
            id="article-price"
            className="form-input"
            type="number"
            step="0.01"
            min="0"
            value={values.price}
            onChange={(event) => setField("price", event.target.value)}
          />
          {fieldErrors.price !== undefined && (
            <p className="form-field-error">{fieldErrors.price}</p>
          )}
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="article-quantity">
            Pieces in stock
          </label>
          <input
            id="article-quantity"
            className="form-input"
            type="number"
            step="1"
            min="0"
            value={values.quantity}
            onChange={(event) => setField("quantity", event.target.value)}
          />
          {fieldErrors.quantity !== undefined && (
            <p className="form-field-error">{fieldErrors.quantity}</p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-text" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-filled" disabled={isSaving}>
          {isSaving ? "Saving…" : article === null ? "Add article" : "Save"}
        </button>
      </div>
    </form>
  );
}
