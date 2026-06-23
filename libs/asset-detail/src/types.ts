import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type AssetDetailMarketInfo = Readonly<{
  id?: string;
  ledgerIds: string[];
  name?: string;
  ticker?: string;
  price?: number;
}>;

export type AssetMarketDataInput = Readonly<{
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
  counterCurrency: string;
  product: "lld" | "llm";
  version: string;
  isStaging?: boolean;
  enabled?: boolean;
}>;

export type AssetMarketData = Readonly<{
  marketCurrencyData?: MarketCurrencyData;
  marketId?: string;
  isLoading: boolean;
}>;

export type ReceiveNetworkLedgerIdsInput = Readonly<{
  /**
   * DADA meta-currency id of the focused asset (e.g. "urn:crypto:meta-currency:tether").
   * Only available when the asset is held (resolved from the distribution item).
   */
  metaCurrencyId?: string;
  /**
   * Resolved market API id (e.g. "tether", "usd-coin"). Used to locate the
   * meta-currency when the asset is not held and `metaCurrencyId` is missing —
   * its slug (`toSlug`) matches the market id.
   */
  marketApiId?: string;
  /** Asset ticker used to search the unfiltered DADA catalog (e.g. "USDT"). */
  ticker?: string;
  /** A known ledger currency id of the asset, used as a last-resort meta matcher. */
  currencyId?: string;
  /** Ledger ids already resolved by the market data hook, used as a fallback. */
  fallbackLedgerIds: string[];
  product: "lld" | "llm";
  version: string;
  isStaging?: boolean;
  includeTestNetworks?: boolean;
}>;

export type AssetMarketDataResult = AssetMarketData &
  Readonly<{
    ledgerCurrencyFromDada?: CryptoOrTokenCurrency;
    /**
     * Resolved full multi-network list of ledger currency ids for the asset
     * (e.g. USDC on Ethereum + Polygon + Base). Recovers the CoinGecko list
     * that `marketCurrencyData.ledgerIds` collapses to a single id once the
     * DADA market entry wins.
     */
    ledgerIds: string[];
    isError: boolean;
  }>;
