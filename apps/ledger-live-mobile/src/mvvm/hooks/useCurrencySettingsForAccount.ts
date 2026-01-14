import { useCallback } from "react";
import { useSelector } from "~/context/hooks";
import type { AccountLike } from "@ledgerhq/types-live";
import { currencySettingsForAccountSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

/**
 * Hook to get currency settings for an account.
 *
 * @param account
 * The account to get currency settings for.
 *
 * @returns
 * The currency settings for the account.
 */
export function useCurrencySettingsForAccount(account: AccountLike) {
  const selector = useCallback(
    (state: State) => currencySettingsForAccountSelector(state.settings, { account }),
    [account],
  );
  return useSelector(selector);
}
