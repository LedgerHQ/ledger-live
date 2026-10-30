import React from "react";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { RecentTransactions } from "LLD/features/History/components/RecentTransactions";
import { useTransactionsViewModel } from "./useTransactionsViewModel";

type Props = Readonly<{ account: Account }>;

export function Transactions({ account }: Props) {
  const { t } = useTranslation();
  const { accountIds, trackingPage, trackingCurrencyId, backPath } =
    useTransactionsViewModel(account);

  return (
    <RecentTransactions
      accountIds={accountIds}
      trackingPage={trackingPage}
      trackingCurrencyId={trackingCurrencyId}
      backPath={backPath}
      title={t("history.title")}
      testIdPrefix="account-detail-transactions"
    />
  );
}
