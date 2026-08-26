import { clearSession, getStoredToken } from "@/lib/authStorage";
import { getApiBaseUrl } from "./apiConstants";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the stored access token along with the request. */
  authenticated?: boolean;
}

/** Nest replies with `{ message: string | string[] }` for handled errors. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    const { message } = payload as { message?: string | string[] };
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
  } catch {
    // Empty or non-JSON body, fall through to the generic message.
  }
  return `Request failed with status ${response.status}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, authenticated = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (authenticated) {
    const token = getStoredToken();
    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the shop. Please try again.", 0);
  }

  if (!response.ok) {
    // An expired or revoked token should not keep the UI looking signed in.
    if (response.status === 401 && authenticated) {
      clearSession();
    }
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
