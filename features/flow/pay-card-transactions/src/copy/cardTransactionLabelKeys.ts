import type { PayCardTransaction } from "@domain/api-card-management";

const STATUS_LABEL_KEYS = {
  CONFIRMED: "payTab.cardTransactions.detail.statusValues.CONFIRMED",
  PENDING: "payTab.cardTransactions.detail.statusValues.PENDING",
  DECLINED: "payTab.cardTransactions.detail.statusValues.DECLINED",
  REVERTED: "payTab.cardTransactions.detail.statusValues.REVERTED",
} as const satisfies Record<PayCardTransaction["status"], string>;

const CATEGORY_LABEL_KEYS = {
  SUBSCRIPTIONS: "payTab.cardTransactions.categories.SUBSCRIPTIONS",
  FOOD: "payTab.cardTransactions.categories.FOOD",
  TRAVEL: "payTab.cardTransactions.categories.TRAVEL",
  ENTERTAINMENT: "payTab.cardTransactions.categories.ENTERTAINMENT",
  HEALTH: "payTab.cardTransactions.categories.HEALTH",
  ATM: "payTab.cardTransactions.categories.ATM",
  UTILITIES: "payTab.cardTransactions.categories.UTILITIES",
  MISC: "payTab.cardTransactions.categories.MISC",
} as const satisfies Record<PayCardTransaction["mccCategory"], string>;

export function statusLabelKey(status: keyof typeof STATUS_LABEL_KEYS) {
  return STATUS_LABEL_KEYS[status];
}

export function categoryLabelKey(category: keyof typeof CATEGORY_LABEL_KEYS) {
  return CATEGORY_LABEL_KEYS[category];
}
