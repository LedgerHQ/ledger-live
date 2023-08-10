import React from "react";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import EvmFeesStrategy from "./EvmFeesStrategy";
import { SendRowsFeeProps } from "./types";

export default function SendRowsFee({ transaction, ...props }: SendRowsFeeProps) {
  return <EvmFeesStrategy transaction={transaction as Transaction} {...props} />;
}
