import type { CardLoginProps } from "@features/flow-pay-card-auth";
import type {
  CardSettingsActions,
  CardVisualProps,
  FormattedValue,
} from "@features/flow-pay-card-details";
import type {
  FormatCardTransactionAmount,
  FormatCardTransactionDate,
} from "@features/flow-pay-card-transactions";
import type { CardAssetsProps } from "@features/flow-pay-card-assets";

export type CardFormatters = Readonly<{
  countervalue?: (value: number) => FormattedValue;
  transactionAmount?: FormatCardTransactionAmount;
  transactionDate?: FormatCardTransactionDate;
}>;

/** Host input for the Pay Card flow. */
export type CardProps = {
  readonly login: CardLoginProps;
  /** The funding wallets, priced by the host. Omitted where the host does not list them. */
  readonly assets?: CardAssetsProps;
  readonly formatters?: CardFormatters;
  readonly onShowMore?: () => void;
  readonly onTopUp?: () => void;
  readonly onChooseCardType?: () => void;
  readonly onViewRewards?: () => void;
  readonly cardSettingsActions?: CardSettingsActions;
  readonly discreet?: boolean;
};

/**
 * Which of the three mutually exclusive faces the flow shows.
 *
 * - `resolving` — the login machine is still reading the stored session. The card face shows with
 *   a loading balance, so no login CTA flashes before the answer lands.
 * - `signedOut` — nobody is signed in: the bare artwork sits above the login CTA.
 * - `signedIn` — a live session: the card face, onboarding widget and card actions show, no login.
 */
export type CardDisplayState = "resolving" | "signedOut" | "signedIn";

export type CardViewProps = {
  readonly title: string;
  readonly disclaimer: string;
  readonly login: CardLoginProps;
  /** Which face to show. The children are mutually exclusive, so the view switches on this. */
  readonly displayState: CardDisplayState;
  readonly cardVisual?: CardVisualProps;
  readonly assets?: CardAssetsProps;
  readonly formatters?: CardFormatters;
  readonly onShowMore?: () => void;
  readonly onTopUp?: () => void;
  readonly onChooseCardType?: () => void;
  readonly onViewRewards?: () => void;
  readonly cardSettingsActions?: CardSettingsActions;
};
