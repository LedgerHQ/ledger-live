import { SWAP_DATA_CDN } from "@ledgerhq/ledger-cal-service";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { getSwapProvider } from "../../providers/swap";

export const FILTER = {
  centralised: "centralised",
  decentralised: "decentralised",
  float: "float",
  fixed: "fixed",
} as const;

export const getAvailableAccountsById = (
  id: string,
  accounts: (AccountLike & { disabled?: boolean })[],
): (AccountLike & {
  disabled?: boolean | undefined;
})[] =>
  accounts
    .filter(acc => getAccountCurrency(acc)?.id === id && !acc.disabled)
    .sort((a, b) => b.balance.minus(a.balance).toNumber());

export const isRegistrationRequired = async (provider: string): Promise<boolean> => {
  const { needsBearerToken, needsKYC } = await getSwapProvider(provider);
  return needsBearerToken || needsKYC;
};

export const getProviderName = (provider: string): string => {
  const { displayName } = SWAP_DATA_CDN[provider] ?? { displayName: "" };
  return displayName;
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
