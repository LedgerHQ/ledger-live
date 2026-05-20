import React from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useTransactionsViewModel } from "./useTransactionsViewModel";
import { TransactionsView } from "./TransactionsView";

type Props = Readonly<{
  currency?: CryptoOrTokenCurrency;
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function Transactions({ currency, distributionItem, isLoading }: Props) {
  const viewModel = useTransactionsViewModel(currency, distributionItem);
  return <TransactionsView {...viewModel} isLoading={isLoading} />;
}
