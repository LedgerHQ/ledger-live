import React from "react";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { RecentTransactions } from "LLD/features/History/components/RecentTransactions";
import { ACCOUNT_DETAIL_TRACKING_PAGE_NAME } from "../../constants";
import { useTransactionsViewModel } from "./useTransactionsViewModel";

type Props = Readonly<{ account: Account }>;

export function Transactions({ account }: Props) {
  const { t } = useTranslation();
  const { accountIds, currencyId, backPath } = useTransactionsViewModel(account);

  return (
    <RecentTransactions
      accountIds={accountIds}
      trackingPage={ACCOUNT_DETAIL_TRACKING_PAGE_NAME}
      trackingCurrencyId={currencyId}
      backPath={backPath}
      title={t("history.title")}
      testIdPrefix="account-detail-transactions"
    />
  );
}
