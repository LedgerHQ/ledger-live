import React from "react";
import { Transaction as EvmTransaction } from "@ledgerhq/live-common/families/evm/types";
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
