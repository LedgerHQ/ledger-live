import type { ChangeEvent } from "react";
import type {
  FeeSelectorOptionKind,
  FeeSelectorOption,
} from "@ledgerhq/live-common/flows/send/utils/feeSelectorOptions";
import type { FeeAmountDisplay } from "LLD/features/Send/types";
import type { SponsoredFeeNudgeProps } from "./components/Fees/SponsoredFeeNudge";

export type { FeeSelectorOptionKind, FeeSelectorOption };

export type SponsoredFeeDisplay = FeeAmountDisplay &
  Readonly<{
    /** The standard fee's fiat price, struck through before `value`; null when not comparable. */
    originalValue: string | null;
    /** The token the fee is paid in; null when the account holds none. */
    feeAsset: Readonly<{ ledgerId: string; ticker: string }> | null;
    /** Replaces the network fees tooltip, which describes the standard fee path. */
    description: string;
  }>;

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
  sponsoredNudge: SponsoredFeeNudgeProps;
  sponsoredFee: SponsoredFeeDisplay | null;
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
  sponsoredFeeError: string | null;
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
