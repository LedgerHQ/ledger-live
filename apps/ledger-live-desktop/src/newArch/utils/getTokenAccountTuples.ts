import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

/**
 *
 * @param asset  - The asset to get the token account tuples for
 * @param nestedAccounts - The nested accounts to search through
 * @returns An array of tuples containing the account and the token sub-account
 *
 * This function filters the nested accounts to find those that have sub-accounts
 */
export const getTokenAccountTuples = (asset: CryptoOrTokenCurrency, nestedAccounts: Account[]) => {
  return nestedAccounts
    .filter(account =>
      account.subAccounts?.some(
        subAcc => subAcc.token.id === asset.id || subAcc.token.id?.includes(asset.id),
      ),
    )
    .map(account => {
      const tokenSubAcc = account.subAccounts?.find(
        subAcc => subAcc.token.id === asset.id || subAcc.token.id?.includes(asset.id),
      );
      return { account, subAccount: tokenSubAcc };
    })
    .filter(tuple => !!tuple.subAccount);
};
