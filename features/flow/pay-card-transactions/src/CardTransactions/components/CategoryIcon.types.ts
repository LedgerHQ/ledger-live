import type { PayCardTransactionCategory } from "@domain/api-card-management";

export type CategoryIconProps = Readonly<{
  category: PayCardTransactionCategory;
  categoryLabel: string;
  size?: 40 | 48;
}>;
