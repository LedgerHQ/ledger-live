import React from "react";
import type { Currency } from "@domain/entity-currency";
import { PriceCellView } from "./PriceCellView";
import { usePriceCellViewModel } from "./usePriceCellViewModel";

type PriceCellProps = {
  readonly currency: Currency;
  readonly marketPrice?: number;
};

export function PriceCell({ currency, marketPrice }: PriceCellProps) {
  return <PriceCellView {...usePriceCellViewModel(currency, marketPrice)} />;
}
