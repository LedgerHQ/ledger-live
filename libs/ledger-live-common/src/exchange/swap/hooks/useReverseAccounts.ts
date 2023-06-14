import type { Account } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { SwapDataType, SwapSelectorStateType, SwapTransactionType } from "../types";
import { flattenAccounts } from "../../../account";

export const useReverseAccounts = ({
  accounts,
  toAccount,
  fromAccount,
  fromParentAccount,
  fromCurrency,
  setFromAccount,
  setToAccount,
}: {
  accounts: Account[] | undefined;
  toAccount: SwapSelectorStateType["account"];
  fromAccount: SwapSelectorStateType["account"];
  fromParentAccount: SwapSelectorStateType["parentAccount"];
  fromCurrency: SwapSelectorStateType["currency"];
  setFromAccount: SwapTransactionType["setFromAccount"];
  setToAccount: SwapTransactionType["setToAccount"];
}): {
  isSwapReversable: SwapDataType["isSwapReversable"];
  reverseSwap: SwapTransactionType["reverseSwap"];
} => {
  const isSwapReversable = useMemo(() => {
    if (!toAccount || !fromCurrency) return false;

    const allAccounstWithSub = accounts ? flattenAccounts(accounts) : [];
    const isToSwappable = !!allAccounstWithSub.find(account => account.id === toAccount?.id);

    return isToSwappable;
  }, [toAccount, fromCurrency, accounts]);

  const reverseSwap: SwapTransactionType["reverseSwap"] = useCallback(() => {
    if (isSwapReversable === false) return;

    setFromAccount(toAccount);
    setToAccount(fromCurrency, fromAccount, fromParentAccount);
  }, [
    toAccount,
    fromCurrency,
    fromAccount,
    fromParentAccount,
    setFromAccount,
    setToAccount,
    isSwapReversable,
  ]);

  return {
    isSwapReversable,
    reverseSwap,
  };
};
