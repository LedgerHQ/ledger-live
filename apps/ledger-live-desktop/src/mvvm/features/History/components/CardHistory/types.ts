import type {
  CardTransactionFormatters,
  CardTransactionHistoryColumnSet,
  CardTransactionItem,
} from "@features/flow-pay-card-transactions";

export type CardHistoryViewModel = Readonly<{
  formatters: CardTransactionFormatters;
  formatDay: (date: Date) => string;
  onTrackEvent: (event: string, params: Record<string, unknown>) => void;
  onGoToPay: () => void;
  /** Set when the history is scoped to one card asset. */
  filterTransaction?: (item: CardTransactionItem) => boolean;
  assetCode?: string;
  columnSet: CardTransactionHistoryColumnSet;
}>;
