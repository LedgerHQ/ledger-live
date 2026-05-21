import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";

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
