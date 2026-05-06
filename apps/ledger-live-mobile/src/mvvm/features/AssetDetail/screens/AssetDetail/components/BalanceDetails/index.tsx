import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useBalanceDetailsViewModel } from "./useBalanceDetailsViewModel";
import { BalanceDetailsView } from "./BalanceDetailsView";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function BalanceDetails({ currency }: Props) {
  const viewModel = useBalanceDetailsViewModel(currency);
  return <BalanceDetailsView {...viewModel} />;
}
