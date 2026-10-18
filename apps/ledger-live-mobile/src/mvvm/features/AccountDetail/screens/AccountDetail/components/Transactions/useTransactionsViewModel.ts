import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";

export function useTransactionsViewModel(account: Account) {
  const accountIds = useMemo(() => flattenAccounts([account]).map(({ id }) => id), [account]);

  return { accountIds, currencyId: account.currency.id };
}
