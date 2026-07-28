import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { ScreenName } from "~/const";

export type AssetDetailCurrencyProps = CryptoOrTokenCurrency | undefined;

export type AssetDetailMarketState = {
  id: string;
  ledgerIds?: string[];
};

export type AssetDetailNavigatorParamsList = {
  [ScreenName.AssetDetail]: {
    currencyId: string;
    source?: string;
    marketState?: AssetDetailMarketState;
  };
};
