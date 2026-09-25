import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";

export type CardHistoryViewModel = Readonly<{
  formatters: CardTransactionFormatters;
  formatDay: (date: Date) => string;
  onGoToPay: () => void;
}>;
