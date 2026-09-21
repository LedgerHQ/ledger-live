import {
  formatCardTransactionDate,
  formatFundingSources,
  formatMerchantName,
  formatSignedAmount,
} from "./formatCardTransactionItem";
import type { ListItemProps, ListItemViewProps } from "./types";

export function useListItemViewModel({
  item,
  formatters,
  onPress,
}: ListItemProps): ListItemViewProps {
  const { transaction, categoryLabel } = item;

  return {
    id: transaction.id,
    merchant: formatMerchantName(transaction.merchantNameLocation),
    category: transaction.mccCategory,
    categoryLabel,
    fiatAmount: formatSignedAmount(transaction, formatters?.amount),
    assetAmount: formatFundingSources(transaction.fundingSources, formatters?.amount),
    dateLabel: formatCardTransactionDate(transaction.dateTime, formatters?.date),
    onPress,
  };
}
