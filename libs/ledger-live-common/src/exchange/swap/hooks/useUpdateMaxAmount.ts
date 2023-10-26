import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { Result as UseBridgeTransactionResult } from "../../../bridge/useBridgeTransaction";
import { SwapDataType, SwapTransactionType } from "../types";
import { Transaction } from "../../../generated/types";

export const ZERO = new BigNumber(0);

export const useUpdateMaxAmount = ({
  setFromAmount,
  fromState,
  bridge,
}: {
  setFromAmount: SwapTransactionType["setFromAmount"];
  fromState: SwapDataType["from"];
  bridge: UseBridgeTransactionResult;
}): {
  isMaxEnabled: SwapDataType["isMaxEnabled"];
  toggleMax: SwapTransactionType["toggleMax"];
  isMaxLoading: SwapDataType["isMaxLoading"];
} => {
  const [isMaxEnabled, setIsMaxEnabled] = useState<SwapDataType["isMaxEnabled"]>(false);
  const [isMaxLoading, setIsMaxLoading] = useState(false);

  const toggleMax: SwapTransactionType["toggleMax"] = useCallback(() => {
    setIsMaxEnabled(!isMaxEnabled);
    bridge.updateTransaction((previousTransaction: Transaction) => ({
      ...previousTransaction,
      amount: ZERO,
      useAllAmount: !isMaxEnabled,
    }));
  }, [bridge, isMaxEnabled]);

  useEffect(() => {
    setIsMaxEnabled(!!bridge.transaction?.useAllAmount);
    setIsMaxLoading(bridge.bridgePending && !!bridge.transaction?.useAllAmount);

    if (!bridge.bridgePending) {
      if (
        !fromState.amount ||
        (fromState.amount && !fromState.amount.isEqualTo(bridge.status.amount))
      ) {
        setFromAmount(bridge.status.amount);
      }
    }
  }, [
    fromState.amount,
    setFromAmount,
    bridge.bridgePending,
    bridge.transaction?.useAllAmount,
    bridge.status.amount,
  ]);

  return { isMaxEnabled, toggleMax, isMaxLoading };
};
