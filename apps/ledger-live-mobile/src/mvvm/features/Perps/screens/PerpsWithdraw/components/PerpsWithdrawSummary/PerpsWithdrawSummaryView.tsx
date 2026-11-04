import React from "react";
import { PerpsReviewSheet } from "LLM/features/Perps/components/PerpsReviewSheet";
import type { PerpsWithdrawSummaryViewModel } from "./usePerpsWithdrawSummaryViewModel";

export function PerpsWithdrawSummaryView({
  drawerOpen,
  swapDetails,
  withdrawDetails,
  canWithdraw,
  handleDrawerClose,
  handleWithdraw,
}: Readonly<PerpsWithdrawSummaryViewModel>) {
  return (
    <PerpsReviewSheet
      isOpen={drawerOpen}
      onClose={handleDrawerClose}
      titleKey="perpsReview.withdrawTitle"
      descriptionKey="perpsReview.withdrawSubtitle"
      sections={[
        { titleKey: "perpsReview.swapDetailTitle", details: swapDetails },
        { titleKey: "perpsReview.withdrawDetailTitle", details: withdrawDetails },
      ]}
      ctaLabelKey="perpsReview.withdrawCTA"
      ctaTestID="perps-withdraw-cta"
      onConfirm={handleWithdraw}
      confirmDisabled={!canWithdraw}
    />
  );
}
