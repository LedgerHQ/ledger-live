import React from "react";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { BalanceCellView } from "./BalanceCellView";
import { useBalanceCellViewModel } from "./useBalanceCellViewModel";

type BalanceCellProps = {
  readonly currency: Currency;
  readonly balance: number;
};

export const BalanceCell = ({ currency, balance }: BalanceCellProps) => (
  <BalanceCellView {...useBalanceCellViewModel(currency, balance)} />
);
