import { useCallback, useMemo } from "react";
import { useLocation } from "react-router";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_EVENTS,
  accountButtonClickedProps,
  accountTransactionClickedProps,
} from "@features/flow-account-detail";
import { track } from "@shared/analytics";
import { getAccountTrackingFacts } from "../../utils/accountTracking";

export type TransactionsViewModel = Readonly<{
  accountIds: string[];
  currencyId: string;
  backPath: string;
  onTrackTransactionClick: (operationType: string) => void;
  onTrackSeeAll: () => void;
}>;

export function useTransactionsViewModel(account: Account): TransactionsViewModel {
  const { pathname } = useLocation();
  const accountIds = useMemo(() => flattenAccounts([account]).map(({ id }) => id), [account]);

  const onTrackTransactionClick = useCallback(
    (operationType: string) =>
      track(
        ACCOUNT_DETAIL_EVENTS.transactionClicked,
        accountTransactionClickedProps(getAccountTrackingFacts(account), operationType),
      ),
    [account],
  );

  const onTrackSeeAll = useCallback(
    () =>
      track(
        ACCOUNT_DETAIL_EVENTS.buttonClicked,
        accountButtonClickedProps(
          getAccountTrackingFacts(account),
          ACCOUNT_DETAIL_BUTTONS.seeAllTransactions,
        ),
      ),
    [account],
  );

  return {
    accountIds,
    currencyId: account.currency.id,
    backPath: pathname,
    onTrackTransactionClick,
    onTrackSeeAll,
  };
}
