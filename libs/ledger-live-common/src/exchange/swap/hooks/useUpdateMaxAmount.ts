import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "../../../bridge";
import { SwapDataType, SwapSelectorStateType, SwapTransactionType } from "../types";
import { Transaction } from "../../../generated/types";

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
  isMaxLoading: SwapDataType["isMaxLoading"];
} => {
  const [isMaxEnabled, setIsMaxEnabled] = useState<SwapDataType["isMaxEnabled"]>(false);
  const [isMaxLoading, setIsMaxLoading] = useState(false);

  const toggleMax: SwapTransactionType["toggleMax"] = useCallback(
    () =>
      setIsMaxEnabled(previous => {
        if (previous) {
          setFromAmount(ZERO);
          setIsMaxLoading(false);
        }
        return !previous;
      }),
    [setFromAmount],
  );

  /* UPDATE from amount to the estimate max spendable on account
     change when the amount feature is enabled */
  useEffect(
    () => {
      const updateAmountUsingMax = async () => {
        if (!account) return;
        const bridge = getAccountBridge(account, parentAccount);
        setIsMaxLoading(true);
        const amount = await bridge.estimateMaxSpendable({
          account,
          parentAccount,
          transaction,
        });
        setIsMaxLoading(false);
        setFromAmount(amount);
      };

      if (isMaxEnabled) {
        updateAmountUsingMax();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setFromAmount, isMaxEnabled, account, parentAccount, feesStrategy],
  );

  return { isMaxEnabled, toggleMax, isMaxLoading };
};
