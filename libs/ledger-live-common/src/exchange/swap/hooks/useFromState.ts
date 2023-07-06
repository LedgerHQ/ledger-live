import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo, useState } from "react";
import { selectorStateDefaultValues } from ".";
import { getAccountCurrency, getMainAccount } from "../../../account";
import { Result as UseBridgeTransactionReturnType } from "../../../bridge/useBridgeTransaction";
import { SwapSelectorStateType, SwapTransactionType } from "../types";
import BigNumber from "bignumber.js";
import { debounce } from "../utils/debounce";

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
  fromState: SwapSelectorStateType;
  setFromAccount: SwapTransactionType["setFromAccount"];
  setFromAmount: SwapTransactionType["setFromAmount"];
} => {
  const [fromState, setFromState] = useState<SwapSelectorStateType>({
    ...selectorStateDefaultValues,
    currency: defaultCurrency ?? selectorStateDefaultValues.currency,
    account: defaultAccount ?? selectorStateDefaultValues.account,
    parentAccount: defaultParentAccount ?? selectorStateDefaultValues.parentAccount,
  });

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

      /* @DEV: That populates fake seed. This is required to use Transaction object */
      const mainAccount = getMainAccount(account as AccountLike, parentAccount);
      const mainCurrency = getAccountCurrency(mainAccount);
      const recipient = getAbandonSeedAddress(mainCurrency.id);
      bridgeTransaction.updateTransaction(transaction => ({
        ...transaction,
        recipient,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bridgeTransaction.updateTransaction],
  );

  const setFromAmount: SwapTransactionType["setFromAmount"] = useCallback(
    amount => debouncedSetFromAmount(amount),
    [debouncedSetFromAmount],
  );

  return {
    fromState,
    setFromAccount,
    setFromAmount,
  };
};
