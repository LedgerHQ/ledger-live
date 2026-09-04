import type { AccountBalanceSource } from "./source";

let sources: readonly AccountBalanceSource[] = [];

/**
 * Declare the sources this app can read balances from. Called once, at the composition root.
 *
 * A module-level list rather than an injected registry: `features/` may not import `libs/`, so the
 * concrete sources are built by the app anyway, and the thunk that reads them is a module-level
 * const like every other action creator. A test calls this in `beforeEach` and gets the sources it
 * wants; there is nothing to thread through a provider.
 */
export function registerAccountBalanceSources(next: readonly AccountBalanceSource[]): void {
  sources = [...next];
}

/** The registered sources. Empty before the composition root has run. */
export function getAccountBalanceSources(): readonly AccountBalanceSource[] {
  return sources;
}
