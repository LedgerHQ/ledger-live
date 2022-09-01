import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "../../../const";

export type RequestAccountNavigatorParamList = {
  [ScreenName.RequestAccountsSelectCrypto]: {
    currencies: Currency[];
    allowAddAccount?: boolean;
    accounts: AccountLike[];
  };
  [ScreenName.RequestAccountsSelectAccount]: {
    currencies: Currency[];
    currency: Currency;
    allowAddAccount?: boolean;
    onSuccess?: (account: AccountLike, parentAccount?: AccountLike) => void;
    onError?: (_: Error) => void;
  };
  [NavigatorName.RequestAccountsAddAccounts]: undefined;
};
