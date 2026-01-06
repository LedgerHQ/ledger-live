import React from "react";
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
  feesRowStrategyLabel,
  feePresetOptions,
  fiatByPreset,
  legendByPreset,
  quickActions,
  showQuickActions,
  amountMessage,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  selectedFeeStrategy,
  onSelectFeeStrategy,
  onReview,
  onGetFunds,
}: AmountScreenViewProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-24">
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
        />

        {showQuickActions ? <QuickActionsRow actions={quickActions} /> : null}
      </div>

      <AmountFooter
        feesRowLabel={feesRowLabel}
        feesRowValue={feesRowValue}
        feesRowStrategyLabel={feesRowStrategyLabel}
        selectedFeeStrategy={selectedFeeStrategy}
        feePresetOptions={feePresetOptions}
        fiatByPreset={fiatByPreset}
        legendByPreset={legendByPreset}
        onSelectFeeStrategy={onSelectFeeStrategy}
        reviewLabel={reviewLabel}
        reviewShowIcon={reviewShowIcon}
        reviewDisabled={reviewDisabled}
        reviewLoading={reviewLoading}
        onReview={onReview}
        onGetFunds={onGetFunds}
      />
    </div>
  );
}
