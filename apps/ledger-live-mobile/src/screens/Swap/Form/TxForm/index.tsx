import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import {
  SwapTransactionType,
  Pair,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { From } from "./From";
import { To } from "./To";

interface Props {
  swapTx: SwapTransactionType;
  pairs: Pair[];
}

export function TxForm({ swapTx, pairs }: Props) {
  return (
    <Flex>
      <From
        from={swapTx.swap.from}
        isMaxEnabled={swapTx.swap.isMaxEnabled}
        setAccount={swapTx.setFromAccount}
        setAmount={swapTx.setFromAmount}
      />
      <To
        from={swapTx.swap.from}
        to={swapTx.swap.to}
        setCurrency={swapTx.setToCurrency}
        pairs={pairs}
      />
    </Flex>
  );
}
