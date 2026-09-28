import type { PayCardTransaction } from "@domain/api-card-management";

export type CardTransactionClickedPage = "Pay" | "History";

export type CardTransactionClickedProperties = Readonly<{
  category: "card";
  transaction: "in" | "out";
  page: CardTransactionClickedPage;
  cardFundSourceAsset?: string;
}>;

export function transactionClickedProperties(
  transaction: PayCardTransaction,
  page: CardTransactionClickedPage = "Pay",
): CardTransactionClickedProperties {
  const cardFundSourceAsset = transaction.fundingSources?.[0]?.currency.toUpperCase();

  return {
    category: "card",
    transaction: transaction.sign === "CREDIT" ? "in" : "out",
    page,
    ...(cardFundSourceAsset ? { cardFundSourceAsset } : {}),
  };
}
