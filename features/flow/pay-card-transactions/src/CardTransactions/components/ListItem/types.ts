import type { PayCardTransactionCategory } from "@domain/api-card-management";
import type { CardTransactionItem, CardTransactionFormatters } from "../../../types";

export type ListItemProps = Readonly<{
  item: CardTransactionItem;
  formatters?: CardTransactionFormatters;
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
