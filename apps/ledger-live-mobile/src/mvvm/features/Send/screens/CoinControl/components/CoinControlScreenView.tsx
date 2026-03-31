import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { NetworkFeesViewModel } from "../../../types";
import type { CoinControlDisplayData } from "@ledgerhq/live-common/bridge/descriptor/types";
import { AmountInput } from "./AmountInput";
import { CoinControlFooter } from "./CoinControlFooter";
import { StrategySelect } from "./StrategySelect";
import { UtxoSelector } from "./UtxoSelector";
import { SendFlowLayout } from "../../../components/SendFlowLayout";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type CoinControlScreenViewProps = Readonly<{
  utxoDisplayData: CoinControlDisplayData | null;
  strategyOptionsWithLabels: readonly StrategyOptionWithLabel[];
  changeToReturnFormatted: string;
  onSelectStrategy: (value: string) => void;
  amountValue: string | null;
  onAmountChange: (text: string) => void;
  amountError: string | undefined;
  strategyLabel: string;
  learnMoreLabel: string;
  onLearnMoreClick: () => void;
  coinToSendLabel: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
  amountToSendLabel: string;
  amountInputLabel: string;
  networkFees: NetworkFeesViewModel;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds: () => void;
}>;

export function CoinControlScreenView({
  utxoDisplayData,
  strategyOptionsWithLabels,
  changeToReturnFormatted,
  onSelectStrategy,
  amountValue,
  onAmountChange,
  amountError,
  strategyLabel,
  learnMoreLabel,
  onLearnMoreClick,
  coinToSendLabel,
  changeToReturnLabel,
  enterAmountPlaceholder,
  amountToSendLabel,
  amountInputLabel,
  networkFees,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
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
        <UtxoSelector utxoDisplayData={utxoDisplayData} coinToSendLabel={coinToSendLabel} />
      </Box>
      <CoinControlFooter
        changeToReturnFormatted={changeToReturnFormatted}
        changeToReturnLabel={changeToReturnLabel}
        enterAmountPlaceholder={enterAmountPlaceholder}
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
