import React from "react";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { RecentTransactions } from "LLD/features/History/components/RecentTransactions";
import { ACCOUNT_DETAIL_PAGES } from "@features/flow-account-detail";
import { useTransactionsViewModel } from "./useTransactionsViewModel";

type Props = Readonly<{ account: Account }>;

export function Transactions({ account }: Props) {
  const { t } = useTranslation();
  const { accountIds, currencyId, backPath, onTrackTransactionClick, onTrackSeeAll } =
    useTransactionsViewModel(account);

  return (
    <RecentTransactions
      accountIds={accountIds}
      trackingPage={ACCOUNT_DETAIL_PAGES.account}
      trackingCurrencyId={currencyId}
      backPath={backPath}
      onTrackTransactionClick={onTrackTransactionClick}
      onTrackSeeAll={onTrackSeeAll}
      title={t("history.title")}
      testIdPrefix="account-detail-transactions"
    />
  );
}
