import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import type {
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";

import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs7";
import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";

export type RequestAccountNavigatorParamList = {
  [ScreenName.RequestAccountsSelectCrypto]: {
    accounts$?: Observable<WalletAPIAccount[]>;
    currencies: CryptoOrTokenCurrency[];
    allowAddAccount?: boolean;
    onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
    onError?: (_: Error) => void;
  };
  [ScreenName.RequestAccountsSelectAccount]: {
    accounts$?: Observable<WalletAPIAccount[]>;
    currency: CryptoOrTokenCurrency;
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
