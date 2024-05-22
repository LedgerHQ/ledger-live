import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, SubAccount } from "@ledgerhq/types-live";
import { getAccountCurrency, makeEmptyTokenAccount } from "../../../account";
import { getProvidersAdditionalData } from "../../providers/swap";

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

const providerMap: Record<string, string> = {
  cic: "CIC",
  oneinch: "1inch",
  moonpay: "MoonPay",
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
  const { needsBearerToken, needsKYC } = getProvidersAdditionalData(provider);
  return needsBearerToken || needsKYC;
};

export const getProviderName = (provider: string): string =>
  providerMap[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);

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
