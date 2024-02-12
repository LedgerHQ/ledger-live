import React from "react";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import EvmFeesStrategy from "./EvmFeesStrategy";
import { SendRowsFeeProps } from "./types";

export default function SendRowsFee({
  transaction,
  transactionToUpdate,
  ...props
}: SendRowsFeeProps) {
  return (
    <EvmFeesStrategy
      transaction={transaction as EvmTransaction}
      transactionToUpdate={transactionToUpdate as EvmTransaction}
      {...props}
    />
  );
}
