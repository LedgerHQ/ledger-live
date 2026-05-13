import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ActionBarView } from "./ActionBar";
import { useActionBarViewModel } from "./useActionBarViewModel";

type ActionBarProps = Readonly<{
  distributionItem: DistributionItem | undefined;
  ledgerCurrency: CryptoOrTokenCurrency | undefined;
  tickerHint: string;
}>;

export function ActionBar({ distributionItem, ledgerCurrency, tickerHint }: ActionBarProps) {
  const viewModel = useActionBarViewModel({ distributionItem, ledgerCurrency, tickerHint });

  return <ActionBarView viewModel={viewModel} />;
}
