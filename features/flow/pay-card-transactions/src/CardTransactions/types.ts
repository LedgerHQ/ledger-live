import type { CardTransactionItem, CardTransactionFormatters } from "../types";

export type CardTransactionsDisplayMode = "loading" | "error" | "empty" | "list";

export type CardTransactionsProps = Readonly<{
  formatters?: CardTransactionFormatters;
  onTransactionPress?: (item: CardTransactionItem) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type CardTransactionsScreenViewProps = Readonly<{
  displayMode: CardTransactionsDisplayMode;
  title: string;
  transactions: readonly CardTransactionItem[];
  formatters?: CardTransactionFormatters;
  onTransactionPress?: (item: CardTransactionItem) => void;
}>;
