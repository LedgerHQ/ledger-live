/** An asset as a coin module reports it: its native coin, or a token it identifies by reference and owner. */
export type CoinModuleAsset =
  | { type: "native" }
  | { type: string; assetReference?: string; assetOwner?: string };

/** One asset's share of an address, in its smallest unit. `locked` is the part of `value` not spendable. */
export type CoinModuleBalance = {
  value: bigint;
  asset: CoinModuleAsset;
  locked?: bigint;
};

/** What the source needs of one currency's coin module. */
export type CoinModuleBalanceApi = {
  /** The balances of an account: its address, or its xpub for a utxo currency. */
  getBalance(subject: string): Promise<CoinModuleBalance[]>;
  /** The id of the token an asset stands for; absent or `undefined` for an asset that is not a listed token. */
  getTokenId?(asset: CoinModuleAsset): Promise<string | undefined>;
  /** The native entries are disjoint parts of the account, to be summed, instead of one entry carrying the account. */
  partitionsNativeBalance?: boolean;
};

/** What the source takes from the coin modules, implemented by the app on top of its registry. */
export type CoinModuleHost = {
  /** Synchronous: whether a coin module is registered for the currency, loaded or not. */
  isCurrencySupported(currencyId: string): boolean;
  /** Synchronous: whether the currency's coin module reads a whole utxo account from its xpub. Absent, no utxo account is served: a coin module reads one address, not an xpub. */
  readsXpub?(currencyId: string): boolean;
  /** The coin module of the currency, loaded on first use; `undefined` when it does not implement the balance read. */
  getApi(currencyId: string): Promise<CoinModuleBalanceApi | undefined>;
  blacklistedTokenIds?(): readonly string[];
};
