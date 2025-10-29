import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AccountsNavigatorParamList = {
  [ScreenName.Accounts]:
    | {
        currency?: string;
        search?: string;
        address?: string;
        currencyTicker?: string;
        currencyId?: string;
      }
    | undefined;
  [ScreenName.Account]: {
    account?: AccountLike;
    accountId?: string;
    parentId?: string;
    currencyId?: string;
    currencyType?: "CryptoCurrency" | "TokenCurrency";
  };
  [ScreenName.Assets]: undefined;
  [ScreenName.Asset]: {
    currency?: CryptoOrTokenCurrency;
    currencyId?: string;
  };
  [ScreenName.AccountsList]: {
    sourceScreenName: ScreenName;
    showHeader?: boolean;
    canAddAccount?: boolean;
    isSyncEnabled?: boolean;
    specificAccounts?: Account[] | TokenAccount[];
  };
};
