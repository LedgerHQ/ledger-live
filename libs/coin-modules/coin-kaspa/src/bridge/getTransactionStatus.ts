import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, KaspaTransaction, KaspaTransactionStatusCommon } from "../types/bridge";

/*
 * Here are the list of the differents things we check
 * - Check if recipient is the same in case of send
 * - Check if recipient is valid
 * - Check if amounts are set
 * - Check if fees are loaded
 * - Check if is a send Max and set the amount
 * - Check if Token is already optin at the recipient
 * - Check if memo is too long
 */
export const getTransactionStatus: AccountBridge<
  KaspaTransaction,
  KaspaAccount,
  KaspaTransactionStatusCommon
>["getTransactionStatus"] = async (account, transaction) => {
  return {
    errors: {},
    warnings: {},
    estimatedFees: BigNumber(0),
    amount: BigNumber(0),
    totalSpent: BigNumber(0),
    later: "maybe",
  };
};
