import type { ChangeEvent } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
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

export type AmountScreenViewProps = Readonly<{
  amountValue: string;
  amountInputMaxDecimalLength: number;
  currencyText: string;
  currencyPosition: "left" | "right";
  isInputDisabled: boolean;
  onAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleInputMode: () => void;
  toggleLabel: string;
  secondaryValue: string;
  feesRowLabel: string;
  feesRowValue: string;
  feesRowStrategyLabel: string;
  feePresetOptions: readonly FeePresetOption[];
  fiatByPreset: FeeFiatMap;
  legendByPreset: FeePresetLegendMap;
  quickActions: AmountScreenQuickAction[];
  showQuickActions: boolean;
  amountMessage?: AmountScreenMessage | null;
  showNetworkFees: boolean;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  selectedFeeStrategy: string | null;
  onSelectFeeStrategy: (strategy: string) => void;
  onReview: () => void;
  onGetFunds?: () => void;
}>;

export type AmountScreenViewModel = Omit<
  AmountScreenViewProps,
  "account" | "parentAccount" | "transaction" | "status" | "onReview" | "onGetFunds"
> &
  Readonly<{
    showFeePresets: boolean;
  }>;
