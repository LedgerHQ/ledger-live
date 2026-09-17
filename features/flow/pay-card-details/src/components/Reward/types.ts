import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";

export type RewardProps = Readonly<{
  formatters?: CardTransactionFormatters;
}>;

export type RewardViewProps = Readonly<{
  amount: string;
  subtitle: string;
}>;
