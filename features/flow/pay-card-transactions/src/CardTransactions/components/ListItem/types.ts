import type { PayCardTransactionCategory } from "@domain/api-card-management";
import type { CardTransactionItem, FormatCardTransactionAmount } from "../../../types";

export type ListItemProps = Readonly<{
  item: CardTransactionItem;
  formatAmount?: FormatCardTransactionAmount;
}>;

export type ListItemViewProps = Readonly<{
  id: string;
  merchant: string;
  category: PayCardTransactionCategory;
  categoryLabel: string;
  fiatAmount: string;
  assetAmount?: string;
  dateLabel: string;
}>;
