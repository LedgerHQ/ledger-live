import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import {
  KaspaAccount,
  KaspaTransactionCommon,
  KaspaTransactionStatusCommon,
} from "../types/bridge";

export const getTransactionStatus: AccountBridge<
  KaspaTransactionCommon,
  KaspaAccount,
  KaspaTransactionStatusCommon
>["getTransactionStatus"] = async (account, transaction) => {

  // check mass
  // check fees
  // check inputs and outputs here?
  // validate as much as possible for a good user interaction

  return {
    errors: {},
    warnings: {},
    estimatedFees: BigNumber(0),
    amount: BigNumber(0),
    totalSpent: BigNumber(0),
    later: "maybe",
  };
};
