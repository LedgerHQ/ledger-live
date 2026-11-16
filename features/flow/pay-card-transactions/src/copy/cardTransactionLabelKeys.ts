import type {
  PAY_CARD_TRANSACTION_CATEGORIES,
  PAY_CARD_TRANSACTION_STATUSES,
} from "@domain/api-card-management";

type CardTransactionStatus = (typeof PAY_CARD_TRANSACTION_STATUSES)[number];
type CardTransactionCategory = (typeof PAY_CARD_TRANSACTION_CATEGORIES)[number];

export function statusLabelKey(status: CardTransactionStatus) {
  return `payTab.cardTransactions.detail.statusValues.${status}` as const;
}

export function categoryLabelKey(category: CardTransactionCategory) {
  return `payTab.cardTransactions.categories.${category}` as const;
}
