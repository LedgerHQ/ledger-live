import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TrendCellView } from "./TrendCellView";
import { useTrendCellViewModel } from "./useTrendCellViewModel";

type TrendCellProps = {
  readonly currency: CryptoOrTokenCurrency;
};

export const TrendCell = ({ currency }: TrendCellProps) => (
  <TrendCellView {...useTrendCellViewModel(currency)} />
);
