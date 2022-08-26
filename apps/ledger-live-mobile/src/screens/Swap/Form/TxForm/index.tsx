import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import {
  SwapTransactionType,
  ExchangeRate,
} from "@ledgerhq/live-common/exchange/swap/types";
import { From } from "./From";
import { To } from "./To";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
  swapError?: Error;
}

export function TxForm({ swapTx, provider, exchangeRate, swapError }: Props) {
  return (
    <Flex>
      <From swapTx={swapTx} provider={provider} swapError={swapError} />
      <To swapTx={swapTx} exchangeRate={exchangeRate} provider={provider} />
    </Flex>
  );
}
