import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountRaw, SignOperationEvent, SyncConfig } from "@ledgerhq/types-live";
import type { BitcoinAddress, BitcoinSigner, BitcoinXPub, SignerContext } from "../signer";
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

  /**
   * Combine the freshly-synced transparent balance with any chain-specific
   * off-transparent funds (e.g. Zcash shielded notes) to produce the account
   * balance. Omit to use the transparent balance unchanged.
   */
  computeAccountBalance?(
    account: BitcoinAccount | undefined,
    transparentBalance: BigNumber,
  ): BigNumber;

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

  /**
   * Override hardware address resolution for chain-specific signer APIs.
   * Return `undefined` to fall through to the standard Bitcoin getWalletPublicKey path.
   */
  getAddress?(
    deviceId: string,
    options: GetAddressOptions,
    signerContext: SignerContext,
  ): Promise<BitcoinAddress> | undefined;

  /**
   * Override account xpub derivation for chain-specific signer APIs.
   * Return `undefined` to fall through to the standard `signer.getWalletXpub` path.
   *
   * Used during account discovery when no xpub is cached on the account.
   */
  getWalletXpub?(
    deviceId: string,
    options: { currency: CryptoCurrency; accountPath: string; xpubVersion: number },
    signerContext: SignerContext,
  ): Promise<BitcoinXPub> | undefined;

  /**
   * Override full viewing key export for chains that expose non-BTC signer APIs.
   * Return `undefined` to indicate that the chain does not support this operation.
   */
  getFullViewingKey?(
    deviceId: string,
    currency: CryptoCurrency,
    path: string,
    signerContext: SignerContext,
  ): Promise<string> | undefined;

  /**
   * Override signer instantiation for chains requiring non-BTC signer implementations.
   * `defaultSigner` is the standard hw-app-btc signer — chain adapters can augment it
   * with chain-specific methods (e.g. overlay DmkSignerZcash.getAddress).
   * Return `undefined` to use `defaultSigner` as-is.
   */
  createSigner?(
    transport: unknown,
    currency: CryptoCurrency,
    defaultSigner: BitcoinSigner,
  ): BitcoinSigner | undefined;
}
