import type { ChangeEvent } from "react";
import type {
  FeeSelectorOptionKind,
  FeeSelectorOption,
} from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";

export type { FeeSelectorOptionKind, FeeSelectorOption };

export type AmountScreenMessage = Readonly<{
  type: "error" | "warning" | "info";
  text: string;
  error?: Error;
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
  onMessageLinkPress?: (link: string) => void;
}>;

type FeesProps = Readonly<{
  feesRowLabel: string;
  feesRowValue: string;
  feesRowSecondaryValue: string | null;
  feesRowStrategyLabel: string;
  showNetworkFees: boolean;
  selectedFeeStrategy: string | null;
  feeSelector: Readonly<{
    options: readonly FeeSelectorOption[];
    selectedId: string;
    canOpen: boolean;
  }>;
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

export type AmountScreenViewModel = Omit<
  AmountScreenViewProps,
  "onReview" | "onGetFunds" | "onMessageLinkPress"
> &
  Readonly<{
    inputMode: "fiat" | "crypto";
  }>;
