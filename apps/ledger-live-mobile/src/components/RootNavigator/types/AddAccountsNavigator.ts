import type { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Device } from "@ledgerhq/types-devices";
import { Account } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AddAccountsNavigatorParamList = {
  [ScreenName.AddAccountsSelectCrypto]:
    | {
        filterCurrencyIds?: string[];
        currency?: string;
      }
    | undefined;
  [ScreenName.AddAccountsSelectDevice]: {
    currency?: CryptoOrTokenCurrency;
    inline?: boolean;
    returnToSwap?: boolean;
    analyticsPropertyFlow?: string;
    onSuccess?: () => void;
  };
  [ScreenName.AddAccountsAccounts]: {
    currency: CryptoOrTokenCurrency;
    device: Device;
    inline?: boolean;
    returnToSwap?: boolean;
    onSuccess?: (_?: unknown) => void;
  };
  [ScreenName.AddAccountsSuccess]?: {
    currency: CryptoOrTokenCurrency;
  };
  [ScreenName.EditAccountName]:
    | {
        account?: Account;
        accountId?: string;
        accountName?: string;
        onAccountNameChange?: (name: string, changedAccount: Account) => void;
      }
    | undefined;
  [ScreenName.AddAccountsTokenCurrencyDisclaimer]: {
    token: TokenCurrency;
    analyticsPropertyFlow?: string;
  };
};
