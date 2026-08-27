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
