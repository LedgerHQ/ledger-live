import React from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTransactionsViewModel } from "./useTransactionsViewModel";
import { TransactionsView } from "./TransactionsView";

type Props = Readonly<{
  currency: CryptoOrTokenCurrency | undefined;
}>;

export function Transactions({ currency }: Props) {
  const viewModel = useTransactionsViewModel(currency);
  return <TransactionsView {...viewModel} />;
}
