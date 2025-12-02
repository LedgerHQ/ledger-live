import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSendFlowContext } from "../../context/SendFlowContext";

export function useAmountViewModel() {
  const { navigation, state, transaction: transactionActions } = useSendFlowContext();
  const { account, parentAccount } = state.account;
  const { transaction, status, bridgePending } = state.transaction;

  const bridge = useMemo(() => {
    if (!account) return null;
    return getAccountBridge(account, parentAccount);
  }, [account, parentAccount]);

  const currency = useMemo(() => {
    if (!account) return null;
    return getAccountCurrency(account);
  }, [account]);

  const onAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!bridge || !transaction) return;
      const value = e.target.value;
      try {
        const amount = value ? new BigNumber(value) : new BigNumber(0);
        transactionActions.setTransaction(bridge.updateTransaction(transaction, { amount }));
      } catch {
        // Invalid number, ignore
      }
    },
    [bridge, transaction, transactionActions],
  );

  const handleContinue = useCallback(() => {
    navigation.goToNextStep();
  }, [navigation]);

  const { amount } = status;

  // For placeholder: allow any amount > 0, ignore all validation errors
  const canContinue = !bridgePending && amount.gt(0);

  return {
    account,
    transaction,
    status,
    bridgePending,
    currency,
    amount,
    errors: status.errors,
    canContinue,
    onAmountChange,
    handleContinue,
  };
}
