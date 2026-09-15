import type { PayCardTransaction, PayCardTransactionCategory } from "@domain/api-card-management";
import type { CardTransactionFormatters } from "../../../types";

export type CardTransactionDetailProps = Readonly<{
  transaction: PayCardTransaction;
  formatters?: CardTransactionFormatters;
}>;

export type CardTransactionDetailRow = Readonly<{
  id: "amount" | "status" | "card" | "fundingSource" | "transactionId";
  label: string;
  value: string;
  statusAppearance?: "success" | "gray" | "warning" | "error";
  infoLabel?: string;
  copyLabel?: string;
  onCopy?: () => void;
}>;

export type CardTransactionDetailViewProps = Readonly<{
  merchant: string;
  category: PayCardTransactionCategory;
  categoryLabel: string;
  dateLabel: string;
  rows: readonly CardTransactionDetailRow[];
}>;
