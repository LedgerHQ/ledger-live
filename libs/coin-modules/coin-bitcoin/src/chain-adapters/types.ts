import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account, AccountRaw, SignOperationEvent, SyncConfig } from "@ledgerhq/types-live";
import type { SignerContext } from "../signer";
import type { BitcoinAccount, Transaction, TransactionStatus } from "../types";

/**
 * Extension point for chain-specific logic within coin-bitcoin.
 *
 * The default adapter is a no-op — all methods are optional. Chains that need
 * extra behavior (e.g. Zcash shielded sync) register their own adapter at
 * module initialization time via {@link registerChainAdapter}.
 *
 * Each optional method returns `undefined` to fall through to the default
 * Bitcoin behavior. Returning a value (or Promise) means the adapter takes
 * over for that operation.
 */
export interface ChainAdapter {
  /** Unique chain identifier, matching CryptoCurrencyId. */
  readonly id: string;

  // ── Sync ──────────────────────────────────────────────────────────────

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

  // ── Transaction ───────────────────────────────────────────────────────

  /**
   * Override the sign operation for chain-specific transaction types.
   * Return `undefined` to fall through to the standard Bitcoin PSBT signing.
   */
  signOperation?(
    account: Account,
    deviceId: string,
    transaction: Transaction,
    signerContext: SignerContext,
  ): Observable<SignOperationEvent> | undefined;

  /**
   * Override transaction status computation (validation + fee estimation).
   * Return `undefined` to fall through to the standard Bitcoin validation.
   */
  getTransactionStatus?(
    account: Account,
    transaction: Transaction,
  ): Promise<TransactionStatus> | undefined;

  /**
   * Override max spendable estimation for chain-specific balance types.
   * Return `undefined` to fall through to the standard Bitcoin UTXO estimation.
   */
  estimateMaxSpendable?(
    account: Account,
    parentAccount: Account | null | undefined,
    transaction: Transaction | null | undefined,
  ): Promise<BigNumber> | undefined;

  /**
   * Override transaction preparation (fee info, validation).
   * Return `undefined` to fall through to the standard Bitcoin preparation.
   */
  prepareTransaction?(account: Account, transaction: Transaction): Promise<Transaction> | undefined;
}
