import type { CardTransactionItem, CardTransactionFormatters } from "../types";

export type CardTransactionsDisplayMode = "loading" | "error" | "empty" | "list";

export type CardTransactionsProps = Readonly<{
  formatters?: CardTransactionFormatters;
}>;

export type CardTransactionsScreenViewProps = Readonly<{
  displayMode: CardTransactionsDisplayMode;
  title: string;
  transactions: readonly CardTransactionItem[];
  formatters?: CardTransactionFormatters;
}>;
