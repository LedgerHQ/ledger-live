import React from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DistributionItem } from "@ledgerhq/types-live";
import { PnLSection } from "../PnL";
import { StakingSection } from "../StakingSection";
import { METRICS_ROW_CLASS_NAME } from "./constants";
import { MetricsRowSection as MetricsRowSectionComponent } from "./MetricsRowSection";
import { buildStakeableDistributionItem } from "../../utils/buildStakeableDistributionItem";
import { resolveAssetDetailSectionLoading } from "../../utils/resolveAssetDetailSectionLoading";

type MetricsRowSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerCurrency?: CryptoOrTokenCurrency;
  isDistributionLoading?: boolean;
  isMarketLoading?: boolean;
}>;

export function MetricsRowSection({
  distributionItem,
  ledgerCurrency,
  isDistributionLoading = false,
  isMarketLoading = false,
}: MetricsRowSectionProps) {
  const stakingDistributionItem =
    distributionItem ??
    (ledgerCurrency ? buildStakeableDistributionItem(ledgerCurrency) : undefined);
  const hasData = stakingDistributionItem != null;
  const sectionLoading = resolveAssetDetailSectionLoading(
    isDistributionLoading,
    isMarketLoading,
    hasData,
  );

  if (!stakingDistributionItem) {
    if (!sectionLoading) return null;

    return (
      <div className={METRICS_ROW_CLASS_NAME}>
        <PnLSection isLoading />
        <StakingSection isLoading />
      </div>
    );
  }

  return (
    <MetricsRowSectionComponent
      distributionItem={stakingDistributionItem}
      portfolioDistributionItem={distributionItem}
      sectionLoading={sectionLoading}
    />
  );
}
