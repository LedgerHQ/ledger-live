import type { FormattedValue } from "@ledgerhq/lumen-utils-shared";

// Shared with the host (`AmountDisplay` formatter contract).
export type { FormattedValue };

/** Host props for the card visual (artwork + balance overlay). Props-only, i18n-agnostic. */
export type CardVisualProps = Readonly<{
  /** Raw countervalue amount (e.g. 100). Formatting is delegated to {@link formatCountervalue}. */
  balance: number;
  /** Turns a raw number into a {@link FormattedValue} for `AmountDisplay`. */
  formatCountervalue: (value: number) => FormattedValue;

  balanceLabel: string;
  isLoading?: boolean;
}>;

export type CardVisualViewProps = CardVisualProps;

export type FreezeCardViewProps = Readonly<{
  isFrozen: boolean;
  /** `true` when card status is BLOCKED — disables all freeze/unfreeze actions. */
  isBlocked: boolean;
  isStatusLoading: boolean;
  isFreezeLoading: boolean;
  isUnfreezeLoading: boolean;
  isFreezeError: boolean;
  isUnfreezeError: boolean;
  isConfirmOpen: boolean;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirm: () => void;
}>;

export type FreezeViewProps = Pick<
  FreezeCardViewProps,
  | "isFrozen"
  | "isBlocked"
  | "isStatusLoading"
  | "isFreezeLoading"
  | "isUnfreezeLoading"
  | "isConfirmOpen"
  | "onOpenConfirm"
  | "onCloseConfirm"
  | "onConfirm"
>;

export type FreezeConfirmSheetProps = Readonly<{
  isOpen: boolean;
  isFrozen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}>;
