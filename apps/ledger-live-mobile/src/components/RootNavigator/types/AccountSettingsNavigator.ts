import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AccountSettingsNavigatorParamList = {
  [ScreenName.AccountSettingsMain]: {
    accountId: string;
    hasOtherAccountsForThisCrypto?: boolean;
  };
  [ScreenName.EditAccountName]:
    | {
        account?: Account;
        accountId?: string;
        accountName?: string;
        onAccountNameChange?: (name: string, changedAccount: Account) => void;
      }
    | undefined;
  [ScreenName.AdvancedLogs]?: {
    accountId: string;
  };
  [ScreenName.CurrencySettings]: {
    currencyId: string;
    headerTitle?: string;
  };
  [ScreenName.EditCurrencyUnits]: {
    currency: CryptoCurrency;
  };
  [ScreenName.Accounts]: { currency?: string; search?: string } | undefined;
};
