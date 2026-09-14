import type { CardTransactionItem, FormatCardTransactionAmount } from "../../../types";

export type ListProps = Readonly<{
  transactions: readonly CardTransactionItem[];
  formatAmount?: FormatCardTransactionAmount;
}>;
