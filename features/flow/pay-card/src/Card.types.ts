import type { CardLoginProps } from "@features/flow-pay-card-auth";
import type {
  CardVisualProps,
  FormattedValue,
  UnlockForReveal,
} from "@features/flow-pay-card-details";
import type {
  FormatCardTransactionAmount,
  FormatCardTransactionDate,
} from "@features/flow-pay-card-transactions";

export type CardFormatters = Readonly<{
  countervalue?: (value: number) => FormattedValue;
  transactionAmount?: FormatCardTransactionAmount;
  transactionDate?: FormatCardTransactionDate;
}>;

export type { UnlockForReveal };

/** Host input for the Pay Card flow. */
export type CardProps = {
  readonly login: CardLoginProps;
  readonly formatters?: CardFormatters;
  readonly unlock?: UnlockForReveal;
  readonly onShowMore?: () => void;
};

/**
 * Which of the three mutually exclusive faces the flow shows.
 *
 * - `resolving` — the login machine is still reading the stored session. Only the title and the bare
 *   artwork show, so nothing flashes before the answer lands.
 * - `signedOut` — nobody is signed in: the bare artwork sits above the login CTA.
 * - `signedIn` — a live session: the card face, onboarding widget and card actions show, no login.
 */
export type CardDisplayState = "resolving" | "signedOut" | "signedIn";

export type CardViewProps = {
  readonly title: string;
  readonly login: CardLoginProps;
  /** Which face to show. The children are mutually exclusive, so the view switches on this. */
  readonly displayState: CardDisplayState;
  readonly cardVisual?: CardVisualProps;
  readonly formatters?: CardFormatters;
  readonly unlock?: UnlockForReveal;
  readonly onShowMore?: () => void;
};
