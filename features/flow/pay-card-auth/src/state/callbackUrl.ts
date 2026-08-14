import type { PayCardAuthCallback } from "./types";

/**
 * Reads the redirect the secure browser reports back. The mobile app hands the flow an already
 * parsed callback, because react-navigation parses the deep link for it; this is the other source,
 * where the OS session answers with the raw URL it stopped on.
 *
 * `ledgerlive://paytab?code=…&state=…` is not a hierarchical URL, so `URL` cannot be trusted to
 * expose its query. The query is read from the string itself.
 */
export function parseCallbackUrl(url: string): PayCardAuthCallback | null {
  const query = url.slice(url.indexOf("?") + 1);
  if (!url.includes("?") || !query) {
    return null;
  }

  const params = new URLSearchParams(query);
  const code = params.get("code");
  const state = params.get("state");

  return code && state ? { code, state } : null;
}
