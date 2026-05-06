import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useMarketStatsViewModel } from "./useMarketStatsViewModel";
import { MarketStatsView } from "./MarketStatsView";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function MarketStats({ currency }: Props) {
  const viewModel = useMarketStatsViewModel(currency);
  return <MarketStatsView {...viewModel} />;
}
