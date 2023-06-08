import React from "react";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import EthereumFeesStrategy from "./EthereumFeesStrategy";
import { SendRowsFeeProps } from "./types";

export default function EthereumSendRowsFee({ transaction, ...props }: SendRowsFeeProps) {
  return <EthereumFeesStrategy transaction={transaction as Transaction} {...props} />;
}
