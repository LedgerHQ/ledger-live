import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";

type CoinModuleTokenResolver = {
  /** The id of the token an asset stands for; absent or `undefined` for an asset that is not a listed token. */
  getTokenId?(asset: AssetInfo): Promise<string | undefined>;
};

/** What the source needs of one currency's coin module to read a balance. */
export type CoinModuleBalanceApi = CoinModuleTokenResolver & {
  /** The balances of an account: its address, or its xpub for a utxo currency. */
  getBalance(subject: string): Promise<Balance[]>;
  /** The native entries are disjoint parts of the account, to be summed, instead of one entry carrying the account. */
  partitionsNativeBalance?: boolean;
};

/** One operation as a coin module lists it, in the smallest unit of its asset. */
export type CoinModuleOperation = {
  /** Unique among the operations of the account. */
  id: string;
  type: string;
  senders: string[];
  recipients: string[];
  /** Signed: negative when the account got back more than it sent. Ignored on a failed transaction. */
  value: bigint;
  asset: AssetInfo;
  details?: Record<string, unknown>;
  tx: {
    hash: string;
    block: { height: number };
    fees: bigint;
    /** The address that paid the fees; absent when the module does not know, none of the senders then paid. */
    feesPayer?: string;
    date: Date;
    failed: boolean;
  };
};

/** A falsy `next` ends the list. */
export type CoinModuleOperationsPage = {
  items: CoinModuleOperation[];
  next?: string;
};

/** What the source needs of one currency's coin module to read operations. */
export type CoinModuleOperationsApi = CoinModuleTokenResolver & {
  /** One page of the operations of an account, newest first; `limit` is a soft one the host may lower. */
  listOperations(
    subject: string,
    options: { cursor?: string; limit?: number },
  ): Promise<CoinModuleOperationsPage>;
};

/** What the source needs of one currency's coin module to tell whether an account exists. */
export type CoinModuleExistenceApi = {
  /** Whether the address has any history, in as few calls as the chain allows. */
  exists(subject: string): Promise<boolean>;
};

/** What the source takes from the coin modules, implemented by the app on top of its registry. */
export type CoinModuleHost = {
  /** Synchronous: whether a coin module is registered for the currency, loaded or not. */
  isCurrencySupported(currencyId: string): boolean;
  /** Synchronous: whether the currency's coin module reads a whole utxo account from its xpub. Absent, no utxo account is served: a coin module reads one address, not an xpub. */
  readsXpub?(currencyId: string): boolean;
  /** The coin module of the currency, loaded on first use; `undefined` when it does not implement the balance read. */
  getApi(currencyId: string): Promise<CoinModuleBalanceApi | undefined>;
  /** Synchronous: whether the currency's coin module pages its operations newest first. Absent, no operations are served. */
  paginatesOperations?(currencyId: string): boolean;
  /** The coin module of the currency, loaded on first use; `undefined` when it does not implement the operations read. */
  getOperationsApi?(currencyId: string): Promise<CoinModuleOperationsApi | undefined>;
  /** The coin module of the currency, loaded on first use; `undefined` when it does not implement `exists`. */
  getExistenceApi?(currencyId: string): Promise<CoinModuleExistenceApi | undefined>;
  blacklistedTokenIds?(): readonly string[];
};
