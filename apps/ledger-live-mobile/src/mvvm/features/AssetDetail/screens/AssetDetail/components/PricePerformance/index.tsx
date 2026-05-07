import React from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { usePricePerformanceViewModel } from "./usePricePerformanceViewModel";
import { PricePerformanceView } from "./PricePerformanceView";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function PricePerformance({ currency }: Props) {
  const viewModel = usePricePerformanceViewModel(currency);
  return <PricePerformanceView {...viewModel} />;
}
