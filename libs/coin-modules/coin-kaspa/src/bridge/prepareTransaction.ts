import { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, KaspaTransaction } from "../types/bridge";

/**
 * Calculate fees for the current transaction
 * @param {AlgorandAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<
  KaspaTransaction,
  KaspaAccount
>["prepareTransaction"] = async (account, transaction) => {
  return transaction;
};

export default prepareTransaction;
