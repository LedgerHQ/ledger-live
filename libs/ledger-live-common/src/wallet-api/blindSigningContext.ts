import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { AppManifest } from "./types";

/**
 * Scope the blind-signing reporter's `liveAppContext` to a single signing
 * call so events from other concurrent flows (e.g. a native send opened over
 * a live-app webview) are not attributed to the live app.
 *
 * Use this around any `uiHook["transaction.sign" | "message.sign" | ...]` or
 * `bridge.signOperation` invocation triggered on behalf of a live app.
 *
 * Two consumers read this now: the blind-signing reporter, and the earn funnel's sign stage
 * (`bridge/impl.ts`), which uses it to attribute a signature to its live app. Changing the
 * scope or lifetime here changes both. LIVE-36571 removes the funnel's dependency on it.
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
