import { useMemo } from "react";
import { useParams } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useAccountIdFromRoute } from "~/renderer/hooks/useAccountIdFromRoute";
import { getAccountRouteSegments, type AccountRouteParams } from "../utils/getAccountRouteSegments";
import { resolveRouteAccount } from "../utils/resolveRouteAccount";
import type { RouteAccount } from "../types";

export function useAccountFromRouteParams(params: AccountRouteParams): RouteAccount {
  const { accountSegment, parentSegment } = getAccountRouteSegments(params);
  const accountId = useAccountIdFromRoute(accountSegment);
  const parentAccountId = useAccountIdFromRoute(parentSegment);
  const accounts = useSelector(accountsSelector);

  return useMemo(
    () => resolveRouteAccount(accounts, accountId, parentAccountId),
    [accounts, accountId, parentAccountId],
  );
}

export function useRouteAccount(): RouteAccount {
  return useAccountFromRouteParams(useParams());
}
