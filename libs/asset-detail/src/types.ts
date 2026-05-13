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
  marketApiCurrencyId: string | undefined;
  /**
   * Ledger ids known up-front (owned distribution item or location.state seed).
   * Falls back to the Market hook's `ledgerIds` when undefined.
   */
  knownLedgerIds: readonly string[] | undefined;
  counterCurrency: string;
  product: "lld" | "llm";
  version: string;
  isStaging?: boolean;
}>;

export type AssetMarketData = Readonly<{
  marketCurrencyData: MarketCurrencyData | undefined;
  isLoading: boolean;
}>;

export type AssetMarketDataResult = AssetMarketData &
  Readonly<{
    ledgerCurrencyFromDada: CryptoOrTokenCurrency | undefined;
    isError: boolean;
  }>;
