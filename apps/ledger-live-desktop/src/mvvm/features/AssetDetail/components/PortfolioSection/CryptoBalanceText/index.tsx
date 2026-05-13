import React from "react";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { CryptoBalanceTextView } from "./CryptoBalanceTextView";
import { useCryptoBalanceTextViewModel } from "./useCryptoBalanceTextViewModel";

export type CryptoBalanceTextProps = Readonly<{
  amount: number;
  cryptoUnit: Unit;
}>;

export function CryptoBalanceText({ amount, cryptoUnit }: CryptoBalanceTextProps) {
  return <CryptoBalanceTextView {...useCryptoBalanceTextViewModel({ amount, cryptoUnit })} />;
}
