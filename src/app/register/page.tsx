"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getShopName } from "@/config/shop";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";
import { authService } from "@/services/authService";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({ username, displayName, password });
      // Signing straight in saves the customer from retyping what they just chose.
      const session = await authService.login({ username, password });
      signIn(session.user, session.accessToken);
      router.push("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <div className="card form-card">
        <h1 className="form-title">Create account</h1>
        <p className="form-lead">Start shopping at {getShopName()}.</p>

        <form className="form-fields" onSubmit={handleSubmit} noValidate>
          {error !== null && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              className="form-input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
            <span className="form-hint">Shown in the navigation bar.</span>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="form-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              pattern="[a-zA-Z0-9._\-]+"
              minLength={3}
              maxLength={64}
              required
            />
            <span className="form-hint">
              Letters, digits, dot, dash and underscore.
            </span>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
            <span className="form-hint">
              At least {MIN_PASSWORD_LENGTH} characters.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-filled form-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="form-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
