import { useMemo } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import { useTranslation } from "@shared/i18n";
import type { CardTransactionFormatters, CardTransactionItem } from "../../types";
import {
  formatCardTransactionTime,
  formatFundingSources,
  formatMerchantName,
  formatSignedAmount,
} from "../../CardTransactions/components/ListItem/formatCardTransactionItem";
import type { HistoryRowViewProps } from "./types";

const UNSUCCESSFUL_STATUSES = new Set<PayCardTransaction["status"]>(["DECLINED", "REVERTED"]);
const NO_CASHBACK = "—";

function statusLabelToneFor(
  status: PayCardTransaction["status"],
): HistoryRowViewProps["statusLabelTone"] {
  if (status === "DECLINED") return "error";
  if (status === "REVERTED") return "muted";
  return undefined;
}

export function useHistoryRowViewModel(
  item: CardTransactionItem,
  formatters?: CardTransactionFormatters,
): HistoryRowViewProps {
  const { t } = useTranslation();
  const { transaction, categoryLabel } = item;

  return useMemo(() => {
    const timeLabel = formatCardTransactionTime(transaction.dateTime);
    const isUnsuccessful = UNSUCCESSFUL_STATUSES.has(transaction.status);
    const statusLabel = t(`payTab.cardTransactions.detail.statusValues.${transaction.status}`);
    const fundingSources = transaction.fundingSources;
    const fundingAll = formatFundingSources(fundingSources, formatters?.amount);
    const hasMultipleFundingSources = (fundingSources?.length ?? 0) > 1;
    const cashback = transaction.cashback;

    return {
      id: transaction.id,
      merchant: formatMerchantName(transaction.merchantNameLocation),
      category: transaction.mccCategory,
      categoryLabel,
      status: transaction.status,
      time: timeLabel,
      statusLabel: isUnsuccessful ? statusLabel : undefined,
      statusLabelTone: isUnsuccessful ? statusLabelToneFor(transaction.status) : undefined,
      cashback: cashback
        ? (formatters?.amount?.(cashback.amount, cashback.currency, "crypto") ??
          `${cashback.amount} ${cashback.currency}`)
        : NO_CASHBACK,
      fundingLabel: hasMultipleFundingSources
        ? t("payTab.cardTransactions.history.paidWithAssets", { count: fundingSources?.length })
        : fundingAll,
      fundingTooltip: hasMultipleFundingSources ? fundingAll : undefined,
      fundingTooltipAriaLabel: hasMultipleFundingSources
        ? t("payTab.cardTransactions.history.columns.fundingSources")
        : undefined,
      amount: formatSignedAmount(transaction, formatters?.amount),
    };
  }, [categoryLabel, formatters, t, transaction]);
}
