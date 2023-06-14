import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SwapTransactionType, ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { From } from "./From";
import { To } from "./To";

interface Props {
  swapTx: SwapTransactionType;
  provider?: string;
  exchangeRate?: ExchangeRate;
  swapError?: Error;
  isSendMaxLoading: boolean;
}

export function TxForm({ swapTx, provider, exchangeRate, swapError, isSendMaxLoading }: Props) {
  return (
    <Flex marginBottom={4}>
      <From
        swapTx={swapTx}
        provider={provider}
        swapError={swapError}
        isSendMaxLoading={isSendMaxLoading}
      />
      <To swapTx={swapTx} exchangeRate={exchangeRate} provider={provider} />
    </Flex>
  );
}
