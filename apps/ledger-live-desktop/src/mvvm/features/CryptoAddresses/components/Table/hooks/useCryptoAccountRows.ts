import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useFlattenSortAccounts } from "~/renderer/actions/general";
import { useHideEmptyTokenAccounts } from "~/renderer/actions/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountMatchesSearch } from "LLD/utils/accountMatchesSearch";

export function useCryptoAccountRows(searchValue: string) {
  const [hideEmptyTokenAccounts] = useHideEmptyTokenAccounts();
  const walletState = useSelector(walletSelector);
  const nestedAccounts = useSelector(accountsSelector);

  const flattenOptions = useMemo(
    () => ({
      enforceHideEmptySubAccounts: hideEmptyTokenAccounts,
    }),
    [hideEmptyTokenAccounts],
  );
  const flattenedAccounts = useFlattenSortAccounts(flattenOptions);

  const accountById = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of nestedAccounts) {
      if (a.type === "Account") {
        map.set(a.id, a);
      }
    }
    return map;
  }, [nestedAccounts]);

  const rows = useMemo(() => {
    return flattenedAccounts.filter(account => {
      const parentAddress =
        account.type === "TokenAccount"
          ? accountById.get(account.parentId)?.freshAddress
          : undefined;
      return accountMatchesSearch(walletState, searchValue, account, false, parentAddress);
    });
  }, [flattenedAccounts, searchValue, walletState, accountById]);

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => {
      return accountById.get(id) ?? null;
    },
    [accountById],
  );

  return { rows, lookupParentAccount };
}
