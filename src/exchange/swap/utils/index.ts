import { CryptoCurrency, TokenCurrency } from "@ledgerhq/cryptoassets";
import jwtDecode from "jwt-decode";
import { getProviderConfig } from "../";
import { getAccountCurrency, makeEmptyTokenAccount } from "../../../account";
import { Account, SubAccount, TokenAccount } from "../../../types";
import type { CheckQuoteStatus, ExchangeRate } from "../types";

// Note: looks like we can't use an enum because this is used in LLD js code
export const KYC_STATUS = {
  pending: "pending",
  rejected: "closed",
  approved: "approved",
  upgradeRequierd: "upgradeRequierd",
};

export type KYCStatus = keyof typeof KYC_STATUS;

export const pickExchangeRate = (
  exchangeRates: ExchangeRate[],
  exchangeRate: ExchangeRate | null | undefined,
  setExchangeRate: (rate?: ExchangeRate | null) => void
): void => {
  const hasRates = exchangeRates?.length > 0;
  // If the user picked an exchange rate before, try to select the new one that matches.
  // Otherwise pick the first one.
  const rate =
    hasRates &&
    ((exchangeRate &&
      exchangeRates.find(
        ({ tradeMethod, provider }) =>
          tradeMethod === exchangeRate.tradeMethod &&
          provider === exchangeRate.provider
      )) ||
      exchangeRates[0]);
  setExchangeRate(rate || null);
};

export type AccountTuple = {
  account: Account | null | undefined;
  subAccount: SubAccount | null | undefined;
};

export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty?: boolean
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter((account) => account.currency.id === currency.parentCurrency.id)
      .map((account) => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: SubAccount) =>
                subAcc.type === "TokenAccount" &&
                subAcc.token.id === currency.id
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter((a) => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }
  return allAccounts
    .filter((account) => account.currency.id === currency.id)
    .map((account) => ({
      account,
      subAccount: null,
    }))
    .filter((a) => (hideEmpty ? a.account?.balance.gt(0) : true));
}

export const getAvailableAccountsById = (
  id: string,
  accounts: ((Account | TokenAccount) & { disabled?: boolean })[]
): ((Account | TokenAccount) & {
  disabled?: boolean | undefined;
})[] =>
  accounts
    .filter((acc) => getAccountCurrency(acc)?.id === id && !acc.disabled)
    .sort((a, b) => b.balance.minus(a.balance).toNumber());

// Note: used in UI (LLD / LLM)
export const isJwtExpired = (jwtToken: string): boolean => {
  /**
   * Note:
   * The JWT token should have at least an exp property (the expiration date of the token)
   */
  const { exp } = jwtDecode<{ exp: number }>(jwtToken);

  const currentTime = new Date().getTime() / 1000;

  return currentTime > exp;
};

// Note: used in UI (LLD / LLM)
export const getKYCStatusFromCheckQuoteStatus = (
  checkQuoteStatus: CheckQuoteStatus
): KYCStatus | null => {
  switch (checkQuoteStatus.codeName) {
    case "KYC_PENDING":
      return KYC_STATUS.pending as KYCStatus;

    case "KYC_FAILED":
      return KYC_STATUS.rejected as KYCStatus;

    case "KYC_UNDEFINED":
    case "KYC_UPGRADE_REQUIRED":
      return KYC_STATUS.upgradeRequierd as KYCStatus;

    case "RATE_VALID":
      return KYC_STATUS.approved as KYCStatus;

    // FIXME: should handle all other non KYC related error cases somewhere
    default:
      return null;
  }
};

// Note: used in UI (LLD / LLM)
export type WidgetTypes = "login" | "kyc" | "mfa";
export type FTXProviders = "ftx" | "ftxus";
export const getFTXURL = ({
  type,
  provider,
}: {
  type: WidgetTypes;
  provider: FTXProviders;
}): string => {
  const domain = (() => {
    switch (provider) {
      case "ftx":
        return "ftx.com";

      case "ftxus":
        return "ftx.us";

      default:
        break;
    }
  })();

  if (!domain) {
    throw new Error(`Could not find domain for ${provider}`);
  }

  return `https://${domain}/${type}?hideFrame=true&ledgerLive=true`;
};

// Node: used in UI (LLD / LLM)
export const shouldShowLoginBanner = ({
  provider,
  token,
}: {
  provider?: string;
  token?: string;
}): boolean => {
  if (!provider) {
    return false;
  }

  const providerConfig = getProviderConfig(provider);

  if (!providerConfig.needsBearerToken) {
    return false;
  }

  return !token || isJwtExpired(token);
};

// Node: used in UI (LLD / LLM)
export const shouldShowKYCBanner = ({
  provider,
  kycStatus,
}: {
  provider?: string;
  kycStatus: KYCStatus;
}): boolean => {
  if (!provider) {
    return false;
  }

  const providerConfig = getProviderConfig(provider);

  if (!providerConfig.needsKYC) {
    return false;
  }

  return kycStatus !== KYC_STATUS.approved;
};

export const getProviderName = (provider: string): string => {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return provider.toUpperCase();
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
};
