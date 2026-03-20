import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useFlattenSortAccounts } from "~/renderer/actions/general";
import { useHideEmptyTokenAccounts } from "~/renderer/actions/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";
import { matchesSearch } from "~/renderer/screens/accounts/AccountList";

export function useCryptoAccountRows(searchValue: string) {
  const [hideEmptyTokenAccounts] = useHideEmptyTokenAccounts();
  const walletState = useSelector(walletSelector);
  const nestedAccounts = useSelector(accountsSelector);

  const flattenedAccounts = useFlattenSortAccounts({
    enforceHideEmptySubAccounts: hideEmptyTokenAccounts,
  });

  const rows = useMemo(() => {
    return flattenedAccounts.filter(account => matchesSearch(walletState, searchValue, account));
  }, [flattenedAccounts, searchValue, walletState]);

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => {
      for (const a of nestedAccounts) {
        if (a.type === "Account" && a.id === id) {
          return a;
        }
      }
      return null;
    },
    [nestedAccounts],
  );

  return { rows, lookupParentAccount };
}
