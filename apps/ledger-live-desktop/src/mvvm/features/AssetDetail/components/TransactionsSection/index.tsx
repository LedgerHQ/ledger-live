import React from "react";
import { useTranslation } from "react-i18next";
import type { DistributionItem } from "@ledgerhq/types-live";
import { TransactionsSectionView } from "./TransactionsSectionView";
import { useTransactionsSectionViewModel } from "./useTransactionsSectionViewModel";

export type TransactionsSectionProps = Readonly<{
  distributionItem: DistributionItem;
}>;

export function TransactionsSection({ distributionItem }: TransactionsSectionProps) {
  const { t } = useTranslation();
  const { visible, table, onRowClick, onSeeAll } =
    useTransactionsSectionViewModel(distributionItem);

  if (!visible) {
    return null;
  }

  return (
    <TransactionsSectionView
      historyLabel={t("history.title")}
      table={table}
      onRowClick={onRowClick}
      onSeeAll={onSeeAll}
    />
  );
}
