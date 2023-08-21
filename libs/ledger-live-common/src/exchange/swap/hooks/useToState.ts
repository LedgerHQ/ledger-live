import { Account } from "@ledgerhq/types-live";
import { useCallback, useMemo, useState } from "react";
import { selectorStateDefaultValues } from ".";
import { getAccountTuplesForCurrency } from "../utils";
import { SwapSelectorStateType, SwapDataType, SwapTransactionType } from "../types";

export const useToState = ({
  accounts,
}: {
  accounts: Account[] | undefined;
}): {
  toState: SwapSelectorStateType;
  setToAccount: SwapTransactionType["setToAccount"];
  setToAmount: SwapTransactionType["setToAmount"];
  setToCurrency: SwapTransactionType["setToCurrency"];
  targetAccounts: SwapDataType["targetAccounts"];
} => {
  const [toState, setToState] = useState<SwapSelectorStateType>(selectorStateDefaultValues);

  /* UPDATE to accounts */
  const setToAccount: SwapTransactionType["setToAccount"] = useCallback(
    (currency, account, parentAccount) =>
      setToState({
        ...selectorStateDefaultValues,
        currency,
        account,
        parentAccount,
      }),
    [],
  );

  /* Get the list of possible target accounts given the target currency. */
  const getTargetAccountsPairs = useCallback(
    currency => currency && accounts && getAccountTuplesForCurrency(currency, accounts, false),
    [accounts],
  );
  const targetAccounts = useMemo(
    () =>
      getTargetAccountsPairs(toState.currency)?.map(
        ({ account, subAccount }) => subAccount || account,
      ),
    [toState.currency, getTargetAccountsPairs],
  );

  const setToCurrency: SwapTransactionType["setToCurrency"] = useCallback(
    currency => {
      const targetAccountsPairs = getTargetAccountsPairs(currency);
      const accountPair = targetAccountsPairs && targetAccountsPairs[0];
      const account = accountPair && (accountPair.subAccount || accountPair.account);
      const parentAccount = accountPair && accountPair.subAccount && accountPair.account;

      setToState({
        ...selectorStateDefaultValues,
        currency,
        account,
        parentAccount,
      });
    },
    [getTargetAccountsPairs],
  );

  const setToAmount: SwapTransactionType["setToAmount"] = useCallback(
    amount => setToState(previousState => ({ ...previousState, amount: amount })),
    [],
  );

  return {
    toState,
    setToAccount,
    setToAmount,
    setToCurrency,
    targetAccounts,
  };
};
