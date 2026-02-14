import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { makeEmptyTokenAccount, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";

// Helper function to get the correct account to return based on originalCurrency
export const getAccountToReturn = (
  parentAccount: Account,
  originalCurrency?: CryptoOrTokenCurrency,
): { account: Account | TokenAccount; parent?: Account } => {
  if (originalCurrency?.type === "TokenCurrency") {
    // Find existing token account or create an empty one
    const existingTokenAccount = parentAccount.subAccounts?.find(
      (subAcc): subAcc is TokenAccount =>
        subAcc.type === "TokenAccount" && subAcc.token.id === originalCurrency.id,
    );
    const tokenAccount =
      existingTokenAccount || makeEmptyTokenAccount(parentAccount, originalCurrency);
    // Use getMainAccount to get the parent account (which is the main account for a token)
    const mainAccount = getMainAccount(tokenAccount, parentAccount);
    return { account: tokenAccount, parent: mainAccount };
  }
  // For non-token accounts, the account itself is the main account
  // Using getMainAccount for consistency (returns parentAccount since it's already an Account)
  return { account: getMainAccount(parentAccount, undefined) };
};
