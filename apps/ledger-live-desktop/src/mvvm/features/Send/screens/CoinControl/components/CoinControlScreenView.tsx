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

type CoinControlScreenViewProps = Readonly<{
  utxoDisplayData: BitcoinUtxoDisplayData | null;
  onSelectStrategy: (value: string) => void;
  amountValue: string;
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  onSelectStrategy,
  amountValue,
  onAmountChange,
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
          options={utxoDisplayData?.pickingStrategyOptions ?? []}
          onValueChange={onSelectStrategy}
        />
        <AmountInput onAmountChange={onAmountChange} amount={amountValue} />
        <UtxoSelector
          utxoDisplayData={utxoDisplayData}
          strategy={utxoDisplayData?.pickingStrategyValue}
        />
      </DialogBody>

      <CoinControlFooter
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
