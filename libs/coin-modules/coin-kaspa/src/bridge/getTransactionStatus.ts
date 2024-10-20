import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import {
  KaspaAccount,
  KaspaTransactionCommon,
  KaspaTransactionStatusCommon,
} from "../types/bridge";

import { isValidKaspaAddress } from "../lib/kaspa-util";

import { InvalidAddress } from "@ledgerhq/errors";

export const getTransactionStatus: AccountBridge<
  KaspaTransactionCommon,
  KaspaAccount,
  KaspaTransactionStatusCommon
>["getTransactionStatus"] = async (account, transaction) => {
  // check mass
  // check fees
  // check inputs and outputs here?
  // validate as much as possible for a good user interaction

  const errors = {};

  if (!isValidKaspaAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress(
      `Address ${transaction.recipient} is not a valid kaspa address`,
    );
  }

  return {
    errors,
    warnings: {},
    estimatedFees: BigNumber(0),
    amount: BigNumber(0),
    totalSpent: BigNumber(0),
    later: "maybe",
  };
};

export default getTransactionStatus;
