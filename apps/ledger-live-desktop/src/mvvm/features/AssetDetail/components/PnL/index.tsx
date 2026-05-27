import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { AssetDetailSectionSkeleton } from "../AssetDetailSectionSkeleton";
import { PnLSection as PnLSectionComponent } from "./PnLSection";
import { shouldShowAssetDetailSectionSkeleton } from "../../utils/shouldShowAssetDetailSectionSkeleton";

type PnLSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function PnLSection({ distributionItem, isLoading }: PnLSectionProps) {
  if (shouldShowAssetDetailSectionSkeleton(isLoading, distributionItem != null)) {
    return (
      <AssetDetailSectionSkeleton
        testId="asset-detail-pnl-skeleton"
        contentClassName="h-40 w-full rounded-12"
      />
    );
  }

  if (!distributionItem) return null;

  return <PnLSectionComponent distributionItem={distributionItem} />;
}
