import {
  formatCardTransactionDate,
  formatFundingSourceForAsset,
  formatFundingSources,
  formatMerchantName,
  formatSignedAmount,
} from "./formatCardTransactionItem";
import type { ListItemProps, ListItemViewProps } from "./types";

export function useListItemViewModel({
  item,
  formatters,
  assetCode,
  valueLabel,
  onPress,
}: ListItemProps): ListItemViewProps {
  const { transaction, categoryLabel } = item;

  return {
    id: transaction.id,
    merchant: formatMerchantName(transaction.merchantNameLocation),
    category: transaction.mccCategory,
    categoryLabel,
    fiatAmount: formatSignedAmount(transaction, formatters?.amount),
    assetAmount: assetCode
      ? formatFundingSourceForAsset(transaction.fundingSources, assetCode, formatters?.amount)
      : formatFundingSources(transaction.fundingSources, formatters?.amount),
    valueLabel,
    dateLabel: formatCardTransactionDate(transaction.dateTime, formatters?.date),
    onPress,
  };
}
