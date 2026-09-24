import { useTranslation } from "@shared/i18n";
import {
  formatCardTransactionDate,
  formatFundingLabel,
  formatMerchantName,
  formatSignedAmount,
} from "./formatCardTransactionItem";
import type { ListItemProps, ListItemViewProps } from "./types";

export function useListItemViewModel({
  item,
  formatters,
  onPress,
}: ListItemProps): ListItemViewProps {
  const { t } = useTranslation();
  const { transaction, categoryLabel } = item;

  return {
    id: transaction.id,
    merchant: formatMerchantName(transaction.merchantNameLocation),
    category: transaction.mccCategory,
    categoryLabel,
    fiatAmount: formatSignedAmount(transaction, formatters?.amount),
    assetAmount: formatFundingLabel(
      transaction.fundingSources,
      count => t("payTab.cardTransactions.history.paidWithAssets", { count }),
      formatters?.amount,
    ),
    dateLabel: formatCardTransactionDate(transaction.dateTime, formatters?.date),
    onPress,
  };
}
