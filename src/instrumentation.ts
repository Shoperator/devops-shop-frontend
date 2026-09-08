import { registerOTel } from "@vercel/otel";

// Next runs this once on server startup. @vercel/otel reads the OTEL_* env the
// operator injects (endpoint, service name) and ships server-side traces
// (SSR + route handlers) to Tempo. No config needed beyond this.
export function register() {
  registerOTel();
}