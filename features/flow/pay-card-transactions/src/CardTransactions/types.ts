import type { CardTransactionItem, FormatCardTransactionAmount } from "../types";

export type CardTransactionsDisplayMode = "loading" | "error" | "empty" | "list";

export type CardTransactionsProps = Readonly<{
  formatAmount?: FormatCardTransactionAmount;
}>;

export type CardTransactionsScreenViewProps = Readonly<{
  displayMode: CardTransactionsDisplayMode;
  title: string;
  transactions: readonly CardTransactionItem[];
  formatAmount?: FormatCardTransactionAmount;
}>;
