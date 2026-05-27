import React from "react";
import { AssetDetailSectionSkeleton } from "../AssetDetailSectionSkeleton";

export function TransactionsSectionSkeleton() {
  return (
    <div data-testid="asset-detail-transactions-section">
      <AssetDetailSectionSkeleton
        testId="asset-detail-transactions-skeleton"
        contentClassName="h-56 w-full rounded-12"
      />
    </div>
  );
}
