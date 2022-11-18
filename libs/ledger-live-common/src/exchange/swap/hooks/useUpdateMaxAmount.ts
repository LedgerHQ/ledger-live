import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "../../../bridge";
import {
  SetIsSendMaxLoading,
  SwapDataType,
  SwapSelectorStateType,
  SwapTransactionType,
} from "../types";
import { Transaction } from "../../../generated/types";

export const ZERO = new BigNumber(0);

export const useUpdateMaxAmount = ({
  setFromAmount,
  account,
  parentAccount,
  transaction,
  feesStrategy,
  setIsSendMaxLoading,
}: {
  setFromAmount: SwapTransactionType["setFromAmount"];
  account: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  transaction: SwapTransactionType["transaction"];
  feesStrategy: Transaction["feesStrategy"];
  setIsSendMaxLoading?: SetIsSendMaxLoading;
}): {
  isMaxEnabled: SwapDataType["isMaxEnabled"];
  toggleMax: SwapTransactionType["toggleMax"];
} => {
  const [isMaxEnabled, setIsMaxEnabled] =
    useState<SwapDataType["isMaxEnabled"]>(false);

  const toggleMax: SwapTransactionType["toggleMax"] = useCallback(
    () =>
      setIsMaxEnabled((previous) => {
        if (previous) {
          setFromAmount(ZERO);
          setIsSendMaxLoading?.(false);
        }
        return !previous;
      }),
    [setFromAmount, setIsSendMaxLoading]
  );

  /* UPDATE from amount to the estimate max spendable on account
     change when the amount feature is enabled */
  useEffect(
    () => {
      const updateAmountUsingMax = async () => {
        if (!account) return;
        const bridge = getAccountBridge(account, parentAccount);
        setIsSendMaxLoading?.(true);
        const amount = await bridge.estimateMaxSpendable({
          account,
          parentAccount,
          transaction,
        });
        setIsSendMaxLoading?.(false);
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
