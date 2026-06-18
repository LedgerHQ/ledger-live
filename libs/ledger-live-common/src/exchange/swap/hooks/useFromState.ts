import type { Account, AccountLike } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { useCallback, useMemo, useRef, useState } from "react";
import { selectorStateDefaultValues } from ".";
import { getAccountCurrency, getMainAccount } from "../../../account";
import { getAccountBridge } from "../../../bridge";
import { Result as UseBridgeTransactionReturnType } from "../../../bridge/useBridgeTransaction";
import { SwapSelectorStateType, SwapTransactionType } from "../types";
import BigNumber from "bignumber.js";
import { debounce } from "../utils/debounce";
import { useFetchCurrencyFrom } from "./v5/useFetchCurrencyFrom";

export const useFromState = ({
  accounts,
  defaultCurrency,
  defaultAccount,
  defaultParentAccount,
  bridgeTransaction,
}: {
  accounts?: Account[];
  defaultCurrency?: SwapSelectorStateType["currency"];
  defaultAccount?: SwapSelectorStateType["account"];
  defaultParentAccount?: SwapSelectorStateType["parentAccount"];
  bridgeTransaction: UseBridgeTransactionReturnType;
}): {
  fromCurrencies: string[];
  fromState: SwapSelectorStateType;
  setFromAccount: SwapTransactionType["setFromAccount"];
  setFromAmount: SwapTransactionType["setFromAmount"];
} => {
  const { data: fromCurrencies } = useFetchCurrencyFrom();
  const [fromState, setFromState] = useState<SwapSelectorStateType>({
    ...selectorStateDefaultValues,
    currency: defaultCurrency ?? selectorStateDefaultValues.currency,
    account: defaultAccount ?? selectorStateDefaultValues.account,
    parentAccount: defaultParentAccount ?? selectorStateDefaultValues.parentAccount,
  });

  const estimationRecipientAccountIdRef = useRef<string | undefined>(undefined);

  /* UPDATE from account */
  const setFromAccount: SwapTransactionType["setFromAccount"] = useCallback(
    account => {
      const parentAccount =
        account?.type !== "Account" ? accounts?.find(a => a.id === account?.parentId) : undefined;
      const currency = getAccountCurrency(account as AccountLike);

      bridgeTransaction.setAccount(account as AccountLike, parentAccount);
      setFromState({
        ...selectorStateDefaultValues,
        currency,
        account,
        parentAccount,
      });

      const mainAccount = getMainAccount(account as AccountLike, parentAccount);
      estimationRecipientAccountIdRef.current = mainAccount.id;
      getAccountBridge(mainAccount)
        .then(bridge => {
          if (estimationRecipientAccountIdRef.current !== mainAccount.id) return;
          const recipient = bridge.getEstimationRecipient(mainAccount);
          bridgeTransaction.updateTransaction(transaction => ({
            ...transaction,
            recipient,
          }));
        })
        .catch(e => log("swap", "useFromState: failed to set estimation recipient", e));
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [accounts, bridgeTransaction.updateTransaction],
  );

  const debouncedSetFromAmount = useMemo(
    () =>
      debounce((amount: BigNumber) => {
        bridgeTransaction.updateTransaction(transaction => ({
          ...transaction,
          amount,
        }));
        setFromState(previousState => ({ ...previousState, amount: amount }));
      }, 400),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [bridgeTransaction.updateTransaction],
  );

  const setFromAmount: SwapTransactionType["setFromAmount"] = useCallback(
    amount => debouncedSetFromAmount(amount),
    [debouncedSetFromAmount],
  );

  return {
    fromCurrencies: fromCurrencies ?? [],
    fromState,
    setFromAccount,
    setFromAmount,
  };
};
