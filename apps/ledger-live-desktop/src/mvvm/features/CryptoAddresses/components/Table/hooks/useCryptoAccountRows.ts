import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useFlattenSortAccounts, useSortAccountsComparator } from "~/renderer/actions/general";
import { useHideEmptyTokenAccounts } from "~/renderer/actions/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";
import { accountMatchesSearch } from "LLD/utils/accountMatchesSearch";
import {
  buildMainAccountByIdMap,
  lookupParentAccountFromMap,
} from "../../../utils/parentAccountLookup";

export function useCryptoAccountRows(searchValue: string) {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const [hideEmptyTokenAccounts] = useHideEmptyTokenAccounts();
  const walletState = useSelector(walletSelector);
  const nestedAccounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();

  const flattenOptions = useMemo(
    () => ({
      enforceHideEmptySubAccounts: hideEmptyTokenAccounts,
    }),
    [hideEmptyTokenAccounts],
  );
  const flattenedAccounts = useFlattenSortAccounts(flattenOptions);

  const accountById = useMemo(() => buildMainAccountByIdMap(nestedAccounts), [nestedAccounts]);

  const sortedMainAccounts = useMemo(() => {
    const mainAccounts = nestedAccounts.filter((a): a is Account => a.type === "Account");
    return mainAccounts.sort(comparator);
  }, [nestedAccounts, comparator]);

  const rows = useMemo(() => {
    if (shouldDisplayAggregatedAssets) {
      return sortedMainAccounts.filter(account =>
        accountMatchesSearch(walletState, searchValue, account, true),
      );
    }
    return flattenedAccounts.filter(account => {
      const parentAddress =
        account.type === "TokenAccount"
          ? accountById.get(account.parentId)?.freshAddress
          : undefined;
      return accountMatchesSearch(walletState, searchValue, account, false, parentAddress);
    });
  }, [
    shouldDisplayAggregatedAssets,
    sortedMainAccounts,
    flattenedAccounts,
    searchValue,
    walletState,
    accountById,
  ]);

  const lookupParentAccount = useCallback(
    (id: string): Account | undefined | null => lookupParentAccountFromMap(accountById, id),
    [accountById],
  );

  return { rows, lookupParentAccount };
}
