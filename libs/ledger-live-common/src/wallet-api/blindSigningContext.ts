import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { AppManifest } from "./types";

/**
 * Scope the blind-signing reporter's `liveAppContext` to a single signing
 * call so events from other concurrent flows (e.g. a native send opened over
 * a live-app webview) are not attributed to the live app.
 *
 * Use this around any `uiHook["transaction.sign" | "message.sign" | ...]` or
 * `bridge.signOperation` invocation triggered on behalf of a live app.
 */
export async function withLiveAppContext<T>(
  manifest: AppManifest,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = liveBlindSigningReporter.getContext().liveAppContext ?? null;
  liveBlindSigningReporter.setContext({ liveAppContext: manifest.id });
  try {
    return await fn();
  } finally {
    liveBlindSigningReporter.setContext({ liveAppContext: previous });
  }
}
