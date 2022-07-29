import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import {
  SwapTransactionType,
  ExchangeRate,
  Pair,
} from "@ledgerhq/live-common/exchange/swap/types";
import { From } from "./From";
import { To } from "./To";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
  pairs: Pair[];
  swapError?: Error;
}

export function TxForm({
  swapTx,
  provider,
  exchangeRate,
  pairs,
  swapError,
}: Props) {
  return (
    <Flex>
      <From
        swapTx={swapTx}
        provider={provider}
        pairs={pairs}
        swapError={swapError}
      />
      <To
        swapTx={swapTx}
        exchangeRate={exchangeRate}
        provider={provider}
        pairs={pairs}
      />
    </Flex>
  );
}
