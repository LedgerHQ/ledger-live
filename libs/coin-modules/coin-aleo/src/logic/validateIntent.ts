import type {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
} from "@ledgerhq/coin-framework/api/types";

export const validateIntent = async (
  _transactionIntent: TransactionIntent,
  _customFees?: FeeEstimation,
): Promise<TransactionValidation> => {
  throw new Error("validateIntent is not supported");
};
