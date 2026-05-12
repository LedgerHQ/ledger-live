import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { loadBridgeExtensionsForFamily } from "../coin-modules/registry";
import { defaultBridgeExtensions } from "../bridge/defaultBridgeExtensions";

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
 * @deprecated Acquire the bridge first via `useAccountBridge(account)` (React)
 * or `getAccountBridge(account)` (non-React), then call `bridge.isAccountEmpty(account)`.
 */
export const isAccountEmpty = (a: AccountLike): boolean => {
  if (a.type === "Account") {
    const fn = loadBridgeExtensionsForFamily(a.currency.family).isAccountEmpty;
    if (fn) return fn(a);
  }
  return defaultBridgeExtensions.isAccountEmpty(a);
};

/**
 * @deprecated Acquire the bridge first via `useAccountBridge(account)` (React)
 * or `getAccountBridge(account)` (non-React), then call `bridge.clearAccount(account)`.
 */
export function clearAccount<T extends AccountLike>(account: T): T {
  if (account.type !== "Account") return defaultBridgeExtensions.clearAccount(account) as T;
  const fn = loadBridgeExtensionsForFamily(account.currency.family).clearAccount;
  return (fn ?? defaultBridgeExtensions.clearAccount)(account) as T;
}

/**
 * @deprecated Acquire the bridge first via `useAccountBridge(account, parentAccount)` (React)
 * or `getAccountBridge(account, parentAccount)` (non-React), then call
 * `bridge.getStakesCount(getMainAccount(account, parentAccount))`.
 */
export const getVotesCount = (
  account: AccountLike,
  parentAccount?: Account | null | undefined,
): number => {
  const mainAccount = getMainAccount(account, parentAccount);
  return (loadBridgeExtensionsForFamily(mainAccount.currency.family).getStakesCount ??
    defaultBridgeExtensions.getStakesCount)(mainAccount);
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
