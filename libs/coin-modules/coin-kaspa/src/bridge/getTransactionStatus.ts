import { BigNumber } from "bignumber.js";
import { KaspaAccount, KaspaTransaction } from "../types/bridge";

import { isValidKaspaAddress } from "../lib/kaspa-util";

import { InvalidAddress } from "@ledgerhq/errors";
import { TransactionStatus } from "../../lib/types";

const getTransactionStatus = async (
  account: KaspaAccount,
  transaction: KaspaTransaction,
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};

  if (!isValidKaspaAddress(transaction.recipient)) {
    errors.recipientError = new InvalidAddress(
      `Address ${transaction.recipient} is not a valid kaspa address`,
    );
  }

  return {
    errors,
    warnings: {},
    estimatedFees: BigNumber(0),
    amount: BigNumber(0),
    totalSpent: BigNumber(0),
  };
};

export default getTransactionStatus;
