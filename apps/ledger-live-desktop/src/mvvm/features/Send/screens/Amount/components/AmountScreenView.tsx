import React from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type { AmountScreenViewProps } from "../types";
import { AmountFooter } from "./AmountFooter";
import { AmountInputSection } from "./AmountInputSection";
import { QuickActionsRow } from "./QuickActionsRow";

export function AmountScreenView({
  amountValue,
  amountInputMaxDecimalLength,
  currencyText,
  currencyPosition,
  isInputDisabled,
  onAmountChange,
  onToggleInputMode,
  toggleLabel,
  secondaryValue,
  feesRowLabel,
  feesRowValue,
  feesRowSecondaryValue,
  feesRowStrategyLabel,
  feeSelector,
  quickActions,
  showQuickActions,
  amountMessage,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
  onMessageLinkPress,
}: AmountScreenViewProps) {
  return (
    <>
      <DialogBody className="py-16 mb-16" data-testid="send-amount-step">
        <div className="flex flex-col gap-24">
          <AmountInputSection
            amountValue={amountValue}
            amountInputMaxDecimalLength={amountInputMaxDecimalLength}
            currencyText={currencyText}
            currencyPosition={currencyPosition}
            isInputDisabled={isInputDisabled}
            onAmountChange={onAmountChange}
            onToggleInputMode={onToggleInputMode}
            toggleLabel={toggleLabel}
            secondaryValue={secondaryValue}
            amountMessage={amountMessage}
            onMessageLinkPress={onMessageLinkPress}
          />

          {showQuickActions ? <QuickActionsRow actions={quickActions} /> : null}
        </div>
      </DialogBody>

      <AmountFooter
        feesRowLabel={feesRowLabel}
        feesRowValue={feesRowValue}
        feesRowSecondaryValue={feesRowSecondaryValue}
        feesRowStrategyLabel={feesRowStrategyLabel}
        feeSelector={feeSelector}
        reviewLabel={reviewLabel}
        reviewShowIcon={reviewShowIcon}
        reviewDisabled={reviewDisabled}
        reviewLoading={reviewLoading}
        onReview={onReview}
        onGetFunds={onGetFunds}
      />
    </>
  );
}
