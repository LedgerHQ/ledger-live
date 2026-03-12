import React from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CounterValueCellView } from "./CounterValueCellView";
import { useCounterValueCellViewModel } from "./useCounterValueCellViewModel";

type CounterValueCellProps = {
  readonly currency: Currency;
  readonly balance: number;
};

export const CounterValueCell = ({ currency, balance }: CounterValueCellProps) => (
  <CounterValueCellView {...useCounterValueCellViewModel(currency, balance)} />
);
