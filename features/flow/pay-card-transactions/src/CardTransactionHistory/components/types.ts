import type { PayCardTransaction } from "@domain/api-card-management";
import type { CardTransactionFormatters, CardTransactionItem } from "../../types";

export type HistorySection = Readonly<{ day?: Date; data: readonly CardTransactionItem[] }>;

export type HistoryRowProps = Readonly<{
  item: CardTransactionItem;
  formatters?: CardTransactionFormatters;
  onRowClick: (item: CardTransactionItem) => void;
}>;

export type HistoryRowViewProps = Readonly<{
  id: string;
  merchant: string;
  category: PayCardTransaction["mccCategory"];
  categoryLabel: string;
  status: PayCardTransaction["status"];
  time: string;
  statusLabel?: string;
  statusLabelTone?: "error" | "muted";
  cashback: string;
  fundingLabel?: string;
  fundingTooltip?: string;
  fundingTooltipAriaLabel?: string;
  amount: string;
}>;
