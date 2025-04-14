import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../../types";

/**
 * Helper to get a subaccount from its id
 * Used to identify if a transaction is for a token account
 */
export const getSubAccount = (account: Account, transaction: Transaction): TokenAccount | undefined => {
  if (!transaction.subAccountId || !account.subAccounts) return undefined;
  
  const subAccount = account.subAccounts.find(a => a.id === transaction.subAccountId);
  return subAccount && subAccount.type === "TokenAccount" ? (subAccount as TokenAccount) : undefined;
};