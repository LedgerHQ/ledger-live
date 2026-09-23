import type { PayCardTransaction } from "@domain/api-card-management";

export type CardTransactionAmountKind = "fiat" | "crypto";

export type FormatCardTransactionAmount = (
  value: string,
  currency: string,
  kind: CardTransactionAmountKind,
) => string;

export type FormatCardTransactionDate = (date: Date) => string;

export type CardTransactionFormatters = Readonly<{
  amount?: FormatCardTransactionAmount;
  date?: FormatCardTransactionDate;
}>;

export type CardTransactionItem = Readonly<{
  transaction: PayCardTransaction;
  categoryLabel: string;
}>;

export type CardTransactionsViewModel = Readonly<{
  transactions: readonly CardTransactionItem[];
  isLoading: boolean;
  /** True for any read in flight, a further page included. */
  isFetching: boolean;
  isError: boolean;
  /** A further page is on its way; the first page has its own `isLoading`. */
  isLoadingMore: boolean;
  refetch: () => void;
  /** Absent once the provider has no page left to read, and once a read has failed. */
  loadMore?: () => void;
}>;
