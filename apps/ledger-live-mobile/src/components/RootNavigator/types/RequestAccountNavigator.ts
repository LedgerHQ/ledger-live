import type {
  CryptoOrTokenCurrency,
  Currency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";

import type { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";

export type RequestAccountNavigatorParamList = {
  [ScreenName.RequestAccountsSelectCrypto]: {
    currencies: Currency[];
    allowAddAccount?: boolean;
    onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
    onError?: (_: Error) => void;
  };
  [ScreenName.RequestAccountsSelectAccount]: {
    currencies: Currency[];
    currency: Currency;
    allowAddAccount?: boolean;
    onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
    onError?: (_: Error) => void;
  };
  [NavigatorName.RequestAccountsAddAccounts]: NavigatorScreenParams<AddAccountsNavigatorParamList> &
    Partial<{
      currency?: CryptoOrTokenCurrency;
      token?: TokenCurrency;
      inline?: boolean;
      returnToSwap?: boolean;
      analyticsPropertyFlow?: string;
      onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
      onError?: (_: Error) => void;
    }>;
};
