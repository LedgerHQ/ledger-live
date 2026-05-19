import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { ActionBarView } from "./ActionBar";
import { useActionBarViewModel } from "./useActionBarViewModel";

type ActionBarProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerCurrency?: CryptoOrTokenCurrency;
  marketCurrencyData?: MarketCurrencyData;
  tickerHint: string;
}>;

export function ActionBar({
  distributionItem,
  ledgerCurrency,
  marketCurrencyData,
  tickerHint,
}: ActionBarProps) {
  const viewModel = useActionBarViewModel({
    distributionItem,
    ledgerCurrency,
    marketCurrencyData,
    tickerHint,
  });

  return <ActionBarView viewModel={viewModel} />;
}
