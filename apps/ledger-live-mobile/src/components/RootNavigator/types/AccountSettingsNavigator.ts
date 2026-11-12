import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";

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

  [NavigatorName.AccountSettings]: {
    screen: string;
    params: {
      account?: Account;
      onAccountNameChange?: (name: string, changedAccount: Account) => void;
    };
  };
};
