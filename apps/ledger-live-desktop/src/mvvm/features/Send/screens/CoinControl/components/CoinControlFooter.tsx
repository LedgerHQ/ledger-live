import React from "react";
import { Button, DialogFooter } from "@ledgerhq/lumen-ui-react";
import type { CoinControlChangeToReturnViewModel } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";
import { ChangeToReturn } from "./ChangeToReturn";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import type { NetworkFeesViewModel } from "../../../hooks/useNetworkFees";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { NetworkFeesMenu } from "../../Amount/components/Fees/NetworkFeesMenu";

type AmountFooterProps = Readonly<{
  changeToReturn: CoinControlChangeToReturnViewModel;
  networkFees: NetworkFeesViewModel;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds: () => void;
}>;

export function CoinControlFooter({
  changeToReturn,
  networkFees,
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
      <ChangeToReturn changeToReturn={changeToReturn} />
      <NetworkFeesMenu
        display={{
          label: networkFees.feesRowLabel,
          value: networkFees.feesRowValue,
          strategyLabel: networkFees.feesRowStrategyLabel,
        }}
        selection={{
          selectedStrategy: networkFees.selectedFeeStrategy,
          onSelectStrategy: networkFees.onSelectFeeStrategy,
        }}
        presets={{
          options: networkFees.feePresetOptions,
          fiatByPreset: networkFees.fiatByPreset,
          legendByPreset: networkFees.legendByPreset,
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
