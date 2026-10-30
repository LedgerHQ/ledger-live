import { useMemo } from "react";
import { useLocation } from "react-router";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import { ACCOUNT_DETAIL_TRACKING_PAGE_NAME } from "../../constants";

export function useTransactionsViewModel(account: Account) {
  const { pathname } = useLocation();
  const accountIds = useMemo(() => flattenAccounts([account]).map(({ id }) => id), [account]);

  return {
    accountIds,
    trackingPage: ACCOUNT_DETAIL_TRACKING_PAGE_NAME,
    trackingCurrencyId: account.currency.id,
    backPath: pathname,
  };
}
