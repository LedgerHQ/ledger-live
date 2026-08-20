import type { PayCardAuthCallback } from "./types";

/**
 * Reads the redirect the secure browser reports back. The mobile app hands the flow an already
 * parsed callback, because react-navigation parses the deep link for it; this is the other source,
 * where the OS session answers with the raw URL it stopped on.
 *
 * `ledgerlive://paytab?code=…` is not a hierarchical URL, so `URL` cannot be trusted to expose its
 * query. The query is read from the string itself.
 *
 * The redirect also carries `app_id`, which nothing here needs: PKCE already ties the code to the
 * verifier on disk.
 */
export function parseCallbackUrl(url: string): PayCardAuthCallback | null {
  const query = url.slice(url.indexOf("?") + 1);
  if (!url.includes("?") || !query) {
    return null;
  }

  const code = new URLSearchParams(query).get("code");

  return code ? { code } : null;
}
