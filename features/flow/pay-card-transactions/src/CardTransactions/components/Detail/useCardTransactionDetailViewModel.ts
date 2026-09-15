import type { PayCardTransaction } from "@domain/api-card-management";
import { useTranslation } from "@shared/i18n";
import { copyToClipboard } from "./copyToClipboard";
import {
  formatFundingSources,
  formatMaskedPanLast4,
  formatMerchantName,
  formatSignedAmount,
  formatTransactionDetailDateTime,
} from "../ListItem/formatCardTransactionItem";
import type {
  CardTransactionDetailProps,
  CardTransactionDetailRow,
  CardTransactionDetailViewProps,
} from "./types";

const STATUS_APPEARANCE = {
  CONFIRMED: "success",
  PENDING: "warning",
  DECLINED: "error",
  REVERTED: "gray",
} as const satisfies Record<PayCardTransaction["status"], "success" | "warning" | "error" | "gray">;

export function useCardTransactionDetailViewModel({
  transaction,
  formatters,
}: CardTransactionDetailProps): CardTransactionDetailViewProps {
  const { t } = useTranslation();
  const rows: CardTransactionDetailRow[] = [
    {
      id: "amount",
      label: t("payTab.cardTransactions.detail.amount"),
      value: formatSignedAmount(transaction, formatters?.amount),
    },
    {
      id: "status",
      label: t("payTab.cardTransactions.detail.status"),
      value: t(`payTab.cardTransactions.detail.statusValues.${transaction.status}`),
      statusAppearance: STATUS_APPEARANCE[transaction.status],
    },
  ];

  if (transaction.panLast4) {
    rows.push({
      id: "card",
      label: t("payTab.cardTransactions.detail.card"),
      value: formatMaskedPanLast4(transaction.panLast4),
      infoLabel: t("payTab.cardTransactions.detail.cardInfo"),
    });
  }

  const fundingSource = formatFundingSources(transaction.fundingSources, formatters?.amount);
  if (fundingSource) {
    rows.push({
      id: "fundingSource",
      label: t("payTab.cardTransactions.detail.fundingSource"),
      value: fundingSource,
    });
  }

  const processorTransactionId = transaction.transactionId;
  if (processorTransactionId) {
    rows.push({
      id: "transactionId",
      label: t("payTab.cardTransactions.detail.transactionId"),
      value: processorTransactionId,
      copyLabel: t("payTab.cardTransactions.detail.copyTransactionId"),
      onCopy: () => copyToClipboard(processorTransactionId),
    });
  }

  return {
    merchant: formatMerchantName(transaction.merchantNameLocation),
    category: transaction.mccCategory,
    categoryLabel: t(`payTab.cardTransactions.categories.${transaction.mccCategory}`),
    dateLabel: formatTransactionDetailDateTime(
      transaction.dateTime,
      (key, options) => t(`payTab.cardTransactions.detail.${key}`, options),
      formatters?.date,
    ),
    rows,
  };
}
