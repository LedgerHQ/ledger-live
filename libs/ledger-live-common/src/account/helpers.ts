import {
  clearAccount as commonClearAccount,
  isAccountEmpty as commonIsAccountEmpty,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getAccountBridge } from "../bridge";

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
 * @deprecated In React components, use `useAccountBridge` to access the bridge synchronously,
 * then call `bridge.isAccountEmpty?.(account) ?? commonIsAccountEmpty(account)` inline.
 * In non-React contexts (e.g. Redux reducers) where no coin-specific override is needed,
 * import `isAccountEmpty` from `@ledgerhq/ledger-wallet-framework/account` directly.
 * This helper will be removed once `getAccountBridge` becomes async.
 */
export const isAccountEmpty = (a: AccountLike): boolean => {
  if (a.type === "Account") {
    let bridge;
    try {
      bridge = getAccountBridge(a);
    } catch {
      return commonIsAccountEmpty(a);
    }
    return bridge.isAccountEmpty?.(a) ?? commonIsAccountEmpty(a);
  }
  return commonIsAccountEmpty(a);
};

/**
 * @deprecated In React components, use `useAccountBridge` to access the bridge synchronously,
 * then call `(bridge.clearAccount?.(account) ?? commonClearAccount(account))` inline.
 * In non-React contexts (e.g. Redux reducers), import `clearAccount` from
 * `@ledgerhq/ledger-wallet-framework/account` directly (no coin-specific override needed there).
 * This helper will be removed once `getAccountBridge` becomes async.
 */
export function clearAccount<T extends AccountLike>(account: T): T {
  if (account.type === "Account") {
    let bridge;
    try {
      bridge = getAccountBridge(account);
    } catch {
      return commonClearAccount(account);
    }
    return (bridge.clearAccount?.(account) ?? commonClearAccount(account)) as T;
  }
  return commonClearAccount(account);
}

/**
 * @deprecated Use `useAccountBridge` to access the bridge synchronously, then call
 * `bridge.getStakesCount?.(mainAccount) ?? 0` inline.
 * This helper will be removed once `getAccountBridge` becomes async.
 */
export const getVotesCount = (
  account: AccountLike,
  parentAccount?: Account | null | undefined,
): number => {
  const mainAccount = getMainAccount(account, parentAccount);
  let bridge;
  try {
    bridge = getAccountBridge(mainAccount);
  } catch {
    return 0;
  }
  return bridge.getStakesCount?.(mainAccount) ?? 0;
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
