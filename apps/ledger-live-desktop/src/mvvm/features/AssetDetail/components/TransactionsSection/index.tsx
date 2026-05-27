import React from "react";
import { useTranslation } from "react-i18next";
import type { DistributionItem } from "@ledgerhq/types-live";
import { TransactionsSectionSkeleton } from "./TransactionsSectionSkeleton";
import { TransactionsSection as TransactionsSectionComponent } from "./TransactionsSection";
import { shouldShowAssetDetailSectionSkeleton } from "../../utils/shouldShowAssetDetailSectionSkeleton";

export type TransactionsSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function TransactionsSection({ distributionItem, isLoading }: TransactionsSectionProps) {
  const { t } = useTranslation();

  if (!distributionItem) {
    if (!shouldShowAssetDetailSectionSkeleton(isLoading, false)) return null;
    return <TransactionsSectionSkeleton />;
  }

  return (
    <TransactionsSectionComponent
      distributionItem={distributionItem}
      isLoading={isLoading}
      historyLabel={t("history.title")}
    />
  );
}
