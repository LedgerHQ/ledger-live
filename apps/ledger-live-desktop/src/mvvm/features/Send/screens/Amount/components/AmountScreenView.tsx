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
  onOpenCustomFees,
  onSelectCoinControl,
  onReview,
  onGetFunds,
  pluginsSlot,
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
          />

          {showQuickActions ? <QuickActionsRow actions={quickActions} /> : null}

          {pluginsSlot}
        </div>
      </DialogBody>

      <AmountFooter
        feesRowLabel={feesRowLabel}
        feesRowValue={feesRowValue}
        feesRowStrategyLabel={feesRowStrategyLabel}
        selectedFeeStrategy={selectedFeeStrategy}
        feePresetOptions={feePresetOptions}
        fiatByPreset={fiatByPreset}
        legendByPreset={legendByPreset}
        onSelectFeeStrategy={onSelectFeeStrategy}
        onSelectCustomFees={onOpenCustomFees}
        onSelectCoinControl={onSelectCoinControl}
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
