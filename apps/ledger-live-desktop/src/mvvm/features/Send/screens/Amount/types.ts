import type { ChangeEvent } from "react";
import type { FeePresetOption } from "./hooks/useFeePresetOptions";
import type { FeeFiatMap } from "./hooks/useFeePresetFiatValues";
import type { FeePresetLegendMap } from "./hooks/useFeePresetLegends";

export type AmountScreenMessage = Readonly<{
  type: "error" | "warning" | "info";
  text: string;
}>;

export type AmountScreenQuickAction = Readonly<{
  id: string;
  label: string;
  onClick: () => void;
  active: boolean;
  disabled: boolean;
}>;

export type AmountScreenFeeSummary = Readonly<{
  fiatLabel: string;
  fiatValue: string;
  cryptoLabel: string;
  cryptoValue: string;
  description: string;
}>;

export type AmountScreenBanner = Readonly<{
  title: string;
  description: string;
}>;

type AmountInputProps = Readonly<{
  amountValue: string;
  amountInputMaxDecimalLength: number;
  currencyText: string;
  currencyPosition: "left" | "right";
  isInputDisabled: boolean;
  onAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleInputMode: () => void;
  toggleLabel: string;
  secondaryValue: string;
  amountMessage?: AmountScreenMessage | null;
}>;

type FeesProps = Readonly<{
  feesRowLabel: string;
  feesRowValue: string;
  feesRowStrategyLabel: string;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  showNetworkFees: boolean;
  selectedFeeStrategy: string | null;
  onSelectFeeStrategy: (strategy: string) => void;
}>;

type QuickActionsProps = Readonly<{
  quickActions: AmountScreenQuickAction[];
  showQuickActions: boolean;
}>;

type ReviewProps = Readonly<{
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds?: () => void;
}>;

export type AmountScreenViewProps = AmountInputProps & FeesProps & QuickActionsProps & ReviewProps;

export type AmountScreenViewModel = Omit<AmountScreenViewProps, "onReview" | "onGetFunds"> &
  Readonly<{
    showFeePresets: boolean;
  }>;
