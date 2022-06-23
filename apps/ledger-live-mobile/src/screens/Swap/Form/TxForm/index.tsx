import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { From } from "./From";
import { To } from "./To";

interface Props {
  swapTx: SwapTransactionType;
}

export function TxForm({ swapTx }: Props) {
  return (
    <Flex flex={1}>
      <From
        from={swapTx.swap.from}
        isMaxEnabled={swapTx.swap.isMaxEnabled}
        setAccount={swapTx.setFromAccount}
        setAmount={swapTx.setFromAmount}
      />
      {/* <To to={swapTx.swap.to} /> */}
    </Flex>
  );
}
