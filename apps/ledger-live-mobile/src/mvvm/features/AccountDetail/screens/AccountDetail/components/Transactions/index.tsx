import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import { RecentOperations } from "LLM/features/OperationsHistory/components/RecentOperations";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import { ACCOUNT_DETAIL_PAGES } from "@features/flow-account-detail";
import { useTransactionsViewModel } from "./useTransactionsViewModel";

type Props = Readonly<{ account: Account }>;

export function Transactions({ account }: Props) {
  const { t } = useTranslation();
  const { accountIds, currencyId, tracking } = useTransactionsViewModel(account);

  return (
    <RecentOperations
      accountIds={accountIds}
      trackingPage={ACCOUNT_DETAIL_PAGES.account}
      trackingCurrencyId={currencyId}
      headerTracking={tracking.header}
      operationTracking={tracking.operation}
      title={t("accountDetail.transactions.title")}
      testID={ACCOUNT_DETAIL_TEST_IDS.transactions}
      headerTestID={ACCOUNT_DETAIL_TEST_IDS.transactionsHeader}
    />
  );
}
