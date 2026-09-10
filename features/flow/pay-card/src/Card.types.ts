import type { CardLoginProps } from "@features/flow-pay-card-auth";
import type {
  CardVisualProps,
  FormattedValue,
  UnlockForCardNumbers,
} from "@features/flow-pay-card-details";
import type { FormatCardTransactionAmount } from "@features/flow-pay-card-transactions";

export type { UnlockForCardNumbers };

/** Host input for the Pay Card flow. */
export type CardProps = {
  readonly title: string;
  readonly login: CardLoginProps;
  /**
   * Turns the (flow-owned) card balance into a value `AmountDisplay` can render. This is the one bit
   * the flow cannot build itself: it needs the app's locale and counter-value currency. Omit it and
   * the card falls back to the bare artwork.
   */
  readonly formatCountervalue?: (value: number) => FormattedValue;
  readonly formatTransactionAmount?: FormatCardTransactionAmount;
  readonly balanceLabel?: string;
  readonly unlock?: UnlockForCardNumbers;
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
  readonly formatTransactionAmount?: FormatCardTransactionAmount;
  readonly unlock?: UnlockForCardNumbers;
};
