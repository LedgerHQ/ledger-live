import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { PnLSection } from "../PnL";
import { StakingSection } from "../StakingSection";
import { MetricsRowSection as MetricsRowSectionComponent } from "./MetricsRowSection";
import { resolveAssetDetailSectionLoading } from "../../utils/resolveAssetDetailSectionLoading";

type MetricsRowSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  isDistributionLoading?: boolean;
  isMarketLoading?: boolean;
}>;

export function MetricsRowSection({
  distributionItem,
  isDistributionLoading = false,
  isMarketLoading = false,
}: MetricsRowSectionProps) {
  const hasData = distributionItem != null;
  const sectionLoading = resolveAssetDetailSectionLoading(
    isDistributionLoading,
    isMarketLoading,
    hasData,
  );

  if (!distributionItem) {
    if (!sectionLoading) return null;

    return (
      <div className="flex items-stretch gap-12">
        <PnLSection isLoading />
        <StakingSection isLoading />
      </div>
    );
  }

  return (
    <MetricsRowSectionComponent
      distributionItem={distributionItem}
      sectionLoading={sectionLoading}
    />
  );
}
