import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getProviderConfig } from "../";
import { getAccountCurrency, makeEmptyTokenAccount } from "../../../account";
import { Account, SubAccount, AccountLike } from "@ledgerhq/types-live";

export const FILTER = {
  centralised: "centralised",
  decentralised: "decentralised",
  float: "float",
  fixed: "fixed",
} as const;

export type AccountTuple = {
  account: Account | null | undefined;
  subAccount: SubAccount | null | undefined;
};

export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty?: boolean,
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter(account => account.currency.id === currency.parentCurrency.id)
      .map(account => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: SubAccount) =>
                subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter(a => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }
  return allAccounts
    .filter(account => account.currency.id === currency.id)
    .map(account => ({
      account,
      subAccount: null,
    }))
    .filter(a => (hideEmpty ? a.account?.balance.gt(0) : true));
}

export const getAvailableAccountsById = (
  id: string,
  accounts: (AccountLike & { disabled?: boolean })[],
): (AccountLike & {
  disabled?: boolean | undefined;
})[] =>
  accounts
    .filter(acc => getAccountCurrency(acc)?.id === id && !acc.disabled)
    .sort((a, b) => b.balance.minus(a.balance).toNumber());

export const isRegistrationRequired = (provider: string): boolean => {
  const { needsBearerToken, needsKYC } = getProviderConfig(provider);
  return needsBearerToken || needsKYC;
};

export const getProviderName = (provider: string): string => {
  switch (provider) {
    case "cic":
      return provider.toUpperCase();
    case "oneinch":
      return "1inch";
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
};

export const getNoticeType = (provider: string): { message: string; learnMore: boolean } => {
  switch (provider) {
    case "cic":
      return { message: "provider", learnMore: false };
    case "changelly":
      return {
        message: "provider",
        learnMore: false,
      };
    default:
      return { message: "default", learnMore: true };
  }
};

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

/**
 * Get complete DAPP URL
 * @param provider
 * @param providerURL
 *
 * This Func is to ensure a complete DAPP URL is generated if partial & incorrect path is provided.
 *
 * Example 1:
 *  actual: /platform/paraswap/#/0xdac17f958d2ee523a2206206994597c13d831ec7-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599/21.3?network=1
 *  expected: https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false&network=1#/0xdac17f958d2ee523a2206206994597c13d831ec7-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599/21.3
 *
 * Example 2:
 *  expected: /platform/1inch/#/1/unified/swap/usdt/shib?sourceTokenAmount=24.6
 *  actual: https://app.1inch.io/#/1/simple/swap/usdt/shib?ledgerLive=true&sourceTokenAmount=24.6
 */
export const getCustomDappUrl = ({
  provider,
  providerURL = "",
}: {
  provider: string;
  providerURL?: string;
}): string => {
  if (isValidUrl(providerURL)) {
    return providerURL;
  }

  const dappUrl =
    provider === "paraswap"
      ? "https://embedded.paraswap.io/?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false"
      : "https://app.1inch.io/?ledgerLive=true";
  const newUrl = `https://www.prefix.com/${providerURL}`;
  const isValidNewdUrl = isValidUrl(newUrl);

  if (isValidNewdUrl) {
    const { origin, search } = new URL(dappUrl);
    const { hash: fragment, searchParams } = new URL(newUrl);
    const [realFragment, query] = fragment.split("?");
    const urlSearchParams = new URLSearchParams(query);
    const allParams = {
      ...Object.fromEntries(new URLSearchParams(search)),
      ...Object.fromEntries(urlSearchParams.entries()),
      ...Object.fromEntries(searchParams),
    };

    /**
     * Providers should use the standard structure: query + fragment
     *
     * 1inch is currently not using the standard (fragment + query). To be refactored once providers follow the standard structure.
     * @see https://www.rfc-editor.org/rfc/rfc3986#section-4.2
     */
    const newDappUrl =
      provider === "oneinch"
        ? `${origin}/${realFragment}?${new URLSearchParams(allParams).toString()}`.replace(
            "/unified/",
            "/simple/",
          )
        : `${origin}?${new URLSearchParams(allParams).toString()}${realFragment}`;
    return newDappUrl;
  }
  return "";
};
