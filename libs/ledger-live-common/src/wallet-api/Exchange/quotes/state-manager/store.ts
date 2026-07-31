/**
 * Dispatch holder for the {@link swapQuotesApi}.
 *
 * `fetchQuotes` runs server-side inside the wallet-api `getQuotes` flow,
 * not from a React component, so it cannot use the generated query hook.
 * Instead each app injects its store's `dispatch` once at startup via
 * {@link setSwapQuotesStore}, and `fetchQuotes` retrieves it with
 * {@link getSwapQuotesDispatch} to imperatively run the endpoint.
 *
 * The reference is kept on `globalThis` to guarantee a single shared
 * dispatch across all module instances, even when live-common is resolved
 * to separate copies by lazy-loaded bundles. `registerTransportModule` in
 * `src/hw/index.ts` uses the same approach for the same reason.
 */
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

export type SwapQuotesDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

declare global {
  // `var` is required: TypeScript builds `typeof globalThis` from global `var`
  // declarations, so an `interface GlobalThis` would augment nothing.
  var __ledgerSwapQuotesDispatch: SwapQuotesDispatch | undefined;
}

/**
 * Register the store dispatch used to run swap quote requests. Should be
 * called once during application initialization.
 */
export function setSwapQuotesStore(dispatch: SwapQuotesDispatch): void {
  globalThis.__ledgerSwapQuotesDispatch = dispatch;
}

/**
 * Clear the registered dispatch, so tests do not have to reach into the
 * storage mechanism by name.
 */
export function resetSwapQuotesStore(): void {
  globalThis.__ledgerSwapQuotesDispatch = undefined;
}

/**
 * Get the registered dispatch.
 * @throws {Error} If {@link setSwapQuotesStore} has not been called yet.
 */
export function getSwapQuotesDispatch(): SwapQuotesDispatch {
  if (!globalThis.__ledgerSwapQuotesDispatch) {
    throw new Error(
      "Swap quotes store is not set. Please call setSwapQuotesStore during app initialization.",
    );
  }
  return globalThis.__ledgerSwapQuotesDispatch;
}
