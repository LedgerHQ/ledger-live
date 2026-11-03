import React from "react";
import { PerpsReviewSheet } from "LLM/features/Perps/components/PerpsReviewSheet";
import type { PerpsReviewViewModel } from "./usePerpsReviewViewModel";

export function PerpsReviewView({
  drawerOpen,
  swapDetails,
  depositDetails,
  handleDrawerClose,
  handleDeposit,
}: Readonly<PerpsReviewViewModel>) {
  return (
    <PerpsReviewSheet
      isOpen={drawerOpen}
      onClose={handleDrawerClose}
      titleKey="perpsReview.depositTitle"
      descriptionKey="perpsReview.depositSubtitle"
      sections={[
        { titleKey: "perpsReview.swapDetailTitle", details: swapDetails },
        { titleKey: "perpsReview.depositDetailTitle", details: depositDetails },
      ]}
      ctaLabelKey="perpsReview.depositCTA"
      ctaTestID="perps-deposit-cta"
      onConfirm={handleDeposit}
    />
  );
}
