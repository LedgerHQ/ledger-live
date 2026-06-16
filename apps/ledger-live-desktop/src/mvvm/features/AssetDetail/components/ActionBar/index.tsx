import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { ActionBarView } from "./ActionBar";
import { useActionBarViewModel } from "./useActionBarViewModel";

type ActionBarProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerCurrency?: CryptoOrTokenCurrency;
  ledgerIds?: readonly string[];
  marketCurrencyData?: MarketCurrencyData;
  tickerHint: string;
  isDistributionLoading: boolean;
  isMarketLoading: boolean;
}>;

export function ActionBar({
  distributionItem,
  ledgerCurrency,
  ledgerIds,
  marketCurrencyData,
  tickerHint,
  isDistributionLoading,
  isMarketLoading,
}: ActionBarProps) {
  const viewModel = useActionBarViewModel({
    distributionItem,
    ledgerCurrency,
    ledgerIds,
    marketCurrencyData,
    tickerHint,
    isDistributionLoading,
    isMarketLoading,
  });

  if (viewModel.showSkeleton || !viewModel.isCurrencySupported) {
    return null;
  }

  return <ActionBarView viewModel={viewModel} />;
}
