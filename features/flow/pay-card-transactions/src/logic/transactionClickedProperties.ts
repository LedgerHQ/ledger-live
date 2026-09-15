import type { PayCardTransaction } from "@domain/api-card-management";

export type CardTransactionClickedProperties = Readonly<{
  category: "card";
  transaction: "in" | "out";
  page: "Pay";
  cardFundSourceAsset?: string;
}>;

export function transactionClickedProperties(
  transaction: PayCardTransaction,
): CardTransactionClickedProperties {
  const cardFundSourceAsset = transaction.fundingSources?.[0]?.currency.toUpperCase();

  return {
    category: "card",
    transaction: transaction.sign === "CREDIT" ? "in" : "out",
    page: "Pay",
    ...(cardFundSourceAsset ? { cardFundSourceAsset } : {}),
  };
}
