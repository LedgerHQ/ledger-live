import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import { RecentOperations } from "LLM/features/OperationsHistory/components/RecentOperations";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import { useTransactionsViewModel } from "./useTransactionsViewModel";

const ACCOUNT_DETAIL_TRACKING_PAGE = "Account Detail";

type Props = Readonly<{ account: Account }>;

export function Transactions({ account }: Props) {
  const { t } = useTranslation();
  const { accountIds, currencyId } = useTransactionsViewModel(account);

  return (
    <RecentOperations
      accountIds={accountIds}
      trackingPage={ACCOUNT_DETAIL_TRACKING_PAGE}
      trackingCurrencyId={currencyId}
      title={t("accountDetail.transactions.title")}
      testID={ACCOUNT_DETAIL_TEST_IDS.transactions}
      headerTestID={ACCOUNT_DETAIL_TEST_IDS.transactionsHeader}
    />
  );
}
