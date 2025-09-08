import type {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
} from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { HederaMemo } from "../types";

// FIXME:
export const validateIntent = async (
  currency: CryptoCurrency,
  transactionIntent: TransactionIntent<HederaMemo>,
  customFees?: FeeEstimation,
): Promise<TransactionValidation> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value || 0n;
  const totalSpent = transactionIntent.amount + estimatedFees;
  const amount = transactionIntent.amount;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
