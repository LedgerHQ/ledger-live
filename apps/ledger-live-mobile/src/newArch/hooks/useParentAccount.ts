import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { parentAccountSelector } from "~/reducers/accounts";
import { State } from "~/reducers/types";

/**
 * Hook to get the parent account for a given account.
 *
 * @param account
 * The account to get the parent account for.
 *
 * @returns
 * The parent account for the account.
 */
export function useParentAccount(account?: AccountLike): Account | undefined {
  const selector = useCallback(
    (state: State) => parentAccountSelector(state, { account }),
    [account],
  );
  return useSelector(selector);
}
