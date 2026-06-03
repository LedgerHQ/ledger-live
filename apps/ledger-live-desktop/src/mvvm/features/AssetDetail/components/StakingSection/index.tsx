import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { AssetDetailSectionSkeleton } from "../AssetDetailSectionSkeleton";
import { StakingSection as StakingSectionComponent } from "./StakingSection";
import { shouldShowAssetDetailSectionSkeleton } from "../../utils/shouldShowAssetDetailSectionSkeleton";

type StakingSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function StakingSection({
  distributionItem,
  isLoading,
}: StakingSectionProps) {
  if (shouldShowAssetDetailSectionSkeleton(isLoading, distributionItem != null)) {
    return (
      <AssetDetailSectionSkeleton
        testId="asset-detail-staking-skeleton"
        contentClassName="h-24 w-full rounded-12"
      />
    );
  }

  if (!distributionItem) return null;

  return <StakingSectionComponent distributionItem={distributionItem} />;
}
