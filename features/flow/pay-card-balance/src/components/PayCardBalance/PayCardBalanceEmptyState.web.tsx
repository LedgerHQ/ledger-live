import React from "react";
import type { PayCardBalanceLabels } from "./types";

type PayCardBalanceEmptyStateProps = Readonly<{
  labels: PayCardBalanceLabels;
}>;

export function PayCardBalanceEmptyState({ labels }: PayCardBalanceEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-16" data-testid="pay-card-balance-empty-state">
      <p className="heading-1-semi-bold text-base">{labels.emptyTitle}</p>
      <p className="body-2 text-muted">{labels.emptyDescription}</p>
    </div>
  );
}
