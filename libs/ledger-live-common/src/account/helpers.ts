import {
  clearAccount as commonClearAccount,
  isAccountEmpty as commonIsAccountEmpty,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import {
  loadClearAccountForFamily,
  loadGetVotesCountForFamily,
  loadIsAccountEmptyForFamily,
} from "../coin-modules/registry";

// TODO: remove this export and prefer import from root file.
export {
  accountWithMandatoryTokens,
  findTokenAccountByCurrency,
  flattenAccounts,
  getMainAccount,
  getAccountCurrency,
  getAccountSpendableBalance,
  getFeesCurrency,
  getFeesUnit,
  getParentAccount,
  isAccount,
  isAccountBalanceUnconfirmed,
  isTokenAccount,
  listSubAccounts,
  shortAddressPreview,
} from "@ledgerhq/ledger-wallet-framework/account/index";

export const isAccountEmpty = (a: AccountLike): boolean => {
  if (a.type === "Account") {
    const fn = loadIsAccountEmptyForFamily(a.currency.family);
    if (fn) return fn(a);
  }
  return commonIsAccountEmpty(a);
};

// clear account to a bare minimal version that can be restored via sync
// will preserve the balance to avoid user panic
export function clearAccount<T extends AccountLike>(account: T): T {
  return commonClearAccount(account, (account: Account) => {
    loadClearAccountForFamily(account.currency.family)?.(account);
  });
}

export const getVotesCount = (
  account: AccountLike,
  parentAccount?: Account | null | undefined,
): number => {
  const mainAccount = getMainAccount(account, parentAccount);
  return loadGetVotesCountForFamily(mainAccount.currency.family)?.(mainAccount) ?? 0;
};

/**
 * Load blacklisted tokens and organize them into sections by parent currency
 * @param tokenIds - Array of token IDs to load
 * @returns Array of sections with parent currency and tokens
 */
export async function loadBlacklistedTokenSections(
  tokenIds: string[],
): Promise<Array<{ parentCurrency: CryptoCurrency; tokens: TokenCurrency[] }>> {
  const tokens = await Promise.all(
    tokenIds.map(tokenId => getCryptoAssetsStore().findTokenById(tokenId)),
  );

  const sections: Array<{ parentCurrency: CryptoCurrency; tokens: TokenCurrency[] }> = [];

  for (const token of tokens) {
    if (token) {
      const parentCurrency = token.parentCurrency;
      const index = sections.findIndex(s => s.parentCurrency === parentCurrency);
      if (index < 0) {
        sections.push({
          parentCurrency,
          tokens: [token],
        });
      } else {
        sections[index].tokens.push(token);
      }
    }
  }

  return sections;
}
