import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { getAccountBridge } from "../../../bridge";
import { Result as UseBridgeTransactionResult } from "../../../bridge/useBridgeTransaction";
import { SwapDataType, SwapSelectorStateType, SwapTransactionType } from "../types";

export const ZERO = new BigNumber(0);

type UseUpdateMaxAmountProps = {
  setFromAmount: SwapTransactionType["setFromAmount"];
  account: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  bridge: UseBridgeTransactionResult;
};

type UseUpdateMaxAmountReturns = {
  isMaxEnabled: SwapDataType["isMaxEnabled"];
  toggleMax: SwapTransactionType["toggleMax"];
  isMaxLoading: SwapDataType["isMaxLoading"];
};

export const useUpdateMaxAmount = ({
  setFromAmount,
  account,
  parentAccount,
  bridge,
}: UseUpdateMaxAmountProps): UseUpdateMaxAmountReturns => {
  const transaction = bridge.transaction;
  const feesStrategy = transaction?.feesStrategy;

  const [isMaxEnabled, setIsMaxEnabled] = useState<SwapDataType["isMaxEnabled"]>(false);
  const [isMaxLoading, setIsMaxLoading] = useState(false);

  const toggleMax: SwapTransactionType["toggleMax"] = useCallback(
    () =>
      setIsMaxEnabled(previous => {
        const next = !previous;
        if (previous) {
          setFromAmount(ZERO);
          setIsMaxLoading(false);
        }
        bridge.updateTransaction(tx => {
          let additionalFees;
          if (tx.family === "evm" && !tx.subAccountId && next) {
            additionalFees = new BigNumber(5000000000000000); // 0,005 ETH/BNB/MATIC
          }
          // do not use useAllAmount for tron because we need to keep some TRX for fees and account alive
          if (tx.family === "tron" && !tx.subAccountId && next) {
            return {
              ...tx,
            };
          }
          return {
            ...tx,
            useAllAmount: next,
            additionalFees,
          };
        });
        return next;
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
        if ("currency" in account && account.currency.id === "tron") {
          // keep 1.1 TRX for fees and 0.1 TRX for keeping the account alive
          if (account?.balance.gt(new BigNumber(1_200_000))) {
            setFromAmount(account?.balance.minus(new BigNumber(1_200_000)));
          }
        } else {
          setFromAmount(amount);
        }
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
