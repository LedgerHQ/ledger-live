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
  learnMoreLabel: string;
  onLearnMoreClick: () => void;
  coinToSendLabel: string;
  amountToSendLabel: string;
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
  learnMoreLabel,
  onLearnMoreClick,
  coinToSendLabel,
  amountToSendLabel,
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
    <SendFlowLayout>
      <Box lx={{ marginHorizontal: "-s8", flex: 1, gap: "s24" }}>
        <StrategySelect
          value={utxoDisplayData?.pickingStrategyValue?.toString() ?? ""}
          options={strategyOptionsWithLabels}
          onValueChange={onSelectStrategy}
          strategyLabel={strategyLabel}
          learnMoreLabel={learnMoreLabel}
          onLearnMorePress={onLearnMoreClick}
        />
        <AmountInput
          onAmountChange={onAmountChange}
          amount={amountValue}
          errorMessage={amountError}
          amountToSendLabel={amountToSendLabel}
          amountInputLabel={amountInputLabel}
        />
        <UtxoSelector
          utxoDisplayData={utxoDisplayData}
          coinToSendLabel={coinToSendLabel}
          isCustomPickingStrategy={isCustomPickingStrategy}
          onToggleUtxoExclusion={onToggleUtxoExclusion}
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
