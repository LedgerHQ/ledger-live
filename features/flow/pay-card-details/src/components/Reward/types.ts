import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";

export type RewardProps = Readonly<{
  formatters?: CardTransactionFormatters;
  /**
   * The card's supported assets, as the host already resolved them for the assets list. The reward
   * is denominated in one of them, and the currency is what pricing needs the units from.
   */
  currencies?: ReadonlyMap<string, CryptoOrTokenCurrency>;
  /**
   * The reward's worth in the counter-value currency's smallest unit, or `null` when no rate
   * covers it. Rates live in each app, so the host owns this.
   */
  getCounterValue?: (currency: CryptoOrTokenCurrency, amount: string) => number | null;
  /** Renders what {@link RewardProps.getCounterValue} answered, in the user's counter-value currency. */
  formatCountervalue?: (value: number) => string;
  onViewRewards?: () => void;
}>;

export type RewardViewProps = Readonly<{
  /** The reward in its own asset, e.g. `0.00294697 BTC`. */
  amount: string;
  /** The same reward in the counter-value currency, or `null` when nothing could price it. */
  countervalue: string | null;
  subtitle: string;
  onPress?: () => void;
}>;
