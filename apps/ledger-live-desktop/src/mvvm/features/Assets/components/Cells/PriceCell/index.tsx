import React from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { PriceCellView } from "./PriceCellView";
import { usePriceCellViewModel } from "./usePriceCellViewModel";

type PriceCellProps = {
  readonly currency: Currency;
  readonly placeholderPrice?: number;
};

export const PriceCell = ({ currency, placeholderPrice }: PriceCellProps) => (
  <PriceCellView {...usePriceCellViewModel(currency, placeholderPrice)} />
);
