import type { PayCardTransaction, PayCardTransactionCategory } from "@domain/api-card-management";

/** The provider classifies each charge itself, so this reads its label rather than deriving one. */
export function categoryOf(transaction: PayCardTransaction): PayCardTransactionCategory {
  return transaction.mccCategory;
}

export function transactionHasCategory(
  transaction: PayCardTransaction,
  category: PayCardTransactionCategory,
): boolean {
  return categoryOf(transaction) === category;
}
