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
    const url = new URL(options.path, options.manifestURL);
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
        if (serialized.length <= INITIAL_PAYLOAD_URL_LIMIT) {
          url.searchParams.set("liveAppModalInitialPayload", serialized);
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
