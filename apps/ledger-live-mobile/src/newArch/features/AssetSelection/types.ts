import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";

export type AssetSelectionNavigatorParamsList = {
  [ScreenName.AddAccountsSelectCrypto]: {
    filterCurrencyIds?: string[];
    currency?: string;
  };
  [ScreenName.SelectNetwork]:
    | {
        filterCurrencyIds?: string[];
        provider: {
          currenciesByNetwork: CryptoOrTokenCurrency[];
          providerId: string;
        };
      }
    | undefined;
  [NavigatorName.AddAccounts]: {
    screen: ScreenName;
    params: {
      currency: CryptoCurrency | TokenCurrency;
      createTokenAccount?: boolean;
    };
  };
  [NavigatorName.DeviceSelection]: {
    screen: ScreenName;
    params: {
      currency: CryptoCurrency;
      createTokenAccount?: boolean;
    };
  };
};
