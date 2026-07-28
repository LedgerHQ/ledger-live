import React from "react";
import type { Unit } from "@domain/entity-currency-unit";
import { CryptoBalanceTextView } from "./CryptoBalanceTextView";
import { useCryptoBalanceTextViewModel } from "./useCryptoBalanceTextViewModel";

export type CryptoBalanceTextProps = Readonly<{
  amount: number;
  cryptoUnit: Unit;
}>;

export function CryptoBalanceText({ amount, cryptoUnit }: CryptoBalanceTextProps) {
  return <CryptoBalanceTextView {...useCryptoBalanceTextViewModel({ amount, cryptoUnit })} />;
}
