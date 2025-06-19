import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["estimateMaxSpendable"] = async ({ account, transaction }) => {
  const balance = account.balance;

  let maxSpendable = balance.minus(transaction?.fees ?? getEstimatedFees());

  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return maxSpendable;
};
