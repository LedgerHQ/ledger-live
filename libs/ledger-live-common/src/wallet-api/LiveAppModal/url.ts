import { getPayload } from "./registry";

const INITIAL_PAYLOAD_URL_LIMIT = 16_000;

/**
 * Build the URL that the modal webview should load.
 *
 * Sets all caller-provided inputs as search params, then appends the
 * protocol-reserved params (`isLiveAppModal`, `liveAppModalRequestId`), and
 * attempts to inline the pending registry payload as `liveAppModalInitialPayload`
 * when its serialized length is under ~16KB. Oversized payloads are skipped so
 * the child webview falls back to `custom.liveApp.modal.getInitialPayload`.
 *
 * Returns undefined if the base URL + path cannot be composed into a valid URL.
 */
export function buildLiveAppModalURL(options: {
  manifestURL: string;
  path: string;
  requestId: string;
  inputs: Record<string, string | undefined>;
}): string | undefined {
  try {
    const base = new URL(options.manifestURL);
    const url = new URL(options.path, base);
    // Reject absolute URLs or non-http(s) schemes passed as `path`. Without this,
    // `new URL` ignores the base when `path` is fully qualified, the resolved URL
    // fails downstream whitelist validation in getInitialURL, and the modal
    // silently falls back to manifest.url — making the misroute invisible to the
    // caller. Failing here lets the caller's RPC promise reject instead.
    if (url.origin !== base.origin) return undefined;
    for (const [key, value] of Object.entries(options.inputs)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
    url.searchParams.set("isLiveAppModal", "true");
    url.searchParams.set("liveAppModalRequestId", options.requestId);
    try {
      const payload = getPayload(options.requestId);
      if (payload !== undefined) {
        const serialized = JSON.stringify(payload);
        // Set the param then measure the encoded URL — `serialized.length` is the
        // raw JSON size, but URLSearchParams percent-encodes quotes/braces/etc.,
        // so the encoded form is typically 1.5-3x larger. Remove the param if the
        // final URL would exceed the platform-safe limit; the child webview will
        // recover via custom.liveApp.modal.getInitialPayload.
        url.searchParams.set("liveAppModalInitialPayload", serialized);
        if (url.toString().length > INITIAL_PAYLOAD_URL_LIMIT) {
          url.searchParams.delete("liveAppModalInitialPayload");
        }
      }
    } catch {
      // payload read failed (entry missing or already settled) — the child
      // webview will recover via custom.liveApp.modal.getInitialPayload
    }
    return url.toString();
  } catch {
    return undefined;
  }
}
