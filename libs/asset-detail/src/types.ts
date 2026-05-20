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
}>;

export type AssetMarketData = Readonly<{
  marketCurrencyData?: MarketCurrencyData;
  marketId?: string;
  isLoading: boolean;
}>;

export type AssetMarketDataResult = AssetMarketData &
  Readonly<{
    ledgerCurrencyFromDada?: CryptoOrTokenCurrency;
    isError: boolean;
  }>;
