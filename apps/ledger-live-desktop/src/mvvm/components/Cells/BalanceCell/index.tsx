import React from "react";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { BigNumber } from "bignumber.js";
import { BalanceCellView } from "./BalanceCellView";
import { useBalanceCellViewModel } from "./useBalanceCellViewModel";

type BalanceCellProps = {
  readonly currency: Currency;
  readonly balance: BigNumber | number;
  readonly alwaysShowSign?: boolean;
  readonly className?: string;
};

export const BalanceCell = ({ currency, balance, alwaysShowSign, className }: BalanceCellProps) => (
  <BalanceCellView
    {...useBalanceCellViewModel(currency, balance, { alwaysShowSign })}
    className={className}
  />
);
