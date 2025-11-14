import type { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";
import { DeviceSelectionNavigatorParamsList } from "LLM/features/DeviceSelection/types";

export type RequestAccountNavigatorParamList = {
  [ScreenName.RequestAccountsSelectCrypto]: {
    currencyIds?: string[];
    allowAddAccount?: boolean;
    onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  };
  [ScreenName.RequestAccountsSelectAccount]: {
    currency: CryptoOrTokenCurrency;
    allowAddAccount?: boolean;
    onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  };
  [NavigatorName.RequestAccountsAddAccounts]: NavigatorScreenParams<AddAccountsNavigatorParamList> &
    Partial<{
      currency?: CryptoOrTokenCurrency;
      token?: TokenCurrency;
      inline?: boolean;
      returnToSwap?: boolean;
      analyticsPropertyFlow?: string;
      onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
    }>;
  [NavigatorName.DeviceSelection]: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList> &
      Partial<{
        token?: TokenCurrency;
        inline?: boolean;
        returnToSwap?: boolean;
        analyticsPropertyFlow?: string;
        onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
      }>
  >;
};
