import React from "react";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { FeeSelectorOption } from "../types";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { NetworkFeesMenu } from "./Fees/NetworkFeesMenu";

type AmountFooterProps = Readonly<{
  feesRowLabel: string;
  feesRowValue: string;
  feesRowSecondaryValue: string | null;
  feesRowStrategyLabel: string;
  feeSelector: Readonly<{
    options: readonly FeeSelectorOption[];
    selectedId: string;
    canOpen: boolean;
  }>;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds?: () => void;
}>;

export function AmountFooter({
  feesRowLabel,
  feesRowValue,
  feesRowSecondaryValue,
  feesRowStrategyLabel,
  feeSelector,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
}: AmountFooterProps) {
  const { state } = useSendFlowData();
  const { account } = state.account;
  const { transaction } = state.transaction;

  if (!account || !transaction) {
    return null;
  }

  const ctaTestId = reviewShowIcon ? "send-review-button" : "send-get-funds-button";

  return (
    <DialogFooter data-testid="send-amount-footer" className="flex flex-col">
      <div className="border-t border-muted-subtle" />
      <NetworkFeesMenu
        display={{
          label: feesRowLabel,
          value: feesRowValue,
          secondaryValue: feesRowSecondaryValue,
          strategyLabel: feesRowStrategyLabel,
        }}
        feeSelector={feeSelector}
      />
      <Button
        appearance="base"
        size="lg"
        isFull
        onClick={reviewShowIcon ? onReview : onGetFunds}
        disabled={reviewDisabled}
        loading={reviewLoading}
        icon={reviewShowIcon ? LedgerLogo : undefined}
        data-testid={ctaTestId}
        className="rounded-full"
      >
        {reviewLoading ? "" : reviewLabel}
      </Button>
    </DialogFooter>
  );
}
