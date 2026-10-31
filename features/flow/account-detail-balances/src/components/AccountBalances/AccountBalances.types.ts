export type BalanceItem = Readonly<{
  id: string;
  label: string;
  /** The formatted amount or figure, ready to display. */
  value: string;
  /** Explains the item: a tooltip on web, an info sheet on native. */
  description?: string;
  /** Set to false for a value that is not an amount; every other value is masked in discreet mode. */
  sensitive?: boolean;
}>;

export type AccountBalancesProps = Readonly<{
  items: readonly BalanceItem[];
  discreet?: boolean;
  testID?: string;
}>;
