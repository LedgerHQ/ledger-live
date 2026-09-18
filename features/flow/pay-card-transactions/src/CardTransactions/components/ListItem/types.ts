import type { PayCardTransactionCategory } from "@domain/api-card-management";
import type { CardTransactionItem, CardTransactionFormatters } from "../../../types";

export type ListItemProps = Readonly<{
  item: CardTransactionItem;
  formatters?: CardTransactionFormatters;
  /** Provider asset code: the crypto line is that source only, labelled Value. */
  assetCode?: string;
  valueLabel?: string;
  onPress?: () => void;
}>;

export type ListItemViewProps = Readonly<{
  id: string;
  merchant: string;
  category: PayCardTransactionCategory;
  categoryLabel: string;
  fiatAmount: string;
  assetAmount?: string;
  valueLabel?: string;
  dateLabel: string;
  onPress?: () => void;
}>;
