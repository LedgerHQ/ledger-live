import React from "react";
import { AmountInput } from "./AmountInput";
import { StrategySelect } from "./StrategySelect";
import { CoinControlFooter } from "./CoinControlFooter";
import { FeePresetOption } from "../../../hooks/useFeePresetOptions";
import { FeePresetLegendMap } from "../../../hooks/useFeePresetLegends";
import { FeeFiatMap } from "../../../hooks/useFeePresetFiatValues";
import { UtxoSelector } from "./UtxoSelector";
import { DialogBody } from "@ledgerhq/lumen-ui-react";
import type { BitcoinUtxoDisplayData } from "../hooks/useBitcoinUtxoDisplayData";

type StrategyOptionWithLabel = Readonly<{ value: number; label: string }>;

type CoinControlScreenViewProps = Readonly<{
  utxoDisplayData: BitcoinUtxoDisplayData | null;
  strategyOptionsWithLabels: readonly StrategyOptionWithLabel[];
  changeToReturnFormatted: string;
  onSelectStrategy: (value: string) => void;
  amountValue: string | null;
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  amountError: string | undefined;
  strategyLabel: string;
  learnMoreLabel: string;
  coinToSendLabel: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
  amountToSendLabel: string;
  feesRowLabel: string;
  feesRowValue: string;
  feesRowStrategyLabel: string;
  selectedFeeStrategy: string | null;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  onSelectFeeStrategy: (strategy: string) => void;
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
  coinToSendLabel,
  changeToReturnLabel,
  enterAmountPlaceholder,
  amountToSendLabel,
  feesRowLabel,
  feesRowValue,
  feesRowStrategyLabel,
  selectedFeeStrategy,
  feePresetOptions,
  fiatByPreset,
  legendByPreset,
  onSelectFeeStrategy,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
}: CoinControlScreenViewProps) {
  return (
    <>
      <DialogBody scrollbarWidth="auto" className="flex flex-col gap-12">
        <StrategySelect
          value={utxoDisplayData?.pickingStrategyValue?.toString() ?? ""}
          options={strategyOptionsWithLabels}
          onValueChange={onSelectStrategy}
          strategyLabel={strategyLabel}
          learnMoreLabel={learnMoreLabel}
        />
        <AmountInput
          onAmountChange={onAmountChange}
          amount={amountValue}
          errorMessage={amountError}
          amountToSendLabel={amountToSendLabel}
        />
        <UtxoSelector
          utxoDisplayData={utxoDisplayData}
          strategy={utxoDisplayData?.pickingStrategyValue}
          coinToSendLabel={coinToSendLabel}
        />
      </DialogBody>

      <CoinControlFooter
        changeToReturnFormatted={changeToReturnFormatted}
        changeToReturnLabel={changeToReturnLabel}
        enterAmountPlaceholder={enterAmountPlaceholder}
        feesRowLabel={feesRowLabel}
        feesRowValue={feesRowValue}
        feesRowStrategyLabel={feesRowStrategyLabel}
        selectedFeeStrategy={selectedFeeStrategy}
        feePresetOptions={feePresetOptions}
        fiatByPreset={fiatByPreset}
        legendByPreset={legendByPreset}
        onSelectFeeStrategy={onSelectFeeStrategy}
        onSelectCustomFees={() => {}}
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
