import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { FeePresetOption } from "../hooks/useFeePresetOptions";
import type { FeeFiatMap } from "../hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "../hooks/useFeePresetLegends";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { NetworkFeesMenu } from "./Fees/NetworkFeesMenu";

type AmountFooterProps = Readonly<{
  feesRowLabel: string;
  feesRowValue: string;
  feesRowStrategyLabel: string;
  selectedFeeStrategy: string | null;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  onSelectFeeStrategy: (strategy: string) => void;
  onOpenCustomFees: () => void;
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
  feesRowStrategyLabel,
  selectedFeeStrategy,
  feePresetOptions,
  fiatByPreset,
  legendByPreset,
  onSelectFeeStrategy,
  onOpenCustomFees,
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
  return (
    <div className="mt-56 pt-12">
      <div className="border-t border-muted-subtle" />
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
          onSelectCustomFees: onOpenCustomFees,
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
        className="rounded-full"
      >
        {reviewLoading ? "" : reviewLabel}
      </Button>
    </div>
  );
}
