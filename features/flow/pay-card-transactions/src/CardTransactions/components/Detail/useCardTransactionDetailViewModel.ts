import type { PayCardTransaction } from "@domain/api-card-management";
import { useTranslation } from "@shared/i18n";
import { copyToClipboard } from "./copyToClipboard";
import {
  formatCashback,
  formatFundingLabel,
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

  const fundingSources = transaction.fundingSources;
  const fundingLabel = formatFundingLabel(
    fundingSources,
    count => t("payTab.cardTransactions.history.paidWithAssets", { count }),
    formatters?.amount,
  );
  if (fundingLabel) {
    const count = fundingSources?.length ?? 0;
    // The row has no room for every asset, so the breakdown moves under the info icon.
    const breakdown =
      count > 1 ? formatFundingSources(fundingSources, formatters?.amount) : undefined;

    rows.push({
      id: "fundingSource",
      label: t("payTab.cardTransactions.detail.fundingSource", { count }),
      value: fundingLabel,
      ...(breakdown ? { infoLabel: breakdown } : {}),
    });
  }

  const cashback = formatCashback(transaction.cashback, formatters?.amount);
  if (cashback) {
    rows.push({
      id: "cashback",
      label: t("payTab.cardTransactions.detail.cashback"),
      value: cashback,
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
