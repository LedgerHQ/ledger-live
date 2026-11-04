import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_PAGES,
  accountButtonClickedProps,
  accountTrackingProps,
} from "@features/flow-account-detail";
import { getAccountTrackingFacts } from "../../../../utils/accountTracking";

export function useTransactionsViewModel(account: Account) {
  const accountIds = useMemo(() => flattenAccounts([account]).map(({ id }) => id), [account]);

  const tracking = useMemo(() => {
    const facts = getAccountTrackingFacts(account);
    return {
      header: accountButtonClickedProps(facts, ACCOUNT_DETAIL_BUTTONS.seeAllTransactions),
      operation: { ...accountTrackingProps(facts), page: ACCOUNT_DETAIL_PAGES.account },
    };
  }, [account]);

  return { accountIds, currencyId: account.currency.id, tracking };
}
