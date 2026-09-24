import type { PayCardAuthCallback } from "./types";

/**
 * Reads the redirect the secure browser reports back. The mobile app hands the flow an already
 * parsed callback, because react-navigation parses the deep link for it; this is the other source,
 * where the OS session answers with the raw URL it stopped on.
 *
 * `ledgerlive://paytab?code=…` is not a hierarchical URL, so `URL` cannot be trusted to expose its
 * query. The query is read from the string itself.
 *
 * `state` is carried over when the provider echoed one, so the machine can tell a redirect from the
 * attempt it is waiting on from one left over from an attempt already abandoned. `app_id` names the
 * provider app the holder belongs to, and the redirect is the only place that says it.
 */
export function parseCallbackUrl(url: string): PayCardAuthCallback | null {
  const query = url.slice(url.indexOf("?") + 1);
  if (!url.includes("?") || !query) {
    return null;
  }

  const params = new URLSearchParams(query);
  const code = params.get("code");
  if (!code) {
    return null;
  }

  const state = params.get("state");
  const appId = params.get("app_id");

  return { code, ...(state ? { state } : {}), ...(appId ? { appId } : {}) };
}
