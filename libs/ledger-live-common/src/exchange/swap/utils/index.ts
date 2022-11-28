import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import jwtDecode from "jwt-decode";
import { getProviderConfig } from "../";
import { getAccountCurrency, makeEmptyTokenAccount } from "../../../account";
import { getEnv } from "../../../env";
import { Account, SubAccount, AccountLike } from "@ledgerhq/types-live";
import { CheckQuoteStatus, ValidKYCStatus } from "../types";

// Note: looks like we can't use an enum because this is used in LLD js code
export const KYC_STATUS = {
  pending: "pending",
  rejected: "closed",
  approved: "approved",
  upgradeRequired: "upgradeRequired",
} as const;

export type KYCStatus = typeof KYC_STATUS[keyof typeof KYC_STATUS];

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
  accounts: (AccountLike & { disabled?: boolean })[]
): (AccountLike & {
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
  try {
    const { exp } = jwtDecode<{ exp: number }>(jwtToken);

    const currentTime = new Date().getTime() / 1000;

    return currentTime > exp;
  } catch (e) {
    return true;
  }
};

// Note: used in UI (LLD / LLM)
export const getKYCStatusFromCheckQuoteStatus = (
  checkQuoteStatus: CheckQuoteStatus
): KYCStatus | null => {
  switch (checkQuoteStatus.codeName) {
    case "KYC_PENDING":
      return KYC_STATUS.pending;

    case "KYC_FAILED":
      return KYC_STATUS.rejected;

    case "KYC_UNDEFINED":
    case "KYC_UPGRADE_REQUIRED":
      return KYC_STATUS.upgradeRequired;

    case "RATE_VALID":
      return KYC_STATUS.approved;

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
  const baseUrl =
    getEnv("MOCK_SWAP_WIDGET_BASE_URL") ||
    (() => {
      switch (provider) {
        case "ftx":
          return "https://ftx.com";

        case "ftxus":
          return "https://ftx.us";

        default:
          break;
      }
    })();

  if (!baseUrl) {
    throw new Error(`Could not find domain for ${provider}`);
  }

  return `${baseUrl}/${type}?hideFrame=true&ledgerLive=true`;
};

// Note: used in UI (LLD / LLM)
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

// Note: used in UI (LLD / LLM)
export const shouldShowKYCBanner = ({
  provider,
  kycStatus,
}: {
  provider?: string;
  kycStatus: ValidKYCStatus | "rejected";
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

export const isRegistrationRequired = (provider: string): boolean => {
  const { needsBearerToken, needsKYC } = getProviderConfig(provider);
  return needsBearerToken || needsKYC;
};

export const getProviderName = (provider: string): string => {
  switch (provider) {
    case "cic":
    case "ftx":
    case "ftxus":
      return provider.toUpperCase();
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
};

export const getNoticeType = (
  provider: string
): { message: string; learnMore: boolean } => {
  switch (provider) {
    case "cic":
      return { message: "cic", learnMore: false };
    default:
      return { message: "default", learnMore: true };
  }
};
