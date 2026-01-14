import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import { accountUnitSelector } from "~/reducers/settings";
import { AccountLike } from "@ledgerhq/types-live";
import { State } from "~/reducers/types";

/**
 * Hook to get the unit for an account.
 *
 * @param account
 * The account to get the unit for.
 *
 * @returns
 * The unit for the account.
 */
export function useAccountUnit(account: AccountLike) {
  const selector = useCallback((state: State) => accountUnitSelector(state, account), [account]);
  return useSelector(selector);
}

/**
 * Hook to get the unit for an account.
 *
 * @param account
 * The account to get the unit for.
 *
 * @returns
 * The unit for the account.
 */
export function useMaybeAccountUnit(account?: AccountLike | null) {
  const selector = useCallback(
    (state: State) => (account ? accountUnitSelector(state, account) : undefined),
    [account],
  );
  return useSelector(selector);
}
