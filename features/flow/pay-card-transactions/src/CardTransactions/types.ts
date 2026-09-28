import type { CardTransactionsDisplayState } from "../logic/cardTransactionsDisplayState";
import type { CardTransactionItem, CardTransactionFormatters } from "../types";

export type CardTransactionsProps = Readonly<{
  formatters?: CardTransactionFormatters;
  onTransactionPress?: (item: CardTransactionItem) => void;
  onShowMore?: () => void;
}>;

export type CardTransactionsScreenViewProps = Readonly<{
  displayState: CardTransactionsDisplayState;
  title: string;
  transactions: readonly CardTransactionItem[];
  formatters?: CardTransactionFormatters;
  onTransactionPress?: (item: CardTransactionItem) => void;
  onShowMore?: () => void;
}>;
