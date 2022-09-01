import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../../const";

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
  [NavigatorName.RequestAccountsAddAccounts]: undefined;
};
