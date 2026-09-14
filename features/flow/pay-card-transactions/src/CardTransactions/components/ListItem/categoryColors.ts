import type { PayCardTransactionCategory } from "@domain/api-card-management";

export type CategoryColors = Readonly<{ light: string; dark: string }>;

// colors are not in the design system
export const CATEGORY_COLORS = {
  SUBSCRIPTIONS: { light: "#a65332", dark: "#f2b79c" },
  FOOD: { light: "#4f7f3e", dark: "#aed29d" },
  TRAVEL: { light: "#4f7f3e", dark: "#aed29d" },
  ENTERTAINMENT: { light: "#a65332", dark: "#f2b79c" },
  HEALTH: { light: "#75427d", dark: "#d4a7db" },
  ATM: { light: "#75427d", dark: "#d4a7db" },
  UTILITIES: { light: "#a23f4d", dark: "#efa5ab" },
  MISC: { light: "#a8502d", dark: "#edae8e" },
} satisfies Record<PayCardTransactionCategory, CategoryColors>;
