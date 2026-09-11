import type { PayCardTransaction, PayCardTransactionCategory } from "@domain/api-card-management";

export type CardTransactionItem = Readonly<{
  transaction: PayCardTransaction;
  category: PayCardTransactionCategory;
  categoryLabel: string;
}>;

export type CardTransactionsViewModel = Readonly<{
  transactions: readonly CardTransactionItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}>;
