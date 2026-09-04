import type { AccountBalanceSource } from "./source";
import type { AccountOperationsSource } from "./operations";

let balanceSources: readonly AccountBalanceSource[] = [];
let operationsSources: readonly AccountOperationsSource[] = [];

/**
 * Declare the sources this app can read balances from. Called once, at the composition root.
 *
 * A module-level list rather than an injected registry: `features/` may not import `libs/`, so the
 * concrete sources are built by the app anyway, and the thunk that reads them is a module-level
 * const like every other action creator. A test calls this in `beforeEach` and gets the sources it
 * wants; there is nothing to thread through a provider.
 */
export function registerAccountBalanceSources(next: readonly AccountBalanceSource[]): void {
  balanceSources = [...next];
}

/** The registered balance sources. Empty before the composition root has run. */
export function getAccountBalanceSources(): readonly AccountBalanceSource[] {
  return balanceSources;
}

/**
 * Declare the sources this app can read operation history from.
 *
 * A separate list from the balance one, not a widened source object. A family can be servable for
 * one datum and not the other — that is the whole point of slicing the account — and a single list
 * of sources that each declare which data they can produce is the `capabilities` set this
 * exploration deleted. Two lists, two selections, no vocabulary.
 */
export function registerAccountOperationsSources(next: readonly AccountOperationsSource[]): void {
  operationsSources = [...next];
}

/** The registered operations sources. Empty before the composition root has run. */
export function getAccountOperationsSources(): readonly AccountOperationsSource[] {
  return operationsSources;
}
