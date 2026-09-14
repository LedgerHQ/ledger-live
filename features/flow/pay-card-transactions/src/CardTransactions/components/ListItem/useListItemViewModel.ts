import { useTranslation } from "@shared/i18n";
import {
  formatCardTransactionDate,
  formatFundingSources,
  formatMerchantName,
  formatSignedAmount,
} from "./formatCardTransactionItem";
import type { ListItemProps, ListItemViewProps } from "./types";

export function useListItemViewModel({ item, formatAmount }: ListItemProps): ListItemViewProps {
  const { i18n } = useTranslation();
  const { transaction, categoryLabel } = item;

  return {
    id: transaction.id,
    merchant: formatMerchantName(transaction.merchantNameLocation),
    category: transaction.mccCategory,
    categoryLabel,
    fiatAmount: formatSignedAmount(transaction, formatAmount),
    assetAmount: formatFundingSources(transaction.fundingSources, formatAmount),
    dateLabel: formatCardTransactionDate(transaction.dateTime, i18n.language),
  };
}
