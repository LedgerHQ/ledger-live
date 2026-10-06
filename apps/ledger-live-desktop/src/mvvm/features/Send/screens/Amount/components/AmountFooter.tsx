import React from "react";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { FeeSelectorOption, SponsoredFeeDisplay } from "../types";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { AmountMessageText } from "./AmountMessageText";
import { NetworkFeesMenu } from "./Fees/NetworkFeesMenu";
import { EstimatedTimeRow } from "./EstimatedTimeRow";
import { useEstimatedTimeViewModel } from "../hooks/useEstimatedTimeViewModel";
import type { SponsoredFeeNudgeProps } from "./Fees/SponsoredFeeNudge";

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
  sponsoredNudge: SponsoredFeeNudgeProps;
  sponsoredFee: SponsoredFeeDisplay | null;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  sponsoredFeeError: string | null;
  onReview: () => void;
  onGetFunds?: () => void;
}>;

export function AmountFooter({
  feesRowLabel,
  feesRowValue,
  feesRowSecondaryValue,
  feesRowStrategyLabel,
  feeSelector,
  sponsoredNudge,
  sponsoredFee,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  sponsoredFeeError,
  onReview,
  onGetFunds,
}: AmountFooterProps) {
  const { state } = useSendFlowData();
  const { account } = state.account;
  const { transaction } = state.transaction;
  const estimatedTime = useEstimatedTimeViewModel();

  if (!account || !transaction) {
    return null;
  }

  const ctaTestId = reviewShowIcon ? "send-review-button" : "send-get-funds-button";

  return (
    <DialogFooter data-testid="send-amount-footer" className="flex flex-col">
      {sponsoredFeeError ? (
        <AmountMessageText
          message={{ type: "error", text: sponsoredFeeError }}
          testId="send-sponsored-fee-error"
        />
      ) : null}
      <div className="border-t border-muted-subtle" />
      <NetworkFeesMenu
        display={{
          label: feesRowLabel,
          value: feesRowValue,
          secondaryValue: feesRowSecondaryValue,
          strategyLabel: feesRowStrategyLabel,
        }}
        feeSelector={feeSelector}
        sponsoredNudge={sponsoredNudge}
        sponsoredFee={sponsoredFee}
      />
      {estimatedTime ? <EstimatedTimeRow estimatedTime={estimatedTime} /> : null}
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
