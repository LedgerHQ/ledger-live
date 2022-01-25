import { useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "../../../bridge";

import {
  SwapTransactionType,
  SwapDataType,
  SwapSelectorStateType,
} from "./useSwapTransaction";
import { Transaction } from "../../../generated/types";
import BigNumber from "bignumber.js";

export const ZERO = new BigNumber(0);

export const useUpdateMaxAmount = ({
  setFromAmount,
  account,
  parentAccount,
  transaction,
  feesStrategy,
}: {
  setFromAmount: SwapTransactionType["setFromAmount"];
  account: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  transaction: SwapTransactionType["transaction"];
  feesStrategy: Transaction["feesStrategy"];
}): {
  isMaxEnabled: SwapDataType["isMaxEnabled"];
  toggleMax: SwapTransactionType["toggleMax"];
} => {
  const [isMaxEnabled, setMax] = useState<SwapDataType["isMaxEnabled"]>(false);

  const toggleMax: SwapTransactionType["toggleMax"] = useCallback(
    () =>
      setMax((previous) => {
        if (previous) {
          setFromAmount(ZERO);
        }
        return !previous;
      }),
    [setFromAmount]
  );

  /* UPDATE from amount to the estimate max spendable on account
     change when the amount feature is enabled */
  useEffect(
    () => {
      const updateAmountUsingMax = async () => {
        if (!account) return;
        const bridge = getAccountBridge(account, parentAccount);
        const amount = await bridge.estimateMaxSpendable({
          account,
          parentAccount,
          transaction,
        });
        setFromAmount(amount);
      };

      if (isMaxEnabled) {
        updateAmountUsingMax();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setFromAmount, isMaxEnabled, account, parentAccount, feesStrategy]
  );

  return { isMaxEnabled, toggleMax };
};
