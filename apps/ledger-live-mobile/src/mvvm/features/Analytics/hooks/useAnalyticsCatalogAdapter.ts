import { useCallback, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { useAnalyticsCatalog, type AnalyticsCatalogResult } from "@features/flow-account-analytics";
import { isConfirmedOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import {
  blacklistedTokenIdsSelector,
  confirmationsNbForCurrencySelector,
} from "~/reducers/settings";
import { useBatchMaybeAccountName } from "~/reducers/wallet";
import { appVersion } from "LLM/utils/appVersion";

export function useAnalyticsCatalogAdapter(): AnalyticsCatalogResult<Account> {
  const accounts = useSelector(accountsSelector);
  const blacklistedIds = useSelector(blacklistedTokenIdsSelector);
  const accountNames = useBatchMaybeAccountName(accounts);
  const currencies = useMemo(
    () => [...new Map(accounts.map(account => [account.currency.id, account.currency])).values()],
    [accounts],
  );
  const confirmations = useSelector(
    state =>
      Object.fromEntries(
        currencies.map(currency => [
          currency.id,
          confirmationsNbForCurrencySelector(state, { currency }),
        ]),
      ),
    shallowEqual,
  );
  const isConfirmed = useCallback(
    (operation: Operation, account: Account) =>
      isConfirmedOperation(operation, account, confirmations[account.currency.id]),
    [confirmations],
  );
  return useAnalyticsCatalog({
    accounts,
    accountNames,
    blacklistedIds,
    isConfirmed,
    product: "llm",
    version: appVersion,
  });
}
