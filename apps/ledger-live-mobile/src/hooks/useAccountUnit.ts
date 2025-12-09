import { useCallback } from "react";
import { useSelector } from "react-redux";
import { accountUnitSelector } from "../reducers/settings";
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
  const selector = useCallback(
    (state: State) => accountUnitSelector(state, account),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account.id], // Check account identity
  );
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
  const accountId = account?.id;

  const selector = useCallback(
    (state: State) => (account ? accountUnitSelector(state, account) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId], // Check account identity
  );
  return useSelector(selector);
}
