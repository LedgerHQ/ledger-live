import { useCallback } from "react";
import { useSelector } from "~/context/store";
import type { AccountLike } from "@ledgerhq/types-live";
import { currencySettingsForAccountSelector } from "../reducers/settings";
import type { State } from "../reducers/types";

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
  const accountId = account.id;
  const selector = useCallback(
    (state: State) => currencySettingsForAccountSelector(state.settings, { account }),
    // Only recreate the selector when account identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId],
  );
  return useSelector(selector);
}
