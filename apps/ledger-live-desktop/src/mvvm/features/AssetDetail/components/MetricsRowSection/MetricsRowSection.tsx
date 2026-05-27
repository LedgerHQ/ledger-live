import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { PnLSection } from "../PnL";
import { StakingSection } from "../StakingSection";
import { useMetricsRowSectionViewModel } from "./useMetricsRowSectionViewModel";

type MetricsRowSectionProps = Readonly<{
  distributionItem: DistributionItem;
  sectionLoading: boolean;
}>;

export function MetricsRowSection({ distributionItem, sectionLoading }: MetricsRowSectionProps) {
  const { shouldRenderSection, pnlVisible } = useMetricsRowSectionViewModel({ distributionItem });

  if (!shouldRenderSection && !sectionLoading) return null;

  return (
    <div className="flex items-stretch gap-12">
      <PnLSection distributionItem={distributionItem} isLoading={sectionLoading} />
      <StakingSection
        distributionItem={distributionItem}
        pnlVisible={pnlVisible}
        isLoading={sectionLoading}
      />
    </div>
  );
}
