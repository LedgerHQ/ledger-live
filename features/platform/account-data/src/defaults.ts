import type { AccountBalance } from "@domain/entity-account-balance";
import type { AccountDataSource, AccountRef, AccountSlice } from "./port";
import { createCoinModuleApiSource, type AssetBalanceRow } from "./sources/coinModuleApiSource";
import { createLegacyBridgeSource } from "./sources/legacyBridgeSource";

/**
 * What an app's coin layer must provide for the standard source set.
 *
 * Four functions instead of two hand-written sources per app. The point is not brevity: the
 * *capability decision* — which families can serve a balance on their own — has to exist in exactly
 * one place. Four apps each writing their own `capabilities` callback is how this repo ended up with
 * three divergent "families with the new API" lists in the first place.
 */
export type AccountDataHost = {
  /**
   * Families whose coin module can serve a balance independently.
   *
   * Read from the host's coin layer, not hardcoded here: the wallet's gate today, a per-module
   * capability declaration tomorrow. Either way it is one source of truth per app.
   */
  granularFamilies(): Iterable<string>;

  /** The family of a currency id, or `undefined` when the currency is unknown to this app. */
  familyOf(currencyId: string): string | undefined;

  /** Every asset balance at the ref's address — native and tokens — in one call. */
  readAssetBalances(ref: AccountRef, signal?: AbortSignal): Promise<AssetBalanceRow[]>;

  /**
   * Today's full `AccountBridge.sync()`, projected onto balance rows.
   *
   * Kept as a required capability rather than an optional one: without it a family with no granular
   * module has no way to report a balance at all, and the router would answer `UnservableSlices`.
   */
  syncAccountBalances(ref: AccountRef, signal?: AbortSignal): Promise<AccountBalance[]>;
};

const BALANCE_ONLY: ReadonlySet<AccountSlice> = new Set<AccountSlice>(["balance"]);
const NOTHING: ReadonlySet<AccountSlice> = new Set();

/**
 * The two sources every app registers, wired from one host adapter.
 *
 * Order is priority order — granular first, legacy last — but the router sorts by `priority` itself,
 * so registration order is not load-bearing.
 */
export function createDefaultAccountDataSources(host: AccountDataHost): AccountDataSource[] {
  // Resolved once per call, not per request: the set is static for the life of the app, and asking
  // the host on every capability check would put a lookup on the hot path of every portfolio row.
  const granular = new Set(host.granularFamilies());

  return [
    createCoinModuleApiSource({
      capabilities: (ref: AccountRef) => {
        const family = host.familyOf(ref.currencyId);
        return family !== undefined && granular.has(family) ? BALANCE_ONLY : NOTHING;
      },
      getBalances: (ref, signal) => host.readAssetBalances(ref, signal),
    }),
    createLegacyBridgeSource({
      supports: (ref: AccountRef) => host.familyOf(ref.currencyId) !== undefined,
      sync: async (ref, signal) => ({ balances: await host.syncAccountBalances(ref, signal) }),
    }),
  ];
}
