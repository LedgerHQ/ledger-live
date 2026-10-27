import type { CardTransactionItem, CardTransactionFormatters } from "../../../types";

export type ListProps = Readonly<{
  transactions: readonly CardTransactionItem[];
  formatters?: CardTransactionFormatters;
  onOpenTransaction?: (item: CardTransactionItem) => void;
}>;
