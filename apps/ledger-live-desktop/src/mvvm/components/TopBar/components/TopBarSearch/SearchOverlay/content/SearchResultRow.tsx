import React from "react";
import { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { AssetSuggestionRow } from "LLD/features/SearchAssets/components/AssetSuggestionRow";

type SearchResultRowProps = {
  currency: MarketCurrencyData;
  counterCurrency: string;
  locale: string;
  onClick: (currencyId: string, marketState?: MarketCurrencyData) => void;
};

export function SearchResultRow({
  currency,
  counterCurrency,
  locale,
  onClick,
}: Readonly<SearchResultRowProps>) {
  return (
    <AssetSuggestionRow
      currency={currency}
      counterCurrency={counterCurrency}
      locale={locale}
      testIdPrefix="search-result"
      onClick={onClick}
      density="default"
    />
  );
}
