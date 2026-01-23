import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type {
  Transaction as AleoTransaction,
  TransactionStatus as AleoTransactionStatus,
} from "../types";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";

type Errors = Record<string, Error>;
type Warnings = Record<string, Error>;

export const getTransactionStatus: AccountBridge<
  AleoTransaction,
  Account,
  AleoTransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Errors = {};
  const warnings: Warnings = {};

  const estimatedFees = await estimateFees();
  const calculatedAmount = calculateAmount({ transaction, account, estimatedFees });

  return {
    amount: calculatedAmount.amount,
    totalSpent: calculatedAmount.totalSpent,
    estimatedFees,
    errors,
    warnings,
  };
};
