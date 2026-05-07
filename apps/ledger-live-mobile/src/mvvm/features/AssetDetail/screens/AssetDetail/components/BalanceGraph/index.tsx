import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useBalanceGraphViewModel } from "./useBalanceGraphViewModel";
import { BalanceGraphView } from "./BalanceGraphView";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function BalanceGraph({ currency }: Props) {
  const viewModel = useBalanceGraphViewModel(currency);
  return <BalanceGraphView {...viewModel} />;
}
