import { useMemo } from "react";
import { useSelector } from "~/context/store";
import { shallowEqual } from "react-redux";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { accountScreenSelector } from "~/reducers/accounts";

/**
 * Hook to safely use accountScreenSelector with react-redux v9.
 *
 * @param route
 * The navigation route containing account params
 *
 * @returns
 * The selected account and parent account.
 */
export function useAccountScreen(route?: {
  params?: {
    account?: AccountLike;
    accountId?: string | null;
    parentId?: string | null;
  };
}): {
  account: AccountLike | undefined;
  parentAccount: Account | null | undefined;
} {
  const selector = useMemo(
    () => accountScreenSelector(route),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route?.params?.account, route?.params?.accountId, route?.params?.parentId],
  );

  return useSelector(selector, shallowEqual);
}
