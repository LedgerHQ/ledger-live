import type { CardLoginOauthConfig, PayCardAuthCallback } from "@features/flow-pay-card-auth";
import type { CardVisualProps, FormattedValue } from "@features/flow-pay-card-details";
import type { ResolveWalletCounterValue } from "@features/flow-pay-card-wallets";

/** Host input for the Pay Card flow. */
export type CardProps = {
  readonly title: string;
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The OAuth redirect the app already parsed, when it has one. The app's router owns the deep link,
   * so it hands the flow the `code` it received.
   */
  readonly callback?: PayCardAuthCallback | null;
  /**
   * Turns the (flow-owned) card balance into a value `AmountDisplay` can render. This is the one bit
   * the flow cannot build itself: it needs the app's locale and counter-value currency. Omit it and
   * the card falls back to the bare artwork.
   */
  readonly formatCountervalue?: (value: number) => FormattedValue;
  /** Localized caption shown above the balance. i18n stays with the host, so the app passes the string. */
  readonly balanceLabel?: string;
  /**
   * Prices one card-linked wallet in the user's counter-value currency. Needs the app's rates and
   * currency settings, so the host owns it. Omit it and the card shows no balance.
   */
  readonly resolveCounterValue?: ResolveWalletCounterValue;
};

/** Props the presentational view renders, resolved by {@link useCardViewModel}. */
export type CardViewProps = {
  readonly title: string;
  readonly oauthConfig: CardLoginOauthConfig;
  readonly callback?: PayCardAuthCallback | null;
  /** Balance overlay for the card face, or `undefined` to show the bare artwork. */
  readonly cardVisual?: CardVisualProps;
};
