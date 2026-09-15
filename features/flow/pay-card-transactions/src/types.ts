import type { PayCardTransaction } from "@domain/api-card-management";

export type CardTransactionAmountKind = "fiat" | "crypto";

export type FormatCardTransactionAmount = (
  value: string,
  currency: string,
  kind: CardTransactionAmountKind,
) => string;

export type CardTransactionItem = Readonly<{
  transaction: PayCardTransaction;
  categoryLabel: string;
}>;

export type CardTransactionsViewModel = Readonly<{
  transactions: readonly CardTransactionItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}>;
