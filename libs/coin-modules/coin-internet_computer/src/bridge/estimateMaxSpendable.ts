import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TRANSFER_TYPES, Transaction } from "../types";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  transaction,
}) => {
  const isTransfer = !transaction || TRANSFER_TYPES.has(transaction.type);
  const fees = isTransfer ? (transaction?.fees ?? getEstimatedFees()) : new BigNumber(0);

  const maxSpendable = account.balance.minus(fees);
  return maxSpendable.isLessThan(0) ? new BigNumber(0) : maxSpendable;
};
