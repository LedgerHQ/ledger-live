import type { Observable } from "rxjs";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account, AccountRaw, SyncConfig } from "@ledgerhq/types-live";
import type { BitcoinAccount } from "../types";

/**
 * Extension point for chain-specific logic within coin-bitcoin.
 *
 * The default adapter is a no-op — all methods are optional. Chains that need
 * extra behavior (e.g. Zcash shielded sync) register their own adapter at
 * module initialization time via {@link registerChainAdapter}.
 */
export interface ChainAdapter {
  /** Unique chain identifier, matching CryptoCurrencyId. */
  readonly id: string;

  /**
   * Return an additional sync observable to merge alongside the standard
   * transparent sync. Return `undefined` when the chain has nothing extra.
   */
  buildExtraSyncObservable?(
    info: AccountShapeInfo<BitcoinAccount>,
    syncConfig: SyncConfig,
  ): Observable<Partial<BitcoinAccount>> | undefined;

  /** Serialize chain-specific account fields into their raw form. */
  assignToAccountRaw?(account: Account, accountRaw: AccountRaw): void;

  /** Deserialize chain-specific account fields from their raw form. */
  assignFromAccountRaw?(accountRaw: AccountRaw, account: Account): void;
}
