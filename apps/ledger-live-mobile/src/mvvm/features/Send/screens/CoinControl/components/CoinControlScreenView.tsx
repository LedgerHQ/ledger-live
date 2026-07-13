import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { NetworkFeesViewModel } from "../../../types";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";
import { AmountInput } from "./AmountInput";
import { CoinControlFooter } from "./CoinControlFooter";
import { StrategySelect } from "./StrategySelect";
import { UtxoSelector } from "./UtxoSelector";
import type { CoinControlChangeToReturnViewModel } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";
import { SendFlowLayout } from "../../../components/SendFlowLayout";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type CoinControlScreenViewProps = Readonly<{
  utxoDisplayData: CoinControlDisplayData | null;
  strategyOptionsWithLabels: readonly StrategyOptionWithLabel[];
  changeToReturn: CoinControlChangeToReturnViewModel;
  onSelectStrategy: (value: string) => void;
  amountValue: string | null;
  onAmountChange: (text: string) => void;
  amountError: string | undefined;
  strategyLabel: string;
  onInfoPress: () => void;
  coinToSendLabel: string;
  amountToSendLabel: string;
  networkFees: NetworkFeesViewModel;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds: () => void;
  isCustomPickingStrategy: boolean;
  onToggleUtxoExclusion?: (rowKey: string) => void;
  hasAmount: boolean;
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
  onInfoPress,
  coinToSendLabel,
  amountToSendLabel,
  networkFees,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
  isCustomPickingStrategy,
  onToggleUtxoExclusion,
  hasAmount,
}: CoinControlScreenViewProps) {
  return (
    <SendFlowLayout>
      <Box lx={{ marginHorizontal: "-s8", flex: 1, gap: "s16" }}>
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
          amountToSendLabel={amountToSendLabel}
        />
        <UtxoSelector
          utxoDisplayData={utxoDisplayData}
          coinToSendLabel={coinToSendLabel}
          isCustomPickingStrategy={isCustomPickingStrategy}
          onToggleUtxoExclusion={onToggleUtxoExclusion}
          onInfoPress={onInfoPress}
          hasAmount={hasAmount}
        />
      </Box>
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
    </SendFlowLayout>
  );
}
