import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";

export type CardHistoryViewModel = Readonly<{
  formatters: CardTransactionFormatters;
  formatDay: (date: Date) => string;
  onTrackEvent: (event: string, params: Record<string, unknown>) => void;
  onGoToPay: () => void;
  /** Provider pair of the card asset the history is scoped to, e.g. `usdc.ethereum`. */
  asset?: string;
}>;
