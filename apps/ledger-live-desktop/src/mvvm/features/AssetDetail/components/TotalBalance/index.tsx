import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { TotalBalanceSkeleton } from "./TotalBalanceSkeleton";
import { TotalBalance as TotalBalanceComponent } from "./TotalBalance";
import { shouldShowAssetDetailSectionSkeleton } from "../../utils/shouldShowAssetDetailSectionSkeleton";

type TotalBalanceProps = Readonly<{
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function TotalBalance({ distributionItem, isLoading }: TotalBalanceProps) {
  if (shouldShowAssetDetailSectionSkeleton(isLoading, distributionItem != null)) {
    return <TotalBalanceSkeleton />;
  }

  if (!distributionItem) return null;

  return <TotalBalanceComponent distributionItem={distributionItem} />;
}
