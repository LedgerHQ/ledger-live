import React from "react";
import { AmountInput } from "./AmountInput";
import { StrategySelect } from "./StrategySelect";
import { CoinControlFooter } from "./CoinControlFooter";
import type { NetworkFeesViewModel } from "../../../hooks/useNetworkFees";
import { UtxoSelector } from "./UtxoSelector";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";
import type { CoinControlChangeToReturnViewModel } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type CoinControlScreenViewProps = Readonly<{
  utxoDisplayData: CoinControlDisplayData | null;
  strategyOptionsWithLabels: readonly StrategyOptionWithLabel[];
  changeToReturn: CoinControlChangeToReturnViewModel;
  onSelectStrategy: (value: string) => void;
  amountValue: string | null;
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  amountError: string | undefined;
  strategyLabel: string;
  hasAmount: boolean;
  onInfoPress: () => void;
  coinToSendLabel: string;
  amountInputLabel: string;
  networkFees: NetworkFeesViewModel;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds: () => void;
  isCustomPickingStrategy: boolean;
  onToggleUtxoExclusion?: (rowKey: string) => void;
}>;

export function CoinControlScreenView({
  utxoDisplayData,
  strategyOptionsWithLabels,
  changeToReturn,
  onSelectStrategy,
  amountValue,
  onAmountChange,
  amountError,
  strategyLabel,
  hasAmount,
  onInfoPress,
  coinToSendLabel,
  amountInputLabel,
  networkFees,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
  isCustomPickingStrategy,
  onToggleUtxoExclusion,
}: CoinControlScreenViewProps) {
  return (
    <>
      <DialogBody
        scrollbarWidth="auto"
        className="flex flex-col gap-16 [scrollbar-gutter:stable] -mt-4"
      >
        <StrategySelect
          value={utxoDisplayData?.pickingStrategyValue?.toString() ?? ""}
          options={strategyOptionsWithLabels}
          onValueChange={onSelectStrategy}
          strategyLabel={strategyLabel}
        />
        <AmountInput
          onAmountChange={onAmountChange}
          amount={amountValue}
          errorMessage={amountError}
          amountInputLabel={amountInputLabel}
        />
        <UtxoSelector
          utxoDisplayData={utxoDisplayData}
          coinToSendLabel={coinToSendLabel}
          isCustomPickingStrategy={isCustomPickingStrategy}
          onToggleUtxoExclusion={onToggleUtxoExclusion}
          onInfoPress={onInfoPress}
          hasAmount={hasAmount}
        />
      </DialogBody>

      <CoinControlFooter
        changeToReturn={changeToReturn}
        networkFees={networkFees}
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
