import React from "react";
import { Currency } from "@domain/entity-currency";
import { PriceCellView } from "./PriceCellView";
import { usePriceCellViewModel } from "./usePriceCellViewModel";

type PriceCellProps = {
  readonly currency: Currency;
  readonly marketPrice?: number;
};

export const PriceCell = ({ currency, marketPrice }: PriceCellProps) => (
  <PriceCellView {...usePriceCellViewModel(currency, marketPrice)} />
);
