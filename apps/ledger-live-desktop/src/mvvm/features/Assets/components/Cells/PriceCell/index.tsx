import React from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { PriceCellView } from "./PriceCellView";
import { usePriceCellViewModel } from "./usePriceCellViewModel";

type PriceCellProps = {
  readonly currency: Currency;
};

export const PriceCell = ({ currency }: PriceCellProps) => (
  <PriceCellView {...usePriceCellViewModel(currency)} />
);
