import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { filterTopLevelAccountsByAllowedAccountIds } from "../../utils/accountScopeForHistory";

export function useRecentAccountScope(accountIds: readonly string[]) {
  const allAccounts = useSelector(accountsSelector);
  const accountIdsKey = accountIds.join(",");
  const allowedAccountIds = useMemo(
    () => new Set(accountIdsKey ? accountIdsKey.split(",") : []),
    [accountIdsKey],
  );
  const rootAccounts = useMemo(() => {
    if (allowedAccountIds.size === 0) return [];
    return filterTopLevelAccountsByAllowedAccountIds(allAccounts, allowedAccountIds);
  }, [allAccounts, allowedAccountIds]);

  return { accountIdsKey, allowedAccountIds, rootAccounts };
}
