import React, { useMemo } from "react";
import { useLocation } from "react-router";
import type { DistributionItem } from "@ledgerhq/types-live";
import { RecentTransactions } from "LLD/features/History/components/RecentTransactions";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { TransactionsSectionSkeleton } from "./TransactionsSectionSkeleton";

type TransactionsSectionProps = Readonly<{
  distributionItem: DistributionItem;
  isLoading: boolean;
  historyLabel: string;
}>;

export function TransactionsSection({
  distributionItem,
  isLoading,
  historyLabel,
}: TransactionsSectionProps) {
  const { pathname } = useLocation();
  const accountIds = useMemo(
    () => distributionItem.accounts.map(account => account.id),
    [distributionItem.accounts],
  );

  return (
    <RecentTransactions
      accountIds={accountIds}
      trackingPage={ASSET_DETAIL_TRACKING_PAGE_NAME}
      trackingCurrencyId={distributionItem.currency.id}
      backPath={pathname}
      title={historyLabel}
      testIdPrefix="asset-detail-transactions"
      fallback={isLoading ? <TransactionsSectionSkeleton /> : null}
    />
  );
}
