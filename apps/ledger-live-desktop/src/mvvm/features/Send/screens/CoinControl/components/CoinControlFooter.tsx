import React from "react";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import { ChangeToReturn } from "./ChangeToReturn";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { FeePresetOption } from "../../../hooks/useFeePresetOptions";
import type { FeeFiatMap } from "../../../hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "../../../hooks/useFeePresetLegends";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { NetworkFeesMenu } from "../../Amount/components/Fees/NetworkFeesMenu";

type AmountFooterProps = Readonly<{
  changeToReturnFormatted: string;
  feesRowLabel: string;
  feesRowValue: string;
  feesRowStrategyLabel: string;
  selectedFeeStrategy: string | null;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  onSelectFeeStrategy: (strategy: string) => void;
  onSelectCustomFees: () => void;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds?: () => void;
}>;

export function CoinControlFooter({
  changeToReturnFormatted,
  feesRowLabel,
  feesRowValue,
  feesRowStrategyLabel,
  selectedFeeStrategy,
  feePresetOptions,
  fiatByPreset,
  legendByPreset,
  onSelectFeeStrategy,
  onSelectCustomFees,
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
    <DialogFooter data-testid="send-coin-control-footer" className="flex flex-col">
      <div className="border-t border-muted-subtle" />
      <ChangeToReturn value={changeToReturnFormatted} />
      <NetworkFeesMenu
        display={{
          label: feesRowLabel,
          value: feesRowValue,
          strategyLabel: feesRowStrategyLabel,
        }}
        selection={{
          selectedStrategy: selectedFeeStrategy,
          onSelectStrategy: onSelectFeeStrategy,
        }}
        presets={{
          options: feePresetOptions,
          fiatByPreset,
          legendByPreset,
        }}
        actions={{
          onSelectCustomFees: onSelectCustomFees,
        }}
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
