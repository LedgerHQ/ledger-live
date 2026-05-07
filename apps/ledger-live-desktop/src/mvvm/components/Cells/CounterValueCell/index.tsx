import React from "react";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { BigNumber } from "bignumber.js";
import { CounterValueCellView } from "./CounterValueCellView";
import { useCounterValueCellViewModel } from "./useCounterValueCellViewModel";

type CounterValueCellProps = {
  readonly currency: Currency;
  readonly balance: BigNumber | number;
  readonly date?: Date;
  readonly alwaysShowSign?: boolean;
  readonly className?: string;
};

export const CounterValueCell = ({
  currency,
  balance,
  date,
  alwaysShowSign,
  className,
}: CounterValueCellProps) => (
  <CounterValueCellView
    {...useCounterValueCellViewModel(currency, balance, { date, alwaysShowSign })}
    className={className}
  />
);
