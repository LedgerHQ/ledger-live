import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useSortAccountsComparator } from "~/renderer/actions/general";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountMatchesSearch } from "LLD/utils/accountMatchesSearch";
import {
  buildMainAccountByIdMap,
  lookupParentAccountFromMap,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";

export function useCryptoAccountRows(searchValue: string) {
  const walletState = useSelector(walletSelector);
  const nestedAccounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();

  const accountById = useMemo(() => buildMainAccountByIdMap(nestedAccounts), [nestedAccounts]);

  const sortedMainAccounts = useMemo(() => {
    const mainAccounts = nestedAccounts.filter((a): a is Account => a.type === "Account");
    return mainAccounts.sort(comparator);
  }, [nestedAccounts, comparator]);

  const rows = useMemo(
    () =>
      sortedMainAccounts.filter(account =>
        accountMatchesSearch(walletState, searchValue, account, true),
      ),
    [sortedMainAccounts, searchValue, walletState],
  );

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => lookupParentAccountFromMap(accountById, id),
    [accountById],
  );

  return { rows, lookupParentAccount };
}
