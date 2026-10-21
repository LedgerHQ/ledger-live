import { useMemo } from "react";
import { useLocation } from "react-router";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";

export type TransactionsViewModel = Readonly<{
  accountIds: string[];
  currencyId: string;
  backPath: string;
}>;

export function useTransactionsViewModel(account: Account): TransactionsViewModel {
  const { pathname } = useLocation();
  const accountIds = useMemo(() => flattenAccounts([account]).map(({ id }) => id), [account]);

  return { accountIds, currencyId: account.currency.id, backPath: pathname };
}
