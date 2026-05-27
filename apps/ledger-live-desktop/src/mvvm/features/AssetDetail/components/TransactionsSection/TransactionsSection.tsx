import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { TransactionsSectionView } from "./TransactionsSectionView";
import { useTransactionsSectionViewModel } from "./useTransactionsSectionViewModel";
import { TransactionsSectionSkeleton } from "./TransactionsSectionSkeleton";
import { shouldShowAssetDetailSectionSkeleton } from "../../utils/shouldShowAssetDetailSectionSkeleton";

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
  const { visible, table, onRowClick, onSeeAll } =
    useTransactionsSectionViewModel(distributionItem);

  if (shouldShowAssetDetailSectionSkeleton(isLoading, visible)) {
    return <TransactionsSectionSkeleton />;
  }

  if (!visible) {
    return null;
  }

  return (
    <TransactionsSectionView
      historyLabel={historyLabel}
      table={table}
      onRowClick={onRowClick}
      onSeeAll={onSeeAll}
    />
  );
}
